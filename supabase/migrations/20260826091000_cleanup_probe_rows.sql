-- Pembersihan artefak probe dan pengaktifan constraint.
--
-- Dijalankan setelah 20260826090000_risk_engine.sql.
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

delete from public.reports
where public_tracking_token like 'trk\_probe\_%';

-- ---------------------------------------------------------------------------
-- Aktifkan constraint yang sudah bisa lolos untuk seluruh baris tersisa
-- ---------------------------------------------------------------------------

alter table public.reports validate constraint reports_severity_check;
alter table public.reports validate constraint reports_category_check;
alter table public.reports validate constraint reports_status_check;
alter table public.reports validate constraint reports_risk_score_check;
alter table public.reports validate constraint reports_risk_level_check;
alter table public.reports validate constraint reports_coordinate_bounds_check;
alter table public.reports validate constraint reports_assigned_officer_fk;

-- reports_area_filled_check sengaja dibiarkan NOT VALID: ALR-2026-0013 dan
-- ALR-2026-0014 masih berwilayah kosong. Menebak wilayahnya berarti mengarang
-- data. Constraint tetap menolak penulisan baru; jalankan
--   alter table public.reports validate constraint reports_area_filled_check;
-- setelah kedua baris itu diperbaiki atau dihapus admin.
