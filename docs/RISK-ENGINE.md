# ALIRIN Risk & Priority Engine

Spesifikasi tunggal perhitungan *risk score*. Dokumen ini adalah sumber kebenaran;
tiga implementasi di bawah wajib menghasilkan angka yang identik untuk masukan yang sama.

| Implementasi | Berkas | Peran |
|---|---|---|
| PostgreSQL | `supabase/migrations/20260826090000_risk_engine.sql` | **Otoritatif.** Trigger menulis ulang skor pada setiap insert/update |
| Web (JS) | `app/src/domain/scoring.js` | Pratinjau optimistik + mode lokal/demo |
| Mobile (Kotlin) | `app/src/main/java/com/example/alirinmobile/data/scoring/RiskEngine.kt` | Pratinjau optimistik + mode luring |

Klien menghitung agar pengguna langsung melihat angka tanpa menunggu jaringan.
Basis data menghitung ulang dan menimpanya. Karena rumusnya sama, hasilnya sama.

---

## 1. Rumus

Sesuai Proposal GEMASTIK XIX §4.4:

```
Risk Score = (0,35 x Keparahan) + (0,25 x Histori) + (0,25 x Cuaca) + (0,15 x Lokasi)
```

Setiap faktor bernilai 0–100. Hasil akhir dibulatkan ke bilangan bulat dan dipotong ke 0–100.

### Verifikasi terhadap contoh proposal

| Contoh | Keparahan | Histori | Cuaca | Lokasi | Hasil rumus | Tertulis di proposal |
|---|---|---|---|---|---|---|
| Lokasi A | 90 | 80 | 85 | 60 | 81,75 → **82** | 82 |
| Lokasi B | 45 | 40 | 40 | 60 | 44,75 → **45** | 45 |

Kedua contoh direproduksi persis. Keduanya dipasang sebagai vektor uji di ketiga implementasi.

---

## 2. Faktor Berbobot

### 2.1 Keparahan — 35%

Langsung dari `severity` laporan.

| `severity` | Sub-skor |
|---|---|
| `ringan` | 25 |
| `sedang` | 55 |
| `parah` | 80 |
| `kritis` | 100 |

Nilai di luar keempatnya ditolak sebelum sampai ke mesin skor (lihat §5).

### 2.2 Histori — 25%

Jumlah laporan **lain** di sekitar titik yang sama dalam jendela waktu ke belakang.

- Radius: **350 m** dari koordinat laporan.
- Jendela: **180 hari** sebelum `created_at` laporan yang dinilai.
- Laporan berstatus `ditolak` **tidak** dihitung — laporan yang terbukti tidak valid tidak boleh menaikkan risiko tetangganya.
- Laporan berstatus `selesai` **tetap** dihitung. Titik yang kembali bermasalah setelah ditangani justru sinyal terkuat untuk pemeliharaan preventif (Proposal §7.2.4).

```
Histori = min(100, jumlah_laporan_lain x 20)
```

Jendela waktu berlabuh pada `created_at` laporan itu sendiri, bukan pada waktu sekarang.
Konsekuensinya skor **deterministik**: menghitung ulang kapan pun memberi angka yang sama,
sehingga bisa diaudit dan dijadikan pembanding evaluasi akurasi (Proposal §4.4).

### 2.3 Cuaca — 25%

Dari `rainfall_mm`: akumulasi curah hujan 3 jam ke depan menurut prakiraan BMKG pada wilayah
laporan, diambil saat laporan dikirim lalu disimpan permanen di baris laporan.

| Curah hujan 3 jam | Kelas BMKG | Sub-skor |
|---|---|---|
| 0 mm | Tidak hujan | 0 |
| 0–1 mm | Gerimis | 20 |
| 1–5 mm | Hujan ringan | 45 |
| 5–10 mm | Hujan sedang | 70 |
| 10–20 mm | Hujan lebat | 88 |
| ≥ 20 mm | Hujan sangat lebat | 100 |

**Bila `rainfall_mm` kosong** (BMKG tidak terjangkau, atau wilayah tanpa kode `adm4`),
faktor ini dikeluarkan dari perhitungan dan **bobotnya dibagi ulang secara proporsional**
ke tiga faktor lain:

```
Risk Score = Σ(sub_i x bobot_i) / Σ(bobot_i yang tersedia)
```

Alternatifnya — menganggap cuaca bernilai 0 — akan menghukum laporan yang datanya kebetulan
tidak terambil. Pembagian ulang bobot menjaga skor tetap sebanding, dan status
ketersediaannya selalu tercatat di rincian skor.

### 2.4 Lokasi — 15%

Jarak ke fasilitas publik terdekat (`public_facilities`).

| Jarak | Sub-skor |
|---|---|
| ≤ 250 m | 100 |
| ≤ 500 m | 80 |
| ≤ 1 km | 58 |
| ≤ 2 km | 34 |
| > 2 km | 10 |

---

## 3. Faktor Berbobot Nol

Proposal §4.4 mencantumkan enam faktor, tetapi *baseline* hanya membobot empat.
Dua sisanya tetap dihitung dan ditampilkan di rincian skor dengan bobot 0, supaya
jalur datanya sudah teruji ketika bobotnya dinaikkan nanti.

| Faktor | Isi | Rencana |
|---|---|---|
| `bukti` | Kelengkapan foto, deskripsi, koordinat, kategori | Dipakai sebagai penanda keyakinan; bobot dinaikkan setelah evaluasi lapangan |
| `sensor` | Tinggi air & intensitas hujan dari sensor lapangan | Roadmap Tahap 4 (Pilot IoT) |

---

## 3b. Poin yang Ditampilkan

Rincian skor dibaca pengguna, jadi poin tiap faktor **harus berjumlah persis
sama dengan skornya**. Pembulatan masing-masing faktor secara terpisah tidak
memenuhi syarat itu: pada laporan berskor 53, `round(46.67) + 0 + round(6.67)`
menghasilkan 54.

Pembagiannya memakai **metode sisa terbesar**:

1. Tiap faktor mendapat bagian bulat ke bawah dari nilai eksaknya.
2. Selisih terhadap skor akhir dibagikan satu poin per faktor, dimulai dari
   yang pecahannya terbesar.

| Faktor | Nilai eksak | Bulat bawah | Sisa | Poin |
|---|---|---|---|---|
| Keparahan | 46,67 | 46 | 0,67 | **47** |
| Histori | 0,00 | 0 | 0,00 | 0 |
| Cuaca | — | 0 | — | 0 |
| Lokasi | 6,67 | 6 | 0,67 | 6 |
| | | **52** | sisa 1 | **53** |

Bobot yang ditampilkan tidak ikut dibagi ulang: `round(35 × 100 / total)` dan
seterusnya sudah berjumlah 100 baik saat cuaca tersedia (35+25+25+15) maupun
tidak (47+33+20).

Bila dua pecahan **seri**, poin sisanya jatuh ke faktor yang lebih dulu dalam
urutan tabel di atas. Basis data memakai `numeric` yang eksak, sedangkan kedua
klien memakai float — karena itu keduanya membulatkan pecahan ke 6 desimal
sebelum membandingkan, supaya seri tetap terbaca seri dan pilihannya sama.

Urutan faktor yang dikirim ke klien juga dipatok (`alirin_factor_rank`).
`jsonb_agg` tanpa `order by` tidak menjanjikan urutan apa pun, dan urutan yang
berubah-ubah antar pemuatan akan langsung terlihat begitu rinciannya ditampilkan.

Ketiga implementasinya harus sama: `alirin_apportion` (SQL, otoritatif),
`apportion` di `app/src/domain/scoring.js`, dan `RiskEngine.apportion` di
mobile. Uji "jumlah poin selalu sama dengan skor" ada di kedua sisi klien, dan
`npm run supabase:status` memeriksanya langsung pada data yang tersimpan.

---

## 4. Kelas Risiko

| Skor | Kelas |
|---|---|
| ≥ 80 | `Kritis` |
| ≥ 60 | `Tinggi` |
| ≥ 40 | `Waspada` |
| < 40 | `Normal` |

Penulisannya **kapital di awal** di seluruh sistem, termasuk kolom `reports.risk_level`.
Constraint basis data menegakkannya.

---

## 5. Yang Tidak Memengaruhi Skor

Dicatat eksplisit karena pernah berpengaruh dan sekarang tidak lagi:

| Bekas faktor | Alasan dihapus |
|---|---|
| **Umur laporan** | Membuat skor naik sendiri tanpa kejadian apa pun, sehingga tidak reproducible dan tidak bisa diaudit |
| **Mode laporan** (Cepat x0,7) | Menghukum laporan paling mendesak. Proposal §4.3.1 menempatkan Lapor Cepat justru untuk kondisi mendesak |
| **Kategori masalah** | Tidak ada di rumus §4.4. Tetap dipakai untuk label, filter, dan indikator `bukti` |

---

## 6. Prasyarat Data

Mesin skor mengasumsikan masukannya sudah bersih. Validasi dilakukan sebelum penyimpanan,
di klien dan di basis data:

- `severity` ∈ {ringan, sedang, parah, kritis}
- `category` ∈ {sumbatan, genangan, aliran-lambat, drainase-rusak, bau, lainnya}
- `kecamatan` + `kelurahan` harus pasangan yang sah di master wilayah
- `lat`/`lng` wajib ada dan berada di dalam batas Kota Bandar Lampung
  (lat −5,62..−5,28; lng 105,15..105,36). Koordinat tidak valid **ditolak**,
  tidak diganti diam-diam dengan titik pusat kota
- `rainfall_mm` ≥ 0 atau kosong

---

## 7. Mengubah Rumus

1. Ubah dokumen ini lebih dulu.
2. Sesuaikan ketiga implementasi.
3. Perbarui vektor uji bersama di `app/src/domain/scoring.test.js` dan `RiskEngineTest.kt`.
4. Naikkan `RISK_ENGINE_VERSION` di ketiga implementasi.
5. Jalankan `npm test` dan `gradlew test`.

Vektor uji bersama memakai dua contoh proposal di §1 plus kasus batas.
Jika salah satu implementasi menyimpang, ujinya gagal.
