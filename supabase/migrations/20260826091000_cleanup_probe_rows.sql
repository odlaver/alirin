-- Pembersihan artefak probe dan pengaktifan constraint.
--
-- WAJIB dijalankan SETELAH 20260826090000_risk_engine.sql. Migrasi itulah yang
-- membuat constraint-nya; tanpa itu, VALIDATE di bawah tidak punya sasaran.
--
-- Yang dihapus HANYA baris yang tokennya berpola 'trk_probe_%'. Baris itu
-- ditanam manual saat pengujian lubang akses, bukan lewat aplikasi: tokennya
-- bisa ditebak, severity-nya 'ngawur' (nilai yang tidak pernah dihasilkan
-- aplikasi mana pun), dan tidak punya riwayat status sama sekali.
--
-- Yang SENGAJA TIDAK dihapus:
--   ALR-2026-9988/9989/9990 - kiriman mobile Lapor Cepat yang sah. Tidak punya
--     foto karena versi mobile lama memang tidak mewajibkannya pada mode Cepat.
--     Ini data uji pemakaian, bukan sampah.
--   ALR-2026-0013/0014 - wilayahnya kosong dan koordinatnya jatuh ke titik
--     cadangan pusat kota. Rusak, tetapi isinya laporan sungguhan. Perbaikan
--     atau penghapusannya diserahkan ke admin lewat policy DELETE yang baru,
--     bukan diputuskan migrasi.

-- ---------------------------------------------------------------------------
-- 0. Pastikan migrasi Risk Engine sudah berjalan
-- ---------------------------------------------------------------------------
--
-- Tanpa penjagaan ini, menjalankan berkas ini lebih dulu berakhir dengan
-- "constraint reports_severity_check does not exist" yang tidak menjelaskan
-- apa pun tentang penyebabnya.

do $$
begin
  if to_regprocedure('public.alirin_risk_score(integer,integer,integer,integer)') is null then
    raise exception
      'Migrasi 20260826090000_risk_engine.sql belum dijalankan. Jalankan berkas itu lebih dulu, baru berkas ini.'
      using errcode = 'raise_exception';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Hapus artefak probe
-- ---------------------------------------------------------------------------

delete from public.reports
where public_tracking_token like 'trk\_probe\_%';

-- ---------------------------------------------------------------------------
-- 2. Aktifkan constraint yang sudah bisa lolos untuk seluruh baris tersisa
-- ---------------------------------------------------------------------------
--
-- Di-VALIDATE satu per satu di dalam blok. Constraint yang belum ada dilewati
-- dengan catatan, dan constraint yang masih dilanggar baris lama tidak
-- membatalkan seluruh migrasi.

do $$
declare
  target text;
begin
  foreach target in array array[
    'reports_severity_check',
    'reports_category_check',
    'reports_status_check',
    'reports_risk_score_check',
    'reports_risk_level_check',
    'reports_coordinate_bounds_check',
    'reports_assigned_officer_fk'
  ]
  loop
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.reports'::regclass and conname = target
    ) then
      raise notice 'Dilewati: constraint % belum ada.', target;
      continue;
    end if;

    begin
      execute format('alter table public.reports validate constraint %I', target);
      raise notice 'Aktif: %.', target;
    exception when others then
      raise notice 'Belum bisa diaktifkan: % (%). Perbaiki baris yang melanggar lalu ulangi.', target, sqlerrm;
    end;
  end loop;
end $$;

-- reports_area_filled_check sengaja tidak ikut divalidasi: ALR-2026-0013 dan
-- ALR-2026-0014 masih berwilayah kosong. Menebak wilayahnya berarti mengarang
-- data. Constraint tetap menolak penulisan baru; jalankan
--   alter table public.reports validate constraint reports_area_filled_check;
-- setelah kedua baris itu diperbaiki atau dihapus admin.
