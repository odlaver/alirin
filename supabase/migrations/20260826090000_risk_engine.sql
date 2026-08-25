-- Risk & Priority Engine sebagai lapisan basis data.
--
-- Sebelum migrasi ini, risk score dihitung dua kali di sisi klien dengan rumus
-- yang berbeda (web 30/25/20/15/10, mobile 100% keparahan x pengali mode), dan
-- tidak satu pun sesuai bobot Proposal 4.4. Akibatnya seluruh laporan punya skor
-- berbeda antara nilai tersimpan dan nilai yang ditampilkan web.
--
-- Setelah migrasi ini basis data yang menghitung, lewat trigger, memakai rumus
-- tunggal di docs/RISK-ENGINE.md:
--   Risk Score = (0,35 x Keparahan) + (0,25 x Histori) + (0,25 x Cuaca) + (0,15 x Lokasi)
-- Klien tetap menghitung untuk pratinjau, tetapi angkanya selalu ditimpa di sini.

-- ---------------------------------------------------------------------------
-- 1. Kolom masukan cuaca
-- ---------------------------------------------------------------------------

-- Akumulasi curah hujan 3 jam ke depan dari prakiraan BMKG pada wilayah laporan,
-- diambil klien saat laporan dikirim lalu dibekukan supaya skor reproducible.
alter table public.reports
  add column if not exists rainfall_mm double precision;

alter table public.reports drop constraint if exists reports_rainfall_mm_check;
alter table public.reports
  add constraint reports_rainfall_mm_check
  check (rainfall_mm is null or rainfall_mm >= 0);

-- ---------------------------------------------------------------------------
-- 2. Master fasilitas publik (faktor Lokasi)
-- ---------------------------------------------------------------------------

create table if not exists public.public_facilities (
  id text primary key,
  name text not null,
  type text,
  lat double precision not null,
  lng double precision not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.public_facilities (id, name, type, lat, lng) values
  ('fac-rsam',      'RSUD Abdul Moeloek',     'Rumah sakit',  -5.3994, 105.2526),
  ('fac-stasiun',   'Stasiun Tanjung Karang', 'Transportasi', -5.4077, 105.2581),
  ('fac-bambu',     'Pasar Bambu Kuning',     'Pasar',        -5.4128, 105.2586),
  ('fac-terminal',  'Terminal Rajabasa',      'Transportasi', -5.3717, 105.2406),
  ('fac-unila',     'Universitas Lampung',    'Kampus',       -5.3648, 105.2438),
  ('fac-saburai',   'Lapangan Saburai',       'Ruang publik', -5.4238, 105.2588),
  ('fac-panjang',   'Pelabuhan Panjang',      'Pelabuhan',    -5.4729, 105.3182),
  ('fac-kangkung',  'Pasar Kangkung',         'Pasar',        -5.4395, 105.2674)
on conflict (id) do update set
  name = excluded.name, type = excluded.type,
  lat = excluded.lat, lng = excluded.lng;

alter table public.public_facilities enable row level security;

drop policy if exists "public_facilities_read" on public.public_facilities;
create policy "public_facilities_read"
on public.public_facilities for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 3. Fungsi sub-skor
-- ---------------------------------------------------------------------------

create or replace function public.alirin_distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable parallel safe as $$
  select 6371 * 2 * atan2(sqrt(h), sqrt(greatest(0, 1 - h)))
  from (
    select power(sin(radians(lat2 - lat1) / 2), 2)
         + cos(radians(lat1)) * cos(radians(lat2))
         * power(sin(radians(lng2 - lng1) / 2), 2) as h
  ) t;
$$;

-- Keparahan 0-100. Nilai tak dikenal jatuh ke 'ringan', sama seperti klien.
create or replace function public.alirin_severity_score(p_severity text)
returns integer language sql immutable parallel safe as $$
  select case p_severity
    when 'kritis' then 100
    when 'parah'  then 80
    when 'sedang' then 55
    else 25
  end;
$$;

-- Cuaca 0-100 dari curah hujan 3 jam, mengikuti kelas intensitas hujan BMKG.
-- NULL berarti data tidak tersedia; bobotnya nanti dibagi ulang.
create or replace function public.alirin_weather_score(p_rainfall_mm double precision)
returns integer language sql immutable parallel safe as $$
  select case
    when p_rainfall_mm is null or p_rainfall_mm < 0 then null
    when p_rainfall_mm = 0  then 0
    when p_rainfall_mm < 1  then 20
    when p_rainfall_mm < 5  then 45
    when p_rainfall_mm < 10 then 70
    when p_rainfall_mm < 20 then 88
    else 100
  end;
$$;

-- Lokasi 0-100 dari jarak ke fasilitas publik terdekat.
create or replace function public.alirin_location_score(
  p_lat double precision, p_lng double precision
) returns integer language sql stable parallel safe as $$
  select case
    when d is null then 10
    when d <= 0.25 then 100
    when d <= 0.5  then 80
    when d <= 1    then 58
    when d <= 2    then 34
    else 10
  end
  from (
    select min(public.alirin_distance_km(p_lat, p_lng, f.lat, f.lng)) as d
    from public.public_facilities f
    where f.active
  ) t;
$$;

-- Histori 0-100: kejadian berulang di titik yang sama, 180 hari sebelum laporan
-- ini dibuat. Jendela berlabuh pada created_at laporan yang dinilai supaya
-- skornya deterministik. Laporan yang ditolak tidak ikut dihitung.
create or replace function public.alirin_history_score(
  p_id text, p_lat double precision, p_lng double precision, p_created_at timestamptz
) returns integer language sql stable parallel safe as $$
  select least(100, count(*)::integer * 20)
  from public.reports r
  where r.id is distinct from p_id
    and r.status <> 'ditolak'
    and r.created_at <= p_created_at
    and r.created_at >= p_created_at - interval '180 days'
    -- Ditulis sebagai rentang, bukan abs(), supaya indeks reports_lat_lng_idx
    -- bisa dipakai. Kotak pembatas ini memangkas kandidat sebelum haversine.
    and r.lat between p_lat - 0.0035 and p_lat + 0.0035
    and r.lng between p_lng - 0.0035 and p_lng + 0.0035
    and public.alirin_distance_km(p_lat, p_lng, r.lat, r.lng) <= 0.35;
$$;

create index if not exists reports_lat_lng_idx on public.reports (lat, lng);
create index if not exists reports_created_at_status_idx on public.reports (created_at, status);

-- Penggabungan berbobot. Bila cuaca NULL, bobot 25% dibagi ulang proporsional
-- ke tiga faktor lain sehingga skor antar laporan tetap sebanding.
create or replace function public.alirin_risk_score(
  p_severity integer, p_history integer, p_weather integer, p_location integer
) returns integer language sql immutable parallel safe as $$
  select greatest(0, least(100, round(
    (p_severity * 35 + p_history * 25 + coalesce(p_weather, 0) * 25 + p_location * 15)::numeric
    / (35 + 25 + 15 + case when p_weather is null then 0 else 25 end)
  )::integer));
$$;

create or replace function public.alirin_risk_level(p_score integer)
returns text language sql immutable parallel safe as $$
  select case
    when p_score >= 80 then 'Kritis'
    when p_score >= 60 then 'Tinggi'
    when p_score >= 40 then 'Waspada'
    else 'Normal'
  end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger: skor selalu dihitung ulang di sini
-- ---------------------------------------------------------------------------

create or replace function public.alirin_apply_risk()
returns trigger language plpgsql as $$
declare
  v_severity integer;
  v_history  integer;
  v_weather  integer;
  v_location integer;
  v_score    integer;
begin
  v_severity := public.alirin_severity_score(new.severity);
  v_history  := public.alirin_history_score(new.id, new.lat, new.lng, coalesce(new.created_at, now()));
  v_weather  := public.alirin_weather_score(new.rainfall_mm);
  v_location := public.alirin_location_score(new.lat, new.lng);
  v_score    := public.alirin_risk_score(v_severity, v_history, v_weather, v_location);

  new.risk_score := v_score;
  new.risk_level := public.alirin_risk_level(v_score);

  -- Arsip mengikuti status, tidak bergantung pada klien mana yang menulis.
  if new.status in ('selesai', 'ditolak') then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  return new;
end $$;

drop trigger if exists reports_apply_risk on public.reports;
create trigger reports_apply_risk
before insert or update of severity, lat, lng, rainfall_mm, created_at, status
on public.reports
for each row execute function public.alirin_apply_risk();

-- Rincian skor: enam faktor tabel Proposal 4.4, dua di antaranya masih bobot 0.
create or replace function public.alirin_write_breakdown()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_severity      integer;
  v_history       integer;
  v_history_count integer;
  v_weather       integer;
  v_location      integer;
  v_total         integer;
  v_photos        integer;
  v_evidence      integer;
  v_near          record;
begin
  v_severity := public.alirin_severity_score(new.severity);
  v_history  := public.alirin_history_score(new.id, new.lat, new.lng, coalesce(new.created_at, now()));
  v_weather  := public.alirin_weather_score(new.rainfall_mm);
  v_location := public.alirin_location_score(new.lat, new.lng);
  v_total    := 35 + 25 + 15 + case when v_weather is null then 0 else 25 end;

  select count(*)::integer into v_history_count
  from public.reports r
  where r.id is distinct from new.id
    and r.status <> 'ditolak'
    and r.created_at <= coalesce(new.created_at, now())
    and r.created_at >= coalesce(new.created_at, now()) - interval '180 days'
    and r.lat between new.lat - 0.0035 and new.lat + 0.0035
    and r.lng between new.lng - 0.0035 and new.lng + 0.0035
    and public.alirin_distance_km(new.lat, new.lng, r.lat, r.lng) <= 0.35;

  select count(*)::integer into v_photos
  from public.report_photos p
  where p.report_id = new.id and coalesce(p.kind, 'report') = 'report';

  v_evidence := round(100.0 * (
      (case when v_photos > 0 then 1 else 0 end)
    + (case when length(coalesce(trim(new.description), '')) >= 10 then 1 else 0 end)
    + 1
  ) / 3.0);

  select f.name, public.alirin_distance_km(new.lat, new.lng, f.lat, f.lng) as d
    into v_near
  from public.public_facilities f
  where f.active
  order by 2 asc
  limit 1;

  delete from public.risk_breakdowns where report_id = new.id;

  insert into public.risk_breakdowns (report_id, id, label, points, weight, detail) values
    (new.id, 'severity', 'Keparahan laporan',
      round(v_severity * 35.0 / v_total), round(35.0 * 100 / v_total),
      'Tingkat ' || coalesce(new.severity, 'belum diisi')),
    (new.id, 'history', 'Histori kejadian',
      round(v_history * 25.0 / v_total), round(25.0 * 100 / v_total),
      v_history_count::text || ' laporan lain dalam radius 350 m, 180 hari terakhir'),
    (new.id, 'weather', 'Cuaca',
      case when v_weather is null then 0 else round(v_weather * 25.0 / v_total) end,
      case when v_weather is null then 0 else round(25.0 * 100 / v_total) end,
      case when v_weather is null
        then 'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain'
        else round(new.rainfall_mm::numeric, 1)::text || ' mm dalam 3 jam (BMKG)' end),
    (new.id, 'location', 'Dampak lokasi',
      round(v_location * 15.0 / v_total), round(15.0 * 100 / v_total),
      coalesce(v_near.name || ', ' || round(v_near.d::numeric, 1)::text || ' km',
               'Tidak ada fasilitas publik terdekat')),
    (new.id, 'bukti', 'Kelengkapan bukti', 0, 0,
      v_photos::text || ' foto, '
        || case when length(coalesce(trim(new.description), '')) >= 10
             then 'deskripsi lengkap' else 'deskripsi singkat' end
        || ', koordinat ada. Kelengkapan ' || v_evidence::text || '% (belum dibobot)'),
    (new.id, 'sensor', 'Sensor lapangan', 0, 0,
      'Menunggu integrasi IoT (roadmap Tahap 4)');

  return null;
end $$;

drop trigger if exists reports_write_breakdown on public.reports;
create trigger reports_write_breakdown
after insert or update of severity, lat, lng, rainfall_mm, description, status
on public.reports
for each row execute function public.alirin_write_breakdown();

-- Foto laporan disisipkan setelah baris laporan tersimpan, sehingga saat
-- alirin_write_breakdown berjalan jumlah fotonya masih nol. Trigger ini
-- menyegarkan rincian begitu fotonya menyusul.
create or replace function public.alirin_refresh_breakdown_on_photo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_report_id text;
begin
  -- TG_OP diperiksa eksplisit: pada DELETE record NEW tidak ter-assign, jadi
  -- membaca new.report_id di sana bisa melempar error saat dijalankan.
  if tg_op = 'DELETE' then
    v_report_id := old.report_id;
  else
    v_report_id := new.report_id;
  end if;

  -- Menyentuh kolom dengan nilainya sendiri; yang dituju hanya memicu
  -- alirin_write_breakdown agar jumlah foto pada rincian ikut diperbarui.
  update public.reports set severity = severity where id = v_report_id;
  return null;
end $$;

drop trigger if exists report_photos_refresh_breakdown on public.report_photos;
create trigger report_photos_refresh_breakdown
after insert or delete on public.report_photos
for each row execute function public.alirin_refresh_breakdown_on_photo();

-- ---------------------------------------------------------------------------
-- 5. Trigger: penjaga transisi status
-- ---------------------------------------------------------------------------
--
-- Sebelum ini hanya web yang menegakkan urutan status; mobile menulis apa saja,
-- sehingga tercatat lompatan masuk -> dijadwalkan dan dijadwalkan -> selesai.
-- Aturan di sini identik dengan app/src/domain/status.js.

create or replace function public.alirin_allowed_status_transition(p_from text, p_to text)
returns boolean language sql immutable parallel safe as $$
  select case
    when p_from = p_to then true
    when p_from = 'masuk'        then p_to in ('diverifikasi', 'ditolak')
    when p_from = 'diverifikasi' then p_to in ('dijadwalkan', 'ditolak', 'masuk')
    when p_from = 'dijadwalkan'  then p_to in ('ditangani', 'diverifikasi', 'ditolak')
    when p_from = 'ditangani'    then p_to in ('selesai', 'dijadwalkan', 'diverifikasi')
    else false
  end;
$$;

create or replace function public.alirin_guard_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not public.alirin_allowed_status_transition(old.status, new.status) then
      raise exception
        'Transisi status tidak valid: % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    -- Bukti penyelesaian wajib. Proposal 4.3.3 menempatkan bukti tindak lanjut
    -- sebagai syarat penutupan, dan 5.4 menuntut bukti penyelesaian yang jelas.
    if new.status = 'selesai'
       and coalesce(jsonb_array_length(new.completion_photos), 0) = 0
       and not exists (
         select 1 from public.report_photos p
         where p.report_id = new.id and p.kind = 'completion'
       )
    then
      raise exception
        'Laporan tidak dapat ditutup tanpa foto bukti penyelesaian.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists reports_guard_status on public.reports;
create trigger reports_guard_status
before update on public.reports
for each row execute function public.alirin_guard_status();

-- ---------------------------------------------------------------------------
-- 6. Identitas petugas
-- ---------------------------------------------------------------------------
--
-- reports.assigned_officer_id sebelumnya string bebas tanpa rujukan apa pun,
-- dan tabel officers tidak terhubung ke akun Auth.

alter table public.officers
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists officers_auth_user_id_idx
  on public.officers (auth_user_id) where auth_user_id is not null;

-- Daftar petugas dibaca aplikasi untuk penugasan, jadi nama & wilayah boleh
-- terbaca staff. Nomor telepon tetap hanya untuk staff yang login.
drop policy if exists "officers_staff_select" on public.officers;
create policy "officers_staff_select"
on public.officers for select to authenticated using (public.alirin_is_staff());

-- ---------------------------------------------------------------------------
-- 7. Hak akses
-- ---------------------------------------------------------------------------

-- Rincian skor kini ditulis trigger, bukan klien.
drop policy if exists "risk_breakdowns_public_insert" on public.risk_breakdowns;

-- Foto hanya boleh ditempelkan ke laporan yang baru masuk, bukan ke laporan
-- mana pun milik orang lain.
drop policy if exists "report_photos_public_insert" on public.report_photos;
create policy "report_photos_public_insert"
on public.report_photos for insert to anon, authenticated
with check (
  public.alirin_is_staff()
  or (
    coalesce(kind, 'report') = 'report'
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.status = 'masuk'
    )
  )
);

-- Riwayat status awal juga hanya untuk laporan yang masih berstatus masuk.
drop policy if exists "report_status_history_public_insert" on public.report_status_history;
create policy "report_status_history_public_insert"
on public.report_status_history for insert to anon, authenticated
with check (
  public.alirin_is_staff()
  or (
    status = 'masuk'
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.status = 'masuk'
    )
  )
);

-- Policy Storage. Dideklarasikan ulang di sini karena terbukti tidak ada di
-- project live: sesi admin mengirim DELETE ke /storage/v1/object/reports dan
-- dijawab HTTP 200 dengan nol berkas terhapus, artinya RLS menyaring semua
-- baris. Akibatnya berkas yatim tidak bisa dibersihkan lewat aplikasi sama
-- sekali. Gejala yang sama dengan CHECK constraint yang hilang: migrasi
-- 20260605000100 memakai bentuk yang tidak pernah dieksekusi di remote.
drop policy if exists "reports_storage_public_read" on storage.objects;
create policy "reports_storage_public_read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'reports');

drop policy if exists "reports_storage_public_upload" on storage.objects;
create policy "reports_storage_public_upload"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'reports'
  and (storage.foldername(name))[1] = 'report-photos'
);

drop policy if exists "reports_storage_staff_update" on storage.objects;
create policy "reports_storage_staff_update"
on storage.objects for update to authenticated
using (bucket_id = 'reports' and public.alirin_is_staff())
with check (bucket_id = 'reports' and public.alirin_is_staff());

drop policy if exists "reports_storage_staff_delete" on storage.objects;
create policy "reports_storage_staff_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'reports' and public.alirin_is_staff());

-- Moderasi: admin perlu jalan menghapus spam, duplikat, dan data uji.
-- Sebelumnya tidak ada policy DELETE sama sekali di seluruh tabel.
drop policy if exists "reports_admin_delete" on public.reports;
create policy "reports_admin_delete"
on public.reports for delete to authenticated
using (public.alirin_user_role() = 'admin');

drop policy if exists "report_photos_admin_delete" on public.report_photos;
create policy "report_photos_admin_delete"
on public.report_photos for delete to authenticated
using (public.alirin_user_role() = 'admin');

drop policy if exists "risk_breakdowns_admin_delete" on public.risk_breakdowns;
create policy "risk_breakdowns_admin_delete"
on public.risk_breakdowns for delete to authenticated
using (public.alirin_user_role() = 'admin');

drop policy if exists "report_status_history_admin_delete" on public.report_status_history;
create policy "report_status_history_admin_delete"
on public.report_status_history for delete to authenticated
using (public.alirin_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 8. View publik: koordinat dibulatkan
-- ---------------------------------------------------------------------------
--
-- Proposal 5.4: "data pelapor dan koordinat hanya dapat diakses petugas
-- berwenang". View lama mengekspos lat/lng presisi penuh ke anon, cukup untuk
-- menunjuk rumah pelapor. Pembulatan 3 desimal ~110 m: masih akurat untuk peta
-- risiko kota, tidak lagi menunjuk bangunan.

drop view if exists public.public_reports;

create view public.public_reports as
select
  r.id,
  r.code,
  r.category,
  r.description,
  r.address,
  round(r.lat::numeric, 3)::double precision as lat,
  round(r.lng::numeric, 3)::double precision as lng,
  r.kecamatan,
  r.kelurahan,
  r.status,
  r.severity,
  r.risk_level,
  r.risk_score,
  r.submission_mode,
  r.rainfall_mm,
  r.assigned_officer_name,
  r.completion_photos,
  r.archived_at,
  r.created_at,
  r.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', p.id, 'url', p.url, 'name', p.name,
                           'type', p.type, 'size', p.size, 'kind', p.kind)
        order by p.created_at
      )
      from public.report_photos p
      where p.report_id = r.id and coalesce(p.kind, 'report') = 'report'
    ), '[]'::jsonb
  ) as report_photos,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('id', b.id, 'label', b.label, 'points', b.points,
                           'weight', b.weight, 'detail', b.detail)
      )
      from public.risk_breakdowns b
      where b.report_id = r.id
    ), '[]'::jsonb
  ) as risk_breakdowns,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
        order by h.at
      )
      from public.report_status_history h
      where h.report_id = r.id
    ), '[]'::jsonb
  ) as report_status_history
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Hitung ulang seluruh laporan yang sudah ada
-- ---------------------------------------------------------------------------
--
-- Menyentuh setiap baris agar trigger menyeragamkan risk_score, risk_level,
-- archived_at, dan rincian skor dengan rumus baru.
--
-- Wajib dijalankan SEBELUM constraint di bagian 10: constraint NOT VALID tetap
-- diperiksa pada setiap UPDATE, sehingga baris lama yang melanggar (severity
-- 'ngawur', wilayah kosong) akan menggagalkan seluruh migrasi bila urutannya
-- dibalik.

update public.reports set severity = severity;

-- ---------------------------------------------------------------------------
-- 10. Constraint integritas
-- ---------------------------------------------------------------------------
--
-- Migrasi 20260605000100 memakai "create table if not exists", sehingga pada
-- project yang tabelnya sudah ada lebih dulu seluruh CHECK di dalamnya tidak
-- pernah terpasang. Terbukti dari baris ber-severity 'ngawur' dan risk_level
-- 'Rendah' di database live. Constraint dipasang di sini secara eksplisit.
--
-- Dipasang NOT VALID supaya baris lama yang melanggar tidak memblokir migrasi;
-- penulisan baru tetap ditolak. Migrasi pembersihan berikutnya yang mem-VALIDATE
-- setelah baris uji dibuang.

alter table public.reports drop constraint if exists reports_severity_check;
alter table public.reports add constraint reports_severity_check
  check (severity in ('ringan', 'sedang', 'parah', 'kritis')) not valid;

alter table public.reports drop constraint if exists reports_category_check;
alter table public.reports add constraint reports_category_check
  check (category in ('sumbatan', 'genangan', 'aliran-lambat', 'drainase-rusak', 'bau', 'lainnya')) not valid;

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('masuk', 'diverifikasi', 'dijadwalkan', 'ditangani', 'selesai', 'ditolak')) not valid;

alter table public.reports drop constraint if exists reports_risk_score_check;
alter table public.reports add constraint reports_risk_score_check
  check (risk_score between 0 and 100) not valid;

alter table public.reports drop constraint if exists reports_risk_level_check;
alter table public.reports add constraint reports_risk_level_check
  check (risk_level in ('Normal', 'Waspada', 'Tinggi', 'Kritis')) not valid;

-- Batas wilayah Kota Bandar Lampung. Koordinat di luar ini adalah salah isi,
-- bukan laporan yang sah.
alter table public.reports drop constraint if exists reports_coordinate_bounds_check;
alter table public.reports add constraint reports_coordinate_bounds_check
  check (lat between -5.62 and -5.28 and lng between 105.15 and 105.36) not valid;

alter table public.reports drop constraint if exists reports_area_filled_check;
alter table public.reports add constraint reports_area_filled_check
  check (length(trim(kecamatan)) > 0 and length(trim(kelurahan)) > 0) not valid;

alter table public.reports drop constraint if exists reports_assigned_officer_fk;
alter table public.reports add constraint reports_assigned_officer_fk
  foreign key (assigned_officer_id) references public.officers (id)
  on delete set null not valid;

comment on function public.alirin_risk_score(integer, integer, integer, integer) is
  'Risk & Priority Engine ALIRIN. Bobot Proposal 4.4: keparahan 35, histori 25, cuaca 25, lokasi 15. Spesifikasi: docs/RISK-ENGINE.md';
