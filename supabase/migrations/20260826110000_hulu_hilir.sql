-- ---------------------------------------------------------------------------
-- P-3 · Relasi hulu-hilir
-- ---------------------------------------------------------------------------
--
-- Inovasi ke-2 proposal, dan satu-satunya janji yang sampai sekarang nol
-- implementasi di kedua codebase. Wujudnya di sini bukan pemodelan hidrologi,
-- melainkan tiga hal sederhana:
--
--   1. Tabel relasi antar kecamatan, diisi dari wawancara lapangan yang sudah
--      ada di Proposal 1.1 dan 1.4. Tiap baris membawa kolom `sumber` supaya
--      asalnya bisa ditelusuri dan tidak ada yang mengarang relasi.
--   2. Cache curah hujan per kecamatan, diisi klien saat memanggil BMKG.
--   3. Faktor Cuaca membaca hujan di kecamatan hulu, bukan hanya di titik
--      laporan. Inilah yang menerjemahkan wawasan warga menjadi angka --
--      "hujan lokal belum tentu langsung memicu banjir" (Proposal 1.4).
--
-- Bobotnya tidak berubah: Cuaca tetap 25%. Yang berubah adalah nilai yang
-- masuk ke sub-skor Cuaca.

-- ---------------------------------------------------------------------------
-- 1. Relasi antar wilayah
-- ---------------------------------------------------------------------------

create table if not exists public.area_flow_relations (
  id              text primary key,
  kecamatan_hulu  text not null,
  kecamatan_hilir text not null,
  kekuatan        smallint not null,
  sumber          text not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint area_flow_kekuatan_check check (kekuatan between 1 and 3),
  constraint area_flow_beda_check check (kecamatan_hulu <> kecamatan_hilir),
  constraint area_flow_unik unique (kecamatan_hulu, kecamatan_hilir)
);

comment on column public.area_flow_relations.kekuatan is
  '3 = disebut langsung oleh warga di lokasi terdampak, 2 = disebut pada arah aliran umum, 1 = arah aliran umum dan berjarak jauh';
comment on column public.area_flow_relations.sumber is
  'Kutipan asal relasi. Tidak boleh diisi selain dari bukti lapangan yang tertulis.';

-- Seluruh baris di bawah berasal dari Proposal ALIRIN. Tidak ada yang
-- ditambahkan dari perkiraan sendiri.
--
-- Proposal 1.1: "Genangan di satu titik dapat dipengaruhi aliran dari Kemiling,
-- BKP, Gunung Betung, atau Batu Putu menuju Rajabasa, Telukbetung, Kedaton, dan
-- Sukarame."
--
-- Proposal 1.4, Kota Karang (Telukbetung): "Banjir besar di wilayah bawah dapat
-- dipengaruhi kiriman air dari Gunung Betung dan Batu Putu."
--
-- Proposal 1.4, Perumahan Gelora Persada (Rajabasa Raya): "Warga Rajabasa
-- mengenali hubungan banjir dengan hujan deras di Kemiling dan BKP."
--
-- Catatan pemetaan nama: BKP (Bukit Kemiling Permai) berada di Kecamatan
-- Kemiling; Batu Putu adalah kelurahan di Kecamatan Teluk Betung Barat;
-- Gunung Betung adalah kawasan perbukitan di atas Kemiling dan Teluk Betung
-- Barat; Kota Karang adalah kelurahan di Kecamatan Teluk Betung Timur.
-- "Telukbetung" pada Proposal 1.1 tidak menyebut satu dari empat kecamatan
-- Teluk Betung, jadi relasi yang bersandar padanya diberi kekuatan lebih rendah
-- daripada yang disebut langsung di 1.4.

insert into public.area_flow_relations (id, kecamatan_hulu, kecamatan_hilir, kekuatan, sumber) values
  ('flow-kemiling-rajabasa', 'Kemiling', 'Rajabasa', 3,
   'Proposal 1.4 Gelora Persada: warga Rajabasa mengenali hubungan banjir dengan hujan deras di Kemiling dan BKP'),
  ('flow-tbb-tbt', 'Teluk Betung Barat', 'Teluk Betung Timur', 3,
   'Proposal 1.4 Kota Karang: kiriman air dari Gunung Betung dan Batu Putu (Batu Putu = kelurahan di Teluk Betung Barat)'),
  ('flow-kemiling-tbb', 'Kemiling', 'Teluk Betung Barat', 2,
   'Proposal 1.1: aliran dari Kemiling dan Gunung Betung menuju Telukbetung'),
  ('flow-kemiling-kedaton', 'Kemiling', 'Kedaton', 2,
   'Proposal 1.1: aliran dari Kemiling dan BKP menuju Kedaton'),
  ('flow-kemiling-tbu', 'Kemiling', 'Teluk Betung Utara', 1,
   'Proposal 1.1: aliran menuju Telukbetung, kecamatannya tidak disebut spesifik'),
  ('flow-rajabasa-kedaton', 'Rajabasa', 'Kedaton', 2,
   'Proposal 1.1: Rajabasa dan Kedaton sama-sama penerima aliran, Rajabasa berada di atas Kedaton'),
  ('flow-kedaton-sukarame', 'Kedaton', 'Sukarame', 1,
   'Proposal 1.1: aliran menuju Kedaton dan Sukarame, Sukarame berada lebih hilir')
on conflict (id) do update set
  kecamatan_hulu = excluded.kecamatan_hulu,
  kecamatan_hilir = excluded.kecamatan_hilir,
  kekuatan = excluded.kekuatan,
  sumber = excluded.sumber;

alter table public.area_flow_relations enable row level security;

drop policy if exists "area_flow_relations_read" on public.area_flow_relations;
create policy "area_flow_relations_read"
on public.area_flow_relations for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 2. Cache curah hujan per kecamatan
-- ---------------------------------------------------------------------------
--
-- Satu baris per kecamatan, ditimpa setiap kali ada klien yang memanggil BMKG.
-- Kuncinya kecamatan, jadi tabelnya tidak bisa tumbuh melebihi 20 baris dan
-- tidak perlu dibersihkan berkala.
--
-- KEAMANAN: anon boleh menulis, sama seperti anon boleh mengirim laporan.
-- Nilainya dibatasi constraint 0-500 mm dan hanya dipakai bila umurnya di bawah
-- 3 jam, tetapi pengguna yang berniat jahat tetap bisa menaikkan angka satu
-- kecamatan. Selama masih prototipe ini dapat diterima; pemindahan panggilan
-- BMKG ke Edge Function (rekomendasi P-1) menutupnya sekaligus.

create table if not exists public.area_weather (
  kecamatan    text primary key,
  rainfall_mm  double precision not null,
  weather_desc text,
  observed_at  timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint area_weather_rainfall_check check (rainfall_mm >= 0 and rainfall_mm <= 500)
);

alter table public.area_weather enable row level security;

drop policy if exists "area_weather_read" on public.area_weather;
create policy "area_weather_read"
on public.area_weather for select to anon, authenticated using (true);

drop policy if exists "area_weather_write" on public.area_weather;
create policy "area_weather_write"
on public.area_weather for insert to anon, authenticated with check (true);

drop policy if exists "area_weather_update" on public.area_weather;
create policy "area_weather_update"
on public.area_weather for update to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 3. Curah hujan efektif
-- ---------------------------------------------------------------------------
--
-- Hujan di hulu tidak diteruskan bulat-bulat: dikalikan kekuatan relasi dibagi
-- 3, sehingga relasi yang disebut langsung oleh warga berpengaruh penuh dan
-- relasi arah aliran umum berpengaruh sebagian.
--
-- Yang dipakai adalah yang terbesar antara hujan lokal dan sumbangan hulu.
-- Bukan dijumlahkan: sub-skor Cuaca menyatakan intensitas hujan, bukan volume.

-- Nama kecamatan ditulis berbeda-beda: aplikasi memakai 'Teluk Betung Barat',
-- BMKG menulis 'Telukbetung Barat'. Pencocokan mengabaikan spasi dan tanda baca
-- supaya keduanya tetap bertemu.
create or replace function public.alirin_area_key(p_area text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(lower(coalesce(p_area, '')), '[^a-z0-9]', '', 'g');
$$;

create or replace function public.alirin_rain_context(
  p_kecamatan text,
  p_local     double precision,
  p_at        timestamptz
)
returns table (
  effective    double precision,
  up_kecamatan text,
  up_rainfall  double precision,
  up_effective double precision,
  up_kekuatan  smallint
)
language sql stable as $$
  with hulu as (
    select w.kecamatan, w.rainfall_mm, f.kekuatan,
           w.rainfall_mm * (f.kekuatan / 3.0) as sumbangan
    from public.area_flow_relations f
    join public.area_weather w
      on public.alirin_area_key(w.kecamatan) = public.alirin_area_key(f.kecamatan_hulu)
    where f.active
      and public.alirin_area_key(f.kecamatan_hilir) = public.alirin_area_key(p_kecamatan)
      and w.observed_at between p_at - interval '3 hours' and p_at + interval '3 hours'
    order by 4 desc
    limit 1
  )
  select
    case
      when p_local is null and not exists (select 1 from hulu) then null
      else greatest(coalesce(p_local, 0), coalesce((select sumbangan from hulu), 0))
    end,
    (select kecamatan from hulu),
    (select rainfall_mm from hulu),
    (select sumbangan from hulu),
    (select kekuatan from hulu);
$$;

-- Label intensitas hujan, mengikuti kelas BMKG yang sama dengan
-- describeRainfall di web dan RiskEngine.describeRainfall di mobile.
-- Sebelumnya hanya klien yang punya label ini, sehingga rincian yang tersimpan
-- di basis data berbunyi "18.0 mm dalam 3 jam" tanpa menyebut itu hujan lebat.
create or replace function public.alirin_rainfall_label(p_mm double precision)
returns text language sql immutable parallel safe as $$
  select case
    when p_mm is null or p_mm < 0 then 'Data BMKG belum tersedia'
    when p_mm = 0   then 'Tidak hujan'
    when p_mm < 1   then 'Gerimis'
    when p_mm < 5   then 'Hujan ringan'
    when p_mm < 10  then 'Hujan sedang'
    when p_mm < 20  then 'Hujan lebat'
    else 'Hujan sangat lebat'
  end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Laporan menyimpan konteks hulu yang dipakai
-- ---------------------------------------------------------------------------
--
-- Cache cuaca ditimpa terus-menerus, jadi nilai yang dipakai saat menilai harus
-- ikut tersimpan di barisnya. Tanpa ini skor lama tidak bisa direproduksi.

alter table public.reports add column if not exists upstream_kecamatan text;
alter table public.reports add column if not exists upstream_rainfall_mm double precision;

-- ---------------------------------------------------------------------------
-- 5. Trigger skor membaca hulu
-- ---------------------------------------------------------------------------

create or replace function public.alirin_apply_risk()
returns trigger language plpgsql as $$
declare
  v_severity integer;
  v_history  integer;
  v_weather  integer;
  v_location integer;
  v_score    integer;
  v_rain     record;
begin
  select * into v_rain from public.alirin_rain_context(
    new.kecamatan, new.rainfall_mm, coalesce(new.created_at, now())
  );

  v_severity := public.alirin_severity_score(new.severity);
  v_history  := public.alirin_history_score(new.id::text, new.lat, new.lng, coalesce(new.created_at, now()));
  v_weather  := public.alirin_weather_score(v_rain.effective);
  v_location := public.alirin_location_score(new.lat, new.lng);
  v_score    := public.alirin_risk_score(v_severity, v_history, v_weather, v_location);

  new.risk_score := v_score;
  new.risk_level := public.alirin_risk_level(v_score);

  -- Hanya dicatat bila hulu benar-benar yang menentukan; kalau hujan lokal
  -- lebih besar, mencantumkan hulu justru menyesatkan.
  if v_rain.up_kecamatan is not null
     and coalesce(v_rain.up_effective, 0) > coalesce(new.rainfall_mm, 0) then
    new.upstream_kecamatan := v_rain.up_kecamatan;
    new.upstream_rainfall_mm := v_rain.up_rainfall;
  else
    new.upstream_kecamatan := null;
    new.upstream_rainfall_mm := null;
  end if;

  -- Arsip mengikuti status, tidak bergantung pada klien mana yang menulis.
  if new.status in ('selesai', 'ditolak') then
    new.archived_at := coalesce(new.archived_at, now());
  else
    new.archived_at := null;
  end if;

  return new;
end $$;

create or replace function public.alirin_rebuild_breakdown(r public.reports)
returns void language plpgsql security definer set search_path = public as $$
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
  v_rain          record;
  v_points        integer[];
  v_weather_detail text;
begin
  select * into v_rain from public.alirin_rain_context(
    r.kecamatan, r.rainfall_mm, coalesce(r.created_at, now())
  );

  v_severity := public.alirin_severity_score(r.severity);
  v_history  := public.alirin_history_score(r.id::text, r.lat, r.lng, coalesce(r.created_at, now()));
  v_weather  := public.alirin_weather_score(v_rain.effective);
  v_location := public.alirin_location_score(r.lat, r.lng);
  v_total    := 35 + 25 + 15 + case when v_weather is null then 0 else 25 end;

  select count(*)::integer into v_history_count
  from public.reports x
  where x.id is distinct from r.id
    and x.status <> 'ditolak'
    and x.created_at <= coalesce(r.created_at, now())
    and x.created_at >= coalesce(r.created_at, now()) - interval '180 days'
    and x.lat between r.lat - 0.0035 and r.lat + 0.0035
    and x.lng between r.lng - 0.0035 and r.lng + 0.0035
    and public.alirin_distance_km(r.lat, r.lng, x.lat, x.lng) <= 0.35;

  select count(*)::integer into v_photos
  from public.report_photos p
  where p.report_id = r.id and coalesce(p.kind, 'report') = 'report';

  v_evidence := round(100.0 * (
      (case when v_photos > 0 then 1 else 0 end)
    + (case when length(coalesce(trim(r.description), '')) >= 10 then 1 else 0 end)
    + 1
  ) / 3.0);

  select f.name, public.alirin_distance_km(r.lat, r.lng, f.lat, f.lng) as d
    into v_near
  from public.public_facilities f
  where f.active
  order by 2 asc
  limit 1;

  -- Rinciannya harus menyebut hulu ketika hulu yang menentukan. Tanpa itu,
  -- pengguna melihat skor cuaca tinggi sementara di tempatnya sedang cerah,
  -- dan angkanya tampak salah padahal justru itu intinya.
  v_weather_detail := case
    when v_weather is null then
      'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain'
    when v_rain.up_kecamatan is not null
         and coalesce(v_rain.up_effective, 0) > coalesce(r.rainfall_mm, 0) then
      public.alirin_rainfall_label(v_rain.up_rainfall) || ' di hulu ' || v_rain.up_kecamatan
        || ' (' || round(v_rain.up_rainfall::numeric, 1)::text || ' mm, relasi '
        || case v_rain.up_kekuatan when 3 then 'kuat' when 2 then 'sedang' else 'lemah' end || ')'
        || ', lokal ' || round(coalesce(r.rainfall_mm, 0)::numeric, 1)::text || ' mm'
    else
      public.alirin_rainfall_label(r.rainfall_mm) || ', '
        || round(coalesce(r.rainfall_mm, 0)::numeric, 1)::text || ' mm dalam 3 jam (BMKG)'
  end;

  v_points := public.alirin_apportion(
    array[
      v_severity * 35.0 / v_total,
      v_history  * 25.0 / v_total,
      case when v_weather is null then 0 else v_weather * 25.0 / v_total end,
      v_location * 15.0 / v_total
    ],
    coalesce(r.risk_score, public.alirin_risk_score(v_severity, v_history, v_weather, v_location))
  );

  delete from public.risk_breakdowns where report_id = r.id;

  insert into public.risk_breakdowns (report_id, factor, label, points, weight, detail) values
    (r.id, 'severity', 'Keparahan laporan',
      v_points[1], round(35.0 * 100 / v_total),
      'Tingkat ' || coalesce(r.severity, 'belum diisi')),
    (r.id, 'history', 'Histori kejadian',
      v_points[2], round(25.0 * 100 / v_total),
      v_history_count::text || ' laporan lain dalam radius 350 m, 180 hari terakhir'),
    (r.id, 'weather', 'Cuaca',
      v_points[3],
      case when v_weather is null then 0 else round(25.0 * 100 / v_total) end,
      v_weather_detail),
    (r.id, 'location', 'Dampak lokasi',
      v_points[4], round(15.0 * 100 / v_total),
      coalesce(v_near.name || ', ' || round(v_near.d::numeric, 1)::text || ' km',
               'Tidak ada fasilitas publik terdekat')),
    (r.id, 'bukti', 'Kelengkapan bukti', 0, 0,
      v_photos::text || ' foto, '
        || case when length(coalesce(trim(r.description), '')) >= 10
             then 'deskripsi lengkap' else 'deskripsi singkat' end
        || ', koordinat ada. Kelengkapan ' || v_evidence::text || '% (belum dibobot)'),
    (r.id, 'sensor', 'Sensor lapangan', 0, 0,
      'Menunggu integrasi IoT (roadmap Tahap 4)');
end $$;

revoke execute on function public.alirin_rebuild_breakdown(public.reports)
  from public, anon, authenticated;

-- Kedua trigger harus ikut menyala saat kecamatan berubah, karena kecamatan
-- yang menentukan relasi hulu mana yang berlaku.
drop trigger if exists reports_apply_risk on public.reports;
create trigger reports_apply_risk
before insert or update of severity, lat, lng, rainfall_mm, created_at, status, kecamatan
on public.reports
for each row execute function public.alirin_apply_risk();

drop trigger if exists reports_write_breakdown on public.reports;
create trigger reports_write_breakdown
after insert or update of severity, lat, lng, rainfall_mm, description, status, kecamatan
on public.reports
for each row execute function public.alirin_write_breakdown();

-- ---------------------------------------------------------------------------
-- 6. View publik memancarkan konteks hulu
-- ---------------------------------------------------------------------------

create or replace view public.public_reports as
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
        jsonb_build_object('id', coalesce(b.factor, b.id::text), 'label', b.label,
                           'points', b.points, 'weight', b.weight, 'detail', b.detail)
        order by public.alirin_factor_rank(b.factor)
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
  ) as report_status_history,
  -- Kolom baru wajib di akhir: create or replace view tidak boleh menyisipkan
  -- kolom di tengah daftar yang sudah ada.
  r.upstream_kecamatan,
  r.upstream_rainfall_mm
from public.reports r;

grant select on public.public_reports to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Hitung ulang laporan yang sudah ada
-- ---------------------------------------------------------------------------
--
-- Cache cuaca masih kosong saat migrasi dijalankan, jadi tidak ada satu pun
-- laporan yang berubah skornya di sini, dan kolom hulu tetap null. Yang
-- dibangun ulang adalah rincian skornya, memakai teks detail Cuaca yang baru.

do $$
declare
  v_report public.reports;
begin
  for v_report in select * from public.reports loop
    perform public.alirin_rebuild_breakdown(v_report);
  end loop;
end $$;
