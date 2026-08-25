# Penerapan Migrasi 26 Agustus 2026

Dua migrasi baru menutup temuan audit. Keduanya belum diterapkan ke project live
`prfgbvepsyfjwyctgeeq`.

| Urutan | Berkas | Isi |
|---|---|---|
| 1 | `supabase/migrations/20260826090000_risk_engine.sql` | Risk & Priority Engine sebagai trigger, penjaga transisi status, constraint, FK petugas, policy Storage & DELETE, view publik dengan koordinat dibulatkan |
| 2 | `supabase/migrations/20260826091000_cleanup_probe_rows.sql` | Menghapus 2 baris probe, lalu mengaktifkan constraint |

## Cara menjalankan

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan **berurutan**:

1. Tempel seluruh isi `20260826090000_risk_engine.sql` → Run.
2. Tempel seluruh isi `20260826091000_cleanup_probe_rows.sql` → Run.

Migrasi 1 aman diulang. Migrasi 2 menghapus baris, jadi cukup sekali.

Alternatif lewat CLI, bila kredensial database tersedia:

```bash
npx supabase link --project-ref prfgbvepsyfjwyctgeeq
npx supabase db push          # gunakan Session pooler port 5432, bukan 6543
```

## Urutan itu penting

Migrasi 1 menghitung ulang seluruh laporan **sebelum** memasang constraint.
Constraint `NOT VALID` tetap diperiksa pada setiap `UPDATE`, sehingga membalik
urutannya membuat baris lama yang melanggar (`severity = 'ngawur'`, wilayah
kosong) menggagalkan seluruh migrasi.

## Verifikasi setelah menjalankan

```bash
cd app
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
