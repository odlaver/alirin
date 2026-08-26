# Penerapan Migrasi 26 Agustus 2026

Migrasi 1 dan 2 menutup temuan audit dan **sudah diterapkan** ke project live
`prfgbvepsyfjwyctgeeq`. Migrasi 3 menyusul bersama pengembangan P-2.

| Urutan | Berkas | Isi |
|---|---|---|
| 1 | `supabase/migrations/20260826090000_risk_engine.sql` | Risk & Priority Engine sebagai trigger, penjaga transisi status, constraint, FK petugas, policy Storage & DELETE, view publik dengan koordinat dibulatkan |
| 2 | `supabase/migrations/20260826091000_cleanup_probe_rows.sql` | Menghapus 2 baris probe, lalu mengaktifkan constraint |
| 3 | `supabase/migrations/20260826100000_breakdown_apportion.sql` | Poin rincian dibagi dengan metode sisa terbesar sehingga berjumlah sama dengan skor; pembangun rincian dipisah dari trigger |
| 4 | `supabase/migrations/20260826110000_hulu_hilir.sql` | Relasi hulu-hilir, cache cuaca per kecamatan, dan faktor Cuaca yang membaca hujan di hulu |

## Cek dulu kondisi sekarang

```bash
cd app
npm run supabase:status
```

Perintah ini melaporkan bagian mana yang sudah terpasang. Jalankan sebelum dan
sesudah setiap langkah di bawah.

## Cara menjalankan

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan **berurutan**:

1. Tempel seluruh isi `20260826090000_risk_engine.sql` → Run. Tunggu sampai
   selesai tanpa error.
2. Baru tempel seluruh isi `20260826091000_cleanup_probe_rows.sql` → Run.
3. Lalu `20260826100000_breakdown_apportion.sql` → Run. Berkas ini membangun
   ulang rincian seluruh laporan yang sudah ada di bagian akhirnya.
4. Terakhir `20260826110000_hulu_hilir.sql` → Run.

Keempatnya aman diulang, tetapi **urutannya tidak boleh dibalik**: berkas 4
menambahkan dua kolom pada view `public_reports`, dan `create or replace view`
menolak menghapus kolom. Menjalankan berkas 3 setelah berkas 4 akan gagal.

Alternatif lewat CLI, bila kredensial database tersedia:

```bash
npx supabase link --project-ref prfgbvepsyfjwyctgeeq
npx supabase db push          # gunakan Session pooler port 5432, bukan 6543
```

## Urutan itu penting, dan tidak boleh dibalik

**Berkas 2 bergantung penuh pada berkas 1.** Berkas 1 yang membuat constraint;
berkas 2 hanya mengaktifkannya. Menjalankan berkas 2 lebih dulu dulu berakhir
dengan:

```
ERROR: 42704: constraint "reports_severity_check" of relation "reports" does not exist
```

Berkas 2 sekarang memeriksa ini sendiri dan berhenti dengan pesan yang jelas
bila berkas 1 belum berjalan.

Di dalam berkas 1, urutannya juga penting: seluruh laporan dihitung ulang
**sebelum** constraint dipasang. Constraint `NOT VALID` tetap diperiksa pada
setiap `UPDATE`, sehingga membalik urutan itu membuat baris lama yang melanggar
(`severity = 'ngawur'`, wilayah kosong) menggagalkan seluruh migrasi.

## Kalau berkas 1 gagal di tengah

SQL Editor Supabase membungkus **seluruh skrip dalam satu transaksi**. Satu
pernyataan gagal berarti semuanya di-rollback, dan database tampak sama sekali
tidak tersentuh meski sebagian besar skrip sebenarnya sudah berjalan. Karena
itu `npm run supabase:status` bisa melaporkan 0/7 walaupun Anda merasa sudah
menjalankannya.

Dua blok yang paling mungkin ditolak sudah dibuat **tidak mematikan** — bila
gagal, migrasi tetap lanjut dan hanya mencetak `NOTICE`:

| Blok | Kenapa bisa ditolak |
|---|---|
| Policy `storage.objects` | Tabelnya dimiliki `supabase_storage_admin`, bukan peran SQL Editor |
| Kolom `officers.auth_user_id` | Foreign key ke `auth.users` butuh hak pada schema `auth` |

Kalau policy Storage dilewati, pasang manual lewat **Dashboard → Storage →
Policies** pada bucket `reports`, atau jalankan blok itu sebagai
`supabase_storage_admin`. Tanpa policy hapus, pembersihan berkas yatim tidak
bisa dijalankan, tetapi sisa sistem tetap berfungsi.

Untuk error lain, salin pesannya apa adanya — nomor `ERROR: XXXXX:` dan
teksnya — lalu perbaiki penyebabnya sebelum mengulang.

## Tipe kolom di project live berbeda dari migrasi repo

Terverifikasi lewat pemeriksaan langsung, bukan dugaan:

| Kolom | Migrasi repo | Project live |
|---|---|---|
| `reports.id` | `text` | **`uuid`** |
| `report_photos.report_id` | `text` | **`uuid`** |
| `risk_breakdowns.id` | `text` | **`uuid`** |
| `risk_breakdowns.report_id` | `text` | **`uuid`** |
| `report_status_history.report_id` | `text` | **`uuid`** |
| `officers.id` | `text` | `text` |
| `reports.assigned_officer_id` | `text` | `text` |

Ini bukti ketiga bahwa migrasi `20260605000100` tidak pernah dieksekusi di
remote, setelah CHECK constraint yang hilang dan policy Storage yang tidak ada.

Dua konsekuensi yang sudah ditangani migrasi baru:

1. Perbandingan `reports.id` dengan parameter fungsi dicasting ke `text`,
   sehingga bekerja pada kedua bentuk skema.
2. Kunci faktor rincian skor (`severity`, `history`, ...) tidak bisa ditaruh di
   `risk_breakdowns.id` karena kolom itu `uuid` dengan default. Migrasi
   menambahkan kolom `factor` untuk menyimpannya, dan view serta RPC
   memancarkannya sebagai `id` supaya klien tidak perlu tahu bedanya.

Menyamakan tipe `id` menjadi `text` di project live **tidak** dilakukan: itu
berarti mengubah primary key beserta seluruh foreign key yang menunjuk padanya,
risiko besar untuk keuntungan kosmetik. Yang benar adalah memperbarui migrasi
baseline di repo agar mencerminkan `uuid`, dan itu pekerjaan terpisah dari
penerapan ini.

## Verifikasi setelah menjalankan

```bash
cd app
npm run supabase:status   # harus 7/7 terpasang
npm run supabase:check
```

Yang harus berubah menjadi OK:

- `koordinat publik dibulatkan` — maksimal 3 desimal (~110 m)
- `risk_level memakai penulisan kanonik` — tidak ada lagi `normal` atau `Rendah`
- `risk_level konsisten dengan risk_score`
- `master fasilitas publik terbaca` — 8 fasilitas

Untuk menguji penjaga transisi status (pemeriksaan ini menulis ke database):

```bash
ALIRIN_CHECK_WRITES=1 npm run supabase:check
```

`lompatan masuk -> selesai ditolak` harus lolos. Sebelum migrasi, lompatan itu
berhasil.

Lalu bersihkan berkas Storage yatim, yang sebelum migrasi tidak bisa dihapus
karena policy `reports_storage_staff_delete` tidak ada di project ini:

```bash
npm run supabase:cleanup-photos            # tinjau
npm run supabase:cleanup-photos -- --apply # hapus
```

Per 25 Agustus 2026 ada 10 berkas yatim (0,17 MB). Dua berkas yang sempat
terlihat yatim ternyata dipakai `reports.completion_photos` pada ALR-2026-0014
dan ALR-2026-9990; skrip memeriksa kedua jalur rujukan sehingga keduanya aman.

## Yang sengaja dibiarkan

`reports_area_filled_check` tetap `NOT VALID`. ALR-2026-0013 dan ALR-2026-0014
masih berwilayah kosong dan koordinatnya jatuh ke titik cadangan pusat kota.
Menebak wilayahnya berarti mengarang data. Setelah kedua baris itu diperbaiki
atau dihapus admin, jalankan:

```sql
alter table public.reports validate constraint reports_area_filled_check;
```

## Setelah migrasi diterapkan

Bangun ulang APK agar klien memakai kolom `rainfall_mm`:

```bash
cd C:\ALIRIN-Mobile
gradlew assembleDebug
```

Laporan lama tidak punya `rainfall_mm`, jadi faktor Cuaca pada laporan tersebut
dikeluarkan dari perhitungan dan bobotnya dibagi ulang. Ini disengaja: menandai
data yang memang tidak diketahui lebih jujur daripada mengisinya dengan nol.
