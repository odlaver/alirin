# Supabase Contract

Mode data laporan dikendalikan oleh `VITE_REPORTS_DATA_MODE`:

- `local`: hanya localStorage/demo, tidak memanggil Supabase untuk laporan.
- `hybrid`: Supabase dicoba lebih dulu, lalu fallback ke localStorage jika gagal.
- `supabase`: Supabase menjadi sumber utama; error Supabase tidak ditutupi fallback lokal.

Default runtime:

- Tanpa `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`: mode efektif `local`.
- Dengan Supabase configured dan tanpa `VITE_REPORTS_DATA_MODE`: mode efektif `hybrid`.

Migration `supabase/migrations/20260601131500_alirin_reports_contract.sql` membuat tabel:

- `profiles`
- `officers`
- `reports`
- `report_photos`
- `risk_breakdowns`
- `report_status_history`

RLS baseline:

- Warga/anon boleh membuat laporan.
- Admin dari `profiles.role = 'admin'` boleh membaca dan mengubah laporan.
- Petugas dari `profiles.role = 'petugas'` hanya membaca/mengubah laporan yang `assigned_officer_id` sesuai `profiles.officer_id`.
- Foto, breakdown risiko, dan histori status mengikuti akses laporan.

Catatan production:

- Untuk data publik riil, endpoint status/peta sebaiknya memakai view/RPC terpisah yang memasking lokasi, foto, dan kontak.
- Phase berikutnya tetap perlu tracking token privat agar kode laporan berurutan tidak menjadi kunci akses detail.
