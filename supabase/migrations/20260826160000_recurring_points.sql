-- ---------------------------------------------------------------------------
-- P-4 · Titik berulang sebagai dasar rencana preventif
-- ---------------------------------------------------------------------------
--
-- Faktor "history" pada risk score mengukur kerumunan sesaat: berapa laporan
-- lain yang berdekatan pada saat sebuah laporan dinilai. Yang dibutuhkan
-- Proposal (§4.3.4, §7.2.4) berbeda: pengulangan LINTAS WAKTU -- berapa kali
-- satu titik bermasalah dalam setahun, dan seberapa sering ia berulang setelah
-- ditutup.
--
-- Fungsi di bawah mengelompokkan laporan dalam radius ~100 m dan menghitung
-- frekuensi, rentang tanggal, jeda rata-rata antar kejadian, serta apakah titik
-- itu pernah kembali bermasalah SETELAH sebuah laporan di sana selesai. Titik
-- yang berulang setelah ditangani adalah kandidat terkuat untuk pemeliharaan
-- terencana -- respons reaktif jelas belum menyelesaikannya.
--
-- Pengelompokannya sederhana dan deterministik: setiap laporan menjadi jangkar,
-- lalu menyerap laporan lain dalam radiusnya. Sebuah laporan hanya boleh menjadi
-- anggota satu klaster (klaster jangkar dengan laporan paling awal menang),
-- sehingga tidak ada penghitungan ganda. Ini bukan clustering hidrologis;
-- cukup untuk daftar preventif tingkat kota.

create or replace function public.alirin_recurring_points(
  p_window_days integer default 365,
  p_min_events  integer default 2,
  p_radius_km   double precision default 0.1
)
returns table (
  cluster_id       uuid,
  lat              double precision,
  lng              double precision,
  kecamatan        text,
  kelurahan        text,
  event_count      integer,
  first_at         timestamptz,
  last_at          timestamptz,
  avg_gap_days     double precision,
  recurred_after_done boolean,
  last_status      text,
  sample_code      text
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      r.id, r.lat, r.lng, r.kecamatan, r.kelurahan, r.code,
      r.status, r.created_at,
      row_number() over (order by r.created_at, r.id) as seq
    from public.reports r
    where r.status <> 'ditolak'
      and r.created_at >= now() - make_interval(days => p_window_days)
      -- Koordinat presisi hanya untuk staf. Peran authenticated juga mencakup
      -- warga anonim, jadi GRANT saja tidak cukup: penjagaan ada di dalam.
      and public.alirin_is_staff()
  ),
  -- Jangkar = laporan yang TIDAK berada dalam radius laporan lain yang lebih
  -- awal. Setiap laporan lalu menempel ke jangkar terdekat yang lebih awal
  -- (termasuk dirinya bila ia jangkar).
  anchors as (
    select b.*
    from base b
    where not exists (
      select 1 from base e
      where e.seq < b.seq
        and public.alirin_distance_km(b.lat, b.lng, e.lat, e.lng) <= p_radius_km
    )
  ),
  membership as (
    select
      b.id, b.status, b.created_at, b.code, b.lat, b.lng, b.kecamatan, b.kelurahan,
      (
        select a.id
        from anchors a
        where a.seq <= b.seq
          and public.alirin_distance_km(b.lat, b.lng, a.lat, a.lng) <= p_radius_km
        order by a.seq desc
        limit 1
      ) as anchor_id
    from base b
  ),
  grouped as (
    select
      m.anchor_id,
      count(*)::integer as event_count,
      min(m.created_at) as first_at,
      max(m.created_at) as last_at,
      -- Berulang setelah ditangani: ada laporan yang MASUK setelah sebuah
      -- laporan di titik yang sama SELESAI.
      bool_or(
        exists (
          select 1 from membership d
          where d.anchor_id = m.anchor_id
            and d.status = 'selesai'
            and d.created_at < m.created_at
        )
      ) as recurred_after_done
    from membership m
    group by m.anchor_id
  )
  select
    a.id as cluster_id,
    a.lat, a.lng, a.kecamatan, a.kelurahan,
    g.event_count,
    g.first_at,
    g.last_at,
    case when g.event_count > 1
      then round((extract(epoch from (g.last_at - g.first_at)) / 86400.0 / (g.event_count - 1))::numeric, 1)::double precision
      else null end as avg_gap_days,
    g.recurred_after_done,
    (select m.status from membership m where m.anchor_id = a.id order by m.created_at desc limit 1) as last_status,
    a.code as sample_code
  from grouped g
  join anchors a on a.id = g.anchor_id
  where g.event_count >= p_min_events
  order by g.recurred_after_done desc, g.event_count desc, g.last_at desc;
$$;

revoke all on function public.alirin_recurring_points(integer, integer, double precision) from public;
grant execute on function public.alirin_recurring_points(integer, integer, double precision) to authenticated;
