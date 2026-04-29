# PRD ALIRIN v1

## ALIRIN: Sistem Kota Cerdas Berbasis Web untuk Monitoring dan Prioritas Preventif Drainase Mikro di Kota Bandar Lampung

---

## 1. Ringkasan Produk

**ALIRIN v1** adalah platform web responsif untuk membantu warga, RT/kelurahan, dan pihak pemerintah daerah dalam memantau, melaporkan, serta memprioritaskan penanganan drainase mikro yang berpotensi menyebabkan genangan.

Pada versi awal, ALIRIN **belum wajib menggunakan IoT secara penuh**. Fokus v1 adalah membangun fondasi sistem Kota Cerdas berupa:

- portal pelaporan warga,
- dashboard pemerintah/kelurahan,
- peta titik rawan drainase,
- sistem prioritas berbasis *risk scoring*,
- dokumentasi tindak lanjut,
- rancangan integrasi IoT untuk versi berikutnya.

ALIRIN bukan sekadar aplikasi laporan warga, melainkan sistem yang mengubah laporan dan data lapangan menjadi **prioritas aksi preventif**.

---

## 2. Latar Belakang

Masalah genangan di perkotaan sering kali tidak hanya terjadi karena hujan deras, tetapi juga karena drainase mikro yang tersumbat, tertutup sampah, tidak terawat, atau tidak memiliki sistem pemantauan yang baik.

Di lapangan, proses penanganan drainase biasanya masih bersifat reaktif:

1. hujan turun,
2. genangan terjadi,
3. warga melapor,
4. petugas mengecek,
5. penanganan baru dilakukan.

ALIRIN mencoba mengubah pola tersebut menjadi lebih **preventif dan berbasis data**:

1. warga/RT melaporkan kondisi drainase,
2. sistem memetakan titik rawan,
3. setiap titik diberi skor risiko,
4. dashboard menampilkan prioritas penanganan,
5. petugas/kelurahan dapat memperbarui status tindak lanjut.

---

## 3. Tujuan Produk

### Tujuan Utama

Membangun platform web Kota Cerdas untuk membantu **monitoring dan prioritas preventif drainase mikro** di Kota Bandar Lampung.

### Tujuan Khusus

1. Mempermudah warga melaporkan drainase tersumbat atau berisiko menyebabkan genangan.
2. Membantu RT/kelurahan memvalidasi dan memantau laporan warga.
3. Menyediakan dashboard peta risiko drainase untuk pengambilan keputusan.
4. Menghasilkan daftar prioritas penanganan berdasarkan data.
5. Menyediakan dokumentasi *before-after* penanganan.
6. Menyiapkan fondasi integrasi IoT pada versi selanjutnya.
7. Mendukung pilar **Smart Environment**, **Smart Governance**, dan **Smart Living**.

---

## 4. Target Pengguna

### 4.1 Warga

Contoh pengguna:

- warga permukiman rawan genangan,
- mahasiswa/kos sekitar Rajabasa-Kedaton,
- pemilik usaha kecil,
- pengguna jalan lokal.

Kebutuhan:

- melapor dengan mudah,
- mengunggah foto kondisi drainase,
- melihat status laporan,
- mengetahui titik rawan di sekitarnya.

### 4.2 RT/Kelurahan

Kebutuhan:

- melihat laporan warga di wilayahnya,
- memvalidasi laporan,
- memberi status tindak lanjut,
- menentukan prioritas pengecekan lokal.

### 4.3 Dinas/Instansi Pemerintah

Contoh:

- Dinas PU,
- DLH,
- BPBD,
- kecamatan,
- operator command center.

Kebutuhan:

- melihat peta risiko drainase,
- memantau laporan per wilayah,
- melihat prioritas penanganan,
- melihat data historis,
- mengevaluasi titik rawan berulang.

---

## 5. Positioning Produk

ALIRIN adalah:

> **Platform web Kota Cerdas untuk mengubah laporan drainase dan data lapangan menjadi prioritas aksi preventif.**

| Aplikasi laporan biasa | ALIRIN v1 |
|---|---|
| Fokus menerima laporan | Fokus mengubah laporan menjadi prioritas |
| Data tidak selalu terstruktur | Data dipetakan dan diberi *risk score* |
| Status tindak lanjut sederhana | Ada workflow validasi dan dokumentasi |
| Tidak spesifik masalah | Fokus drainase mikro dan genangan |
| Tidak siap IoT | Disiapkan untuk integrasi sensor IoT |

---

## 6. Scope Produk

### 6.1 In Scope - Wajib Ada di v1

ALIRIN v1 harus memiliki:

1. **Landing Page**
   - penjelasan singkat ALIRIN,
   - masalah yang diselesaikan,
   - fitur utama,
   - CTA untuk lapor drainase atau masuk dashboard.

2. **Portal Laporan Warga**
   - form laporan drainase,
   - upload foto,
   - input lokasi,
   - kategori masalah,
   - deskripsi,
   - tracking status laporan.

3. **Dashboard Admin/Kelurahan**
   - daftar laporan masuk,
   - filter laporan,
   - ubah status laporan,
   - validasi laporan,
   - lihat detail laporan.

4. **Peta Risiko Drainase**
   - titik laporan,
   - status risiko,
   - warna marker berdasarkan level risiko,
   - detail titik saat diklik.

5. **Risk Scoring**
   - sistem menghitung skor prioritas berdasarkan parameter sederhana.

6. **Manajemen Tindak Lanjut**
   - status: masuk, diverifikasi, dijadwalkan, ditangani, selesai, ditolak,
   - upload foto *before-after*.

7. **Dashboard Statistik**
   - total laporan,
   - laporan per status,
   - titik risiko tinggi,
   - laporan per kecamatan/kelurahan,
   - tren laporan mingguan.

8. **Desain Responsif**
   - bisa digunakan dari laptop dan HP.

### 6.2 Out of Scope - Belum Wajib di v1

Belum wajib dibuat pada v1:

- aplikasi mobile native Android/iOS,
- sensor IoT fisik penuh,
- prediksi banjir berbasis machine learning kompleks,
- integrasi resmi dengan sistem pemerintah,
- WhatsApp gateway asli,
- pembayaran/monetisasi,
- deployment skala kota.

Namun, IoT tetap perlu disebut sebagai **roadmap v2** agar arah teknologi tetap terlihat kuat.

---

## 7. Platform Produk

Rekomendasi output:

> **Web app responsif dengan dua mode utama: Portal Warga dan Dashboard Pemerintah/Kelurahan.**

Alasan memilih web:

- lebih cepat dibuat,
- mudah didemokan,
- bisa dibuka lewat HP,
- cocok untuk dashboard peta,
- tidak perlu instal aplikasi,
- lebih sesuai untuk presentasi Smart City.

---

## 8. User Role dan Permission

| Role | Akses |
|---|---|
| Guest | Melihat landing page, peta publik terbatas, membuat laporan |
| Warga | Membuat laporan, melihat status laporan sendiri |
| RT/Kelurahan | Melihat laporan wilayah, validasi, ubah status, upload tindak lanjut |
| Admin Dinas | Melihat semua data, dashboard kota, statistik, prioritas |
| Super Admin | Manajemen user, wilayah, kategori, konfigurasi scoring |

Untuk MVP lomba, cukup buat:

- Guest/Warga,
- Admin/Kelurahan,
- Super Admin sederhana.

---

## 9. User Journey

### 9.1 Journey Warga Melapor

1. Warga membuka website ALIRIN.
2. Klik tombol **Laporkan Drainase**.
3. Isi lokasi.
4. Pilih kategori masalah.
5. Upload foto.
6. Tambahkan deskripsi.
7. Submit laporan.
8. Sistem memberi nomor tracking.
9. Warga bisa melihat status laporan.

Kategori masalah:

- Drainase tersumbat sampah.
- Air tidak mengalir.
- Drainase tertutup bangunan/material.
- Saluran rusak.
- Genangan setelah hujan.
- Lainnya.

### 9.2 Journey Admin/Kelurahan

1. Admin login.
2. Melihat dashboard laporan masuk.
3. Membuka laporan detail.
4. Memvalidasi laporan.
5. Sistem menghitung *risk score*.
6. Admin menetapkan status:
   - diverifikasi,
   - dijadwalkan,
   - ditangani,
   - selesai.
7. Admin upload foto tindak lanjut.
8. Status dapat dilihat warga.

### 9.3 Journey Dinas/Pemerintah

1. Admin dinas membuka dashboard kota.
2. Melihat peta titik rawan.
3. Melihat daftar prioritas pembersihan.
4. Filter berdasarkan kecamatan/kelurahan/status risiko.
5. Mengevaluasi titik dengan laporan berulang.
6. Menggunakan data untuk rencana pemeliharaan drainase.

---

## 10. Fitur Detail

### 10.1 Landing Page

#### Tujuan

Membuat ALIRIN mudah dipahami sejak halaman pertama.

#### Konten

- Hero section:
  - judul,
  - deskripsi singkat,
  - CTA **Laporkan Drainase** dan **Lihat Peta Risiko**.
- Ringkasan masalah:
  - genangan,
  - drainase tersumbat,
  - laporan tidak terstruktur.
- Solusi ALIRIN:
  - laporan visual,
  - peta risiko,
  - dashboard prioritas.
- Alur kerja 3 langkah:
  - lapor,
  - validasi,
  - tindak lanjut.
- Statistik dummy/MVP:
  - 128 laporan,
  - 32 titik diprioritaskan,
  - 8 wilayah rawan.
- Footer:
  - nama tim,
  - Universitas Lampung,
  - GEMASTIK Smart City.

#### Interaksi

- animasi gelombang air di hero,
- angka statistik dengan *counting animation*,
- card fitur muncul dengan *fade-up animation*,
- CTA sticky di mobile.

### 10.2 Form Laporan Warga

#### Field

| Field | Tipe | Wajib |
|---|---|---|
| Nama pelapor | Text | Opsional |
| Nomor HP/email | Text | Opsional |
| Kategori masalah | Dropdown | Ya |
| Deskripsi | Textarea | Ya |
| Lokasi | Pin map / geolocation | Ya |
| Kecamatan | Dropdown | Ya |
| Kelurahan | Dropdown | Ya |
| Foto kondisi drainase | Upload image | Ya |
| Tingkat genangan | Dropdown | Opsional |

#### Tingkat Genangan

- Tidak ada genangan.
- Genangan rendah.
- Genangan sedang.
- Genangan tinggi.
- Pernah meluap ke jalan/rumah.

#### Output

Setelah submit, sistem menampilkan:

- nomor laporan,
- status awal: **Menunggu Verifikasi**,
- estimasi proses,
- tombol cek status.

### 10.3 Peta Risiko Drainase

#### Tujuan

Menampilkan titik drainase bermasalah secara visual.

#### Elemen Peta

- marker titik laporan,
- warna berdasarkan risiko,
- filter kecamatan,
- filter status,
- filter kategori masalah,
- popup detail laporan.

#### Warna Marker

| Risiko | Warna |
|---|---|
| Normal | Hijau |
| Waspada | Kuning |
| Tinggi | Oranye |
| Kritis | Merah |

#### Interaksi

- klik marker membuka detail laporan,
- hover marker memperlihatkan ringkasan,
- filter realtime tanpa reload,
- cluster marker jika titik terlalu banyak.

### 10.4 Dashboard Admin

#### Komponen Utama

1. **Summary Cards**
   - total laporan,
   - laporan belum diverifikasi,
   - titik risiko tinggi,
   - laporan selesai.

2. **Peta Risiko**
   - fullscreen map option,
   - layer berdasarkan status.

3. **Tabel Prioritas**
   - nama lokasi,
   - kategori,
   - skor risiko,
   - status,
   - tanggal laporan,
   - aksi.

4. **Grafik**
   - tren laporan mingguan,
   - laporan per wilayah,
   - distribusi status,
   - kategori masalah terbanyak.

5. **Notifikasi**
   - laporan risiko tinggi,
   - laporan duplikat,
   - laporan belum diproses lebih dari X hari.

### 10.5 Detail Laporan

#### Informasi yang Ditampilkan

- foto laporan,
- lokasi peta,
- kategori masalah,
- deskripsi,
- skor risiko,
- status,
- riwayat status,
- catatan admin,
- foto *before-after*,
- laporan serupa di sekitar lokasi.

#### Aksi Admin

- validasi laporan,
- tandai duplikat,
- ubah status,
- tambahkan catatan,
- upload dokumentasi,
- jadwalkan penanganan.

### 10.6 Risk Scoring

#### Tujuan

Membantu sistem menentukan prioritas penanganan drainase.

#### Formula v1

```text
Risk Score =
30% tingkat genangan
+ 25% kategori kerusakan/sumbatan
+ 20% riwayat laporan di lokasi sekitar
+ 15% kedekatan fasilitas publik
+ 10% umur laporan
```

#### Parameter

| Parameter | Skor rendah | Skor tinggi |
|---|---|---|
| Tingkat genangan | Tidak ada genangan | Meluap ke jalan/rumah |
| Kategori masalah | Drainase kotor ringan | Tersumbat berat/rusak |
| Riwayat laporan | Belum pernah | Sering dilaporkan |
| Fasilitas publik | Area sepi | Dekat sekolah/pasar/jalan utama |
| Umur laporan | Baru masuk | Belum diproses lama |

#### Kategori Hasil

| Skor | Level | Tindakan |
|---:|---|---|
| 0-39 | Normal | Pantau |
| 40-59 | Waspada | Verifikasi |
| 60-79 | Tinggi | Prioritaskan pengecekan |
| 80-100 | Kritis | Tindak segera |

---

## 11. Desain Frontend

### 11.1 Karakter Visual

ALIRIN harus terasa:

- bersih,
- modern,
- dinamis,
- ramah warga,
- tetap kredibel untuk pemerintah,
- punya nuansa air, lingkungan, dan smart city.

Gaya visual yang disarankan:

> **Clean civic-tech + environmental dashboard + subtle water motion.**

Jangan terlalu *game-like*. Tetap profesional, tapi tidak kaku.

### 11.2 Warna Utama

| Fungsi | Nama | Hex | Makna |
|---|---|---|---|
| Primary | Deep Ocean Blue | `#0B3A5B` | kredibilitas, pemerintah, data, kepercayaan |
| Secondary | Aqua Blue | `#22B8CF` | air, teknologi, aliran, kesegaran |
| Accent | Eco Green | `#2F9E44` | lingkungan, drainase sehat, aksi preventif |
| Warning | Amber Yellow | `#F59F00` | waspada, perlu perhatian |
| Danger | Flood Red | `#E03131` | risiko tinggi, kritis |
| Background | Soft Mist | `#F4FAFC` | latar bersih dan ringan |
| Card | White | `#FFFFFF` | konten utama |
| Text Primary | Navy Text | `#102A43` | teks utama |
| Text Secondary | Slate Text | `#627D98` | teks sekunder |

### 11.3 Font

Gunakan font yang modern dan mudah dibaca.

Rekomendasi utama:

- **Inter** untuk dashboard dan body text.
- **Plus Jakarta Sans** untuk heading.

| Elemen | Font |
|---|---|
| Heading | Plus Jakarta Sans SemiBold |
| Body | Inter Regular |
| Dashboard angka | Inter Medium/SemiBold |

### 11.4 Animasi

Animasi harus halus dan fungsional, bukan ramai.

Animasi yang disarankan:

1. **Hero Water Wave**
   - gelombang SVG halus di bagian bawah hero,
   - looping lambat 8-12 detik.

2. **Fade-up Cards**
   - card fitur muncul saat scroll,
   - durasi 300-500ms.

3. **Counting Stats**
   - angka statistik naik dari 0 ke nilai akhir.

4. **Map Marker Pulse**
   - marker risiko tinggi/kritis punya efek pulse lembut.

5. **Status Transition**
   - saat status laporan berubah, badge berganti dengan smooth transition.

6. **Loading Skeleton**
   - untuk dashboard/tabel agar terasa modern.

7. **Microinteraction Button**
   - hover naik 2px,
   - shadow bertambah,
   - ripple ringan saat klik.

Hindari:

- animasi terlalu cepat,
- efek air berlebihan,
- parallax berat,
- neon berlebihan,
- loading yang mengganggu.

### 11.5 Komponen UI

#### Button

- Primary: biru tua dengan teks putih.
- Secondary: outline aqua.
- Danger: merah untuk status kritis.
- Rounded: 12-16px.

#### Card

- background putih,
- border tipis `#D9EAF2`,
- shadow lembut,
- radius 20px.

#### Badge Status

| Status | Warna |
|---|---|
| Menunggu Verifikasi | Abu-biru |
| Diverifikasi | Aqua |
| Dijadwalkan | Kuning |
| Ditangani | Biru |
| Selesai | Hijau |
| Ditolak | Merah |

#### Map Panel

- sidebar filter collapsible,
- marker legend,
- search lokasi,
- toggle layer: laporan, risiko, selesai.

---

## 12. Struktur Halaman

### Public/Warga

1. `/`
   - landing page.

2. `/lapor`
   - form laporan.

3. `/status/:kode`
   - cek status laporan.

4. `/peta`
   - peta risiko publik.

5. `/tentang`
   - tentang ALIRIN dan SDGs.

### Admin

1. `/admin/login`
   - login admin.

2. `/admin/dashboard`
   - ringkasan kota/wilayah.

3. `/admin/laporan`
   - daftar laporan.

4. `/admin/laporan/:id`
   - detail laporan.

5. `/admin/peta`
   - peta risiko.

6. `/admin/prioritas`
   - daftar prioritas penanganan.

7. `/admin/statistik`
   - grafik dan analitik.

8. `/admin/pengaturan`
   - wilayah, kategori, user, bobot scoring.

---

## 13. Informasi Arsitektur

### Frontend

Rekomendasi:

- Next.js / React
- Tailwind CSS
- Framer Motion
- Leaflet / Mapbox
- Recharts
- React Hook Form
- Zod validation

### Backend

Rekomendasi:

- Laravel / Express.js / FastAPI
- REST API
- JWT/Auth session
- Upload image storage
- Role-based access control

### Database

Rekomendasi:

- PostgreSQL + PostGIS

Alternatif lebih cepat untuk MVP:

- Supabase
- Firebase
- SQLite lokal untuk demo awal

### Storage

- Cloudinary
- Supabase Storage
- Firebase Storage

---

## 14. Data Model Awal

### User

| Field | Tipe |
|---|---|
| id | UUID |
| name | string |
| email | string |
| password_hash | string |
| role | enum |
| wilayah_id | UUID nullable |
| created_at | timestamp |

### Report

| Field | Tipe |
|---|---|
| id | UUID |
| report_code | string |
| reporter_name | string nullable |
| reporter_contact | string nullable |
| category | enum |
| description | text |
| latitude | decimal |
| longitude | decimal |
| district | string |
| village | string |
| image_url | string |
| flood_level | enum |
| status | enum |
| risk_score | integer |
| created_at | timestamp |
| updated_at | timestamp |

### FollowUp

| Field | Tipe |
|---|---|
| id | UUID |
| report_id | UUID |
| admin_id | UUID |
| status | enum |
| note | text |
| before_image_url | string nullable |
| after_image_url | string nullable |
| created_at | timestamp |

### RiskArea

| Field | Tipe |
|---|---|
| id | UUID |
| name | string |
| district | string |
| village | string |
| latitude | decimal |
| longitude | decimal |
| risk_level | enum |
| notes | text |

### ScoringConfig

| Field | Tipe |
|---|---|
| id | UUID |
| flood_weight | integer |
| category_weight | integer |
| history_weight | integer |
| facility_weight | integer |
| age_weight | integer |

---

## 15. API Requirement

### Public API

#### Create Report

`POST /api/reports`

Input:

- category,
- description,
- location,
- image,
- flood_level,
- reporter info optional.

Output:

- report_code,
- status,
- risk_score.

#### Check Report Status

`GET /api/reports/status/:code`

Output:

- status,
- timeline,
- note,
- updated_at.

#### Get Public Risk Map

`GET /api/public/risk-map`

Output:

- location points,
- risk level,
- public summary.

### Admin API

#### Get Dashboard Summary

`GET /api/admin/dashboard`

Output:

- total reports,
- pending reports,
- high risk reports,
- completed reports,
- chart data.

#### Get Reports

`GET /api/admin/reports`

Filter:

- status,
- district,
- category,
- risk_level,
- date_range.

#### Update Report Status

`PATCH /api/admin/reports/:id/status`

Input:

- status,
- note,
- optional image.

#### Get Priority List

`GET /api/admin/priorities`

Output:

- sorted reports by risk score.

---

## 16. Functional Requirements

### FR-01 - Warga dapat membuat laporan drainase

Prioritas: Must Have

Acceptance Criteria:

- user bisa upload foto,
- user bisa memilih lokasi,
- user bisa memilih kategori,
- sistem menghasilkan kode laporan.

### FR-02 - Sistem menghitung risk score

Prioritas: Must Have

Acceptance Criteria:

- setiap laporan memiliki skor 0-100,
- skor otomatis menentukan level risiko,
- admin dapat melihat detail komponen skor.

### FR-03 - Admin dapat memvalidasi laporan

Prioritas: Must Have

Acceptance Criteria:

- admin bisa mengubah status laporan,
- perubahan status tersimpan di timeline,
- warga bisa melihat status terbaru.

### FR-04 - Dashboard menampilkan peta risiko

Prioritas: Must Have

Acceptance Criteria:

- titik laporan tampil di peta,
- warna marker sesuai risiko,
- marker bisa diklik untuk melihat detail.

### FR-05 - Admin dapat melihat daftar prioritas

Prioritas: Must Have

Acceptance Criteria:

- laporan tersortir berdasarkan risk score,
- tersedia filter kecamatan/kelurahan/status,
- admin bisa membuka detail laporan.

### FR-06 - Admin dapat upload dokumentasi tindak lanjut

Prioritas: Should Have

Acceptance Criteria:

- admin bisa upload foto *before-after*,
- foto muncul di detail laporan,
- status bisa diubah menjadi selesai.

### FR-07 - Statistik laporan

Prioritas: Should Have

Acceptance Criteria:

- ada grafik laporan mingguan,
- grafik kategori masalah,
- grafik status laporan.

### FR-08 - Integrasi IoT placeholder

Prioritas: Could Have

Acceptance Criteria:

- ada menu **Sensor IoT** atau **Data Sensor** dalam mode prototype,
- menampilkan dummy sensor tinggi air,
- menjelaskan bahwa fitur ini roadmap v2.

---

## 17. Non-Functional Requirements

### Performance

- halaman dashboard terbuka < 3 detik pada koneksi normal,
- peta tetap responsif sampai 500 titik laporan,
- gambar dikompresi sebelum upload.

### Security

- role-based access,
- validasi input,
- sanitasi deskripsi,
- file upload hanya image,
- maksimal ukuran gambar, misalnya 5 MB.

### Accessibility

- kontras warna cukup,
- tombol besar di mobile,
- form mudah dibaca,
- badge status tidak hanya mengandalkan warna, tetapi juga teks.

### Responsiveness

- mobile-first untuk portal warga,
- desktop-first untuk dashboard admin,
- layout tablet tetap rapi.

### Reliability

- laporan tidak hilang setelah submit,
- status laporan tersimpan dalam timeline,
- error upload diberi pesan jelas.

---

## 18. UI/UX Direction per Halaman

### Landing Page

Nuansa:

- modern,
- informatif,
- visual air dan peta kota.

Layout:

- hero besar dengan ilustrasi aliran air/peta,
- CTA jelas,
- card fitur,
- section **Cara Kerja ALIRIN**,
- section **Dampak untuk Bandar Lampung**.

Animasi:

- wave background,
- fade-up card,
- animated route line pada ilustrasi peta.

### Form Laporan

Nuansa:

- cepat,
- mudah,
- tidak menakutkan.

Layout:

- stepper 3 langkah:
  1. lokasi,
  2. detail masalah,
  3. foto dan submit.

Interaksi:

- preview foto setelah upload,
- pin lokasi di map,
- validasi field realtime,
- sukses submit dengan animasi checklist.

### Dashboard Admin

Nuansa:

- data-driven,
- bersih,
- profesional.

Layout:

- sidebar kiri,
- topbar,
- cards statistik,
- peta besar,
- tabel prioritas.

Interaksi:

- filter realtime,
- sort table,
- expandable row,
- chart tooltip,
- marker pulse untuk risiko kritis.

### Peta Risiko

Nuansa:

- interaktif,
- fokus visual.

Fitur:

- search lokasi,
- filter status,
- legend warna,
- detail popup,
- fullscreen mode.

---

## 19. Design System Mini

### Spacing

Gunakan kelipatan 4 atau 8:

- 4px,
- 8px,
- 16px,
- 24px,
- 32px,
- 48px.

### Border Radius

- Button: 12px.
- Card: 20px.
- Modal: 24px.
- Map panel: 20px.

### Shadow

Card shadow lembut:

```css
0 8px 24px rgba(11, 58, 91, 0.08)
```

### Icon Style

Gunakan outline icons:

- map pin,
- droplet,
- alert triangle,
- check circle,
- clock,
- camera,
- chart line.

Library:

- Lucide Icons.

---

## 20. Konten Microcopy

### CTA

- **Laporkan Drainase**
- **Lihat Peta Risiko**
- **Cek Status Laporan**
- **Masuk Dashboard**

### Status

- **Menunggu Verifikasi**
- **Sudah Diverifikasi**
- **Dijadwalkan**
- **Sedang Ditangani**
- **Selesai**
- **Ditolak/Duplikat**

### Empty State

- “Belum ada laporan di wilayah ini.”
- “Tidak ada titik risiko tinggi hari ini.”
- “Semua laporan sudah tertangani.”

### Error State

- “Foto belum berhasil diunggah. Coba gunakan ukuran file yang lebih kecil.”
- “Lokasi belum dipilih.”
- “Deskripsi minimal 10 karakter.”

---

## 21. MVP Prioritization

### MVP 1 - Demo Penyisihan

Target: cukup untuk proposal dan video 5 menit.

Wajib ada:

- landing page,
- form laporan,
- dashboard admin,
- peta risiko,
- tabel prioritas,
- risk scoring,
- data dummy realistis Bandar Lampung.

Durasi pengerjaan realistis: 3-5 minggu.

### MVP 2 - Demo Final

Target: lebih matang dan siap diuji.

Tambahan:

- login role,
- upload *before-after*,
- statistik lengkap,
- sensor IoT dummy/real sederhana,
- export laporan PDF/CSV,
- video demo workflow end-to-end.

---

## 22. Roadmap Produk

### v1.0 - Web Platform

- laporan warga,
- dashboard admin,
- peta risiko,
- risk scoring,
- status tindak lanjut.

### v1.1 - Data Validation

- validasi RT/kelurahan,
- deteksi laporan duplikat,
- clustering laporan berdasarkan lokasi.

### v1.2 - Smart Analytics

- tren laporan,
- titik rawan berulang,
- rekomendasi jadwal pembersihan.

### v2.0 - IoT Integration

- sensor tinggi air,
- sensor hujan,
- data realtime,
- notifikasi otomatis.

### v2.1 - Public Alert

- notifikasi warga,
- integrasi Telegram/WhatsApp,
- peringatan area rawan.

---

## 23. Success Metrics

### Untuk Pengguna Warga

- waktu membuat laporan < 2 menit,
- minimal 80% pengguna uji coba memahami cara melapor,
- minimal 70% responden merasa status laporan lebih transparan.

### Untuk Admin/Kelurahan

- laporan dapat difilter berdasarkan wilayah/status,
- admin dapat menemukan prioritas tertinggi dalam < 30 detik,
- status tindak lanjut dapat diperbarui dalam < 1 menit.

### Untuk Lomba

Demo dapat menunjukkan alur lengkap:

1. warga lapor,
2. sistem menghitung risiko,
3. admin melihat prioritas,
4. admin memperbarui tindak lanjut,
5. peta dan statistik berubah.

---

## 24. Kesesuaian dengan GEMASTIK

ALIRIN v1 perlu diarahkan agar memenuhi bobot penilaian penyisihan Kota Cerdas:

| Kriteria GEMASTIK | Strategi ALIRIN |
|---|---|
| Permasalahan 30% | Fokus pada genangan dan drainase mikro di Bandar Lampung |
| Aspek pendukung 20% | Gunakan foto lapangan, survei warga, data wilayah, berita, dan regulasi |
| Referensi teknologi 30% | Web dashboard, GIS map, risk scoring, data workflow, roadmap IoT |
| Dampak implementasi 20% | Prioritas pembersihan, transparansi laporan, data historis, mitigasi genangan |

Kriteria final juga perlu diarahkan ke:

- penguasaan teknologi,
- proses bisnis,
- regulasi,
- aplikasi,
- keunikan lokal,
- potensi manfaat,
- fungsi dan fitur.

Karena itu, ALIRIN harus menonjolkan konteks Bandar Lampung, bukan tampil sebagai sistem generik.

---

## 25. Risiko Produk dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Terlihat seperti aplikasi laporan biasa | Nilai inovasi turun | Tonjolkan risk scoring, peta prioritas, dan workflow penanganan |
| Data lapangan kurang | Proposal kurang kuat | Kumpulkan foto, survei, dan wawancara sederhana |
| IoT belum dibuat | Teknologi terlihat kurang kuat | Masukkan roadmap IoT dan dummy sensor dashboard |
| Dashboard terlalu kaku | Demo kurang menarik | Gunakan animasi halus, peta interaktif, dan statistik dinamis |
| Scope terlalu luas | Sulit selesai | Fokus drainase mikro, bukan semua banjir kota |

---

## 26. Rekomendasi Tampilan Demo

Untuk video/demo lomba, alurnya sebaiknya begini:

1. Buka landing page ALIRIN.
2. Tampilkan masalah drainase/genangan di Bandar Lampung.
3. Warga membuat laporan dengan foto.
4. Laporan masuk ke dashboard admin.
5. Sistem otomatis memberi risk score.
6. Titik muncul di peta risiko.
7. Admin melihat daftar prioritas.
8. Admin mengubah status menjadi **Dijadwalkan** lalu **Selesai**.
9. Tampilkan statistik berubah.
10. Tutup dengan roadmap IoT.

---

## 27. Kesimpulan PRD

**ALIRIN v1** sebaiknya dibangun sebagai **platform web responsif** yang terdiri dari portal warga dan dashboard pemerintah/kelurahan. Fokus awalnya bukan langsung membuat perangkat IoT, tetapi membangun fondasi sistem Kota Cerdas:

- laporan visual,
- peta risiko,
- risk scoring,
- prioritas penanganan,
- dokumentasi tindak lanjut.

Arah frontend harus dibuat modern dan interaktif dengan tema air-lingkungan:

- warna biru tua,
- aqua,
- hijau,
- kuning,
- merah risiko,
- font Inter atau Plus Jakarta Sans,
- animasi gelombang halus,
- marker pulse,
- card fade-up,
- statistik dinamis.

Dengan PRD ini, ALIRIN v1 sudah punya arah produk yang jelas, mudah dipahami dosen, dan tetap kuat untuk dikembangkan ke versi IoT pada tahap berikutnya.
