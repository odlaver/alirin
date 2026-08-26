-- ---------------------------------------------------------------------------
-- P-2 · Rincian skor siap ditampilkan ke pengguna
-- ---------------------------------------------------------------------------
--
-- Dua perubahan, keduanya prasyarat sebelum rincian skor dipamerkan di layar.
--
-- 1. Poin tiap faktor kini berjumlah persis sama dengan skor akhir.
--    Sebelumnya tiap poin dibulatkan sendiri-sendiri, sehingga jumlahnya bisa
--    meleset satu poin dari skor -- mis. 47 + 0 + 7 = 54 pada laporan berskor
--    53. Selisih itu tidak terlihat selama rinciannya tidak ditampilkan.
--    Begitu ditampilkan, angka yang tidak berjumlah adalah cacat yang langsung
--    terlihat.
--
-- 2. Isi trigger dipindahkan ke fungsi yang menerima baris laporan, sehingga
--    rincian bisa dibangun ulang tanpa meng-UPDATE tabel reports. Ini
--    sekaligus memperbaiki bug laten: alirin_refresh_breakdown_on_photo
--    memakai `update reports set severity = severity`, dan pada dua laporan
--    berwilayah kosong UPDATE itu gagal karena reports_area_filled_check ikut
--    diperiksa. Artinya menambah foto ke laporan tersebut melempar error.

-- ---------------------------------------------------------------------------
-- 1. Pembagian sisa terbesar
-- ---------------------------------------------------------------------------
--
-- Tiap faktor mendapat bagian bulat ke bawah, lalu sisa poin dibagikan satu
-- per satu ke faktor dengan pecahan terbesar. Hasilnya selalu berjumlah
-- p_total, dan pembulatannya jatuh ke faktor yang paling berhak.

create or replace function public.alirin_apportion(p_exact numeric[], p_total integer)
returns integer[] language plpgsql immutable parallel safe as $$
declare
  v_n    integer := coalesce(array_length(p_exact, 1), 0);
  v_out  integer[];
  v_frac numeric[];
  v_gap  integer;
  v_best integer;
  i      integer;
begin
  if v_n = 0 then
    return array[]::integer[];
  end if;

  v_out  := array_fill(0, array[v_n]);
  v_frac := array_fill(0::numeric, array[v_n]);

  for i in 1 .. v_n loop
    v_out[i]  := floor(p_exact[i])::integer;
    v_frac[i] := p_exact[i] - floor(p_exact[i]);
  end loop;

  v_gap := p_total - (select coalesce(sum(x), 0) from unnest(v_out) as x);

  -- Sisa tidak pernah melebihi jumlah faktor, jadi perulangannya pendek.
  while v_gap > 0 loop
    v_best := 1;
    for i in 2 .. v_n loop
      if v_frac[i] > v_frac[v_best] then
        v_best := i;
      end if;
    end loop;
    v_out[v_best]  := v_out[v_best] + 1;
    v_frac[v_best] := -1;  -- sudah kebagian, tidak dipilih lagi
    v_gap := v_gap - 1;
  end loop;

  return v_out;
end $$;

-- Urutan faktor mengikuti tabel Proposal 4.4. Faktor tak dikenal jatuh ke
-- belakang alih-alih menghilang.
create or replace function public.alirin_factor_rank(p_factor text)
returns integer language sql immutable parallel safe as $$
  select coalesce(
    array_position(
      array['severity', 'history', 'weather', 'location', 'bukti', 'sensor']::text[],
      p_factor
    ),
    99
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Pembangun rincian yang bisa dipanggil langsung
-- ---------------------------------------------------------------------------

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
  v_points        integer[];
begin
  v_severity := public.alirin_severity_score(r.severity);
  v_history  := public.alirin_history_score(r.id::text, r.lat, r.lng, coalesce(r.created_at, now()));
  v_weather  := public.alirin_weather_score(r.rainfall_mm);
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

  -- Poin dibagi dari skor yang tersimpan, bukan dibulatkan sendiri-sendiri,
  -- supaya jumlahnya selalu sama dengan angka yang dilihat pengguna.
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
      case when v_weather is null
        then 'Data BMKG tidak tersedia, bobot dialihkan ke faktor lain'
        else round(r.rainfall_mm::numeric, 1)::text || ' mm dalam 3 jam (BMKG)' end),
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

-- ---------------------------------------------------------------------------
-- 3. Trigger memakai fungsi di atas
-- ---------------------------------------------------------------------------

create or replace function public.alirin_write_breakdown()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.alirin_rebuild_breakdown(new);
  return null;
end $$;

-- Foto disisipkan setelah baris laporan tersimpan, sehingga saat rincian
-- pertama kali ditulis jumlah fotonya masih nol. Trigger ini menyegarkannya
-- begitu foto menyusul -- kini tanpa meng-UPDATE reports.
create or replace function public.alirin_refresh_breakdown_on_photo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_report public.reports;
begin
  -- TG_OP diperiksa eksplisit dan di luar SQL: pada INSERT record OLD tidak
  -- ter-assign dan pada DELETE record NEW tidak ter-assign, jadi keduanya tidak
  -- boleh muncul dalam satu ekspresi yang sama.
  if tg_op = 'DELETE' then
    select * into v_report from public.reports where id = old.report_id;
  else
    select * into v_report from public.reports where id = new.report_id;
  end if;

  if found then
    perform public.alirin_rebuild_breakdown(v_report);
  end if;
  return null;
end $$;

-- Hanya dipanggil dari trigger. SECURITY DEFINER berarti fungsi ini menulis
-- dengan hak pemilik, jadi jangan biarkan klien memanggilnya sendiri dengan
-- baris karangan. Trigger tetap bisa karena ia berjalan sebagai pemilik.
revoke execute on function public.alirin_rebuild_breakdown(public.reports)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Bangun ulang rincian laporan yang sudah ada
-- ---------------------------------------------------------------------------
--
-- Lewat fungsi, bukan lewat UPDATE, sehingga dua laporan berwilayah kosong
-- ikut terbangun ulang alih-alih menggagalkan seluruh migrasi.

do $$
declare
  v_report public.reports;
begin
  for v_report in select * from public.reports loop
    perform public.alirin_rebuild_breakdown(v_report);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Urutan faktor yang ditentukan
-- ---------------------------------------------------------------------------
--
-- jsonb_agg tanpa ORDER BY mengembalikan baris dalam urutan yang tidak
-- dijanjikan. Selama rincian tidak ditampilkan, hal itu tidak terasa. Begitu
-- ditampilkan, urutan faktornya bisa berubah-ubah antar pemuatan. Urutannya
-- dipatok mengikuti tabel Proposal 4.4.

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
  ) as report_status_history
from public.reports r;

grant select on public.public_reports to anon, authenticated;

create or replace function public.get_report_by_tracking_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(r)
    || jsonb_build_object(
      'report_photos', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id, 'url', p.url, 'name', p.name,
              'type', p.type, 'size', p.size, 'kind', p.kind
            )
            order by p.created_at
          )
          from public.report_photos p
          where p.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'risk_breakdowns', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', coalesce(b.factor, b.id::text), 'label', b.label,
              'points', b.points, 'weight', b.weight, 'detail', b.detail
            )
            order by public.alirin_factor_rank(b.factor)
          )
          from public.risk_breakdowns b
          where b.report_id = r.id
        ),
        '[]'::jsonb
      ),
      'report_status_history', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object('status', h.status, 'actor', h.actor, 'note', h.note, 'at', h.at)
            order by h.at
          )
          from public.report_status_history h
          where h.report_id = r.id
        ),
        '[]'::jsonb
      )
    )
  from public.reports r
  where r.public_tracking_token = p_token
  limit 1;
$$;

revoke all on function public.get_report_by_tracking_token(text) from public;
grant execute on function public.get_report_by_tracking_token(text) to anon, authenticated;
