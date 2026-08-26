// Master wilayah Kota Bandar Lampung: 20 kecamatan, 126 kelurahan.
// Sumber: Daftar kecamatan dan kelurahan di Kota Bandar Lampung (Wikipedia,
// mengikuti Permendagri), diperiksa ulang 26 Agustus 2026 terhadap nama desa
// yang dipancarkan endpoint BMKG.
//
// Sebelumnya daftar ini hanya memuat 122 kelurahan, sehingga titik yang dipilih
// di wilayah yang belum terdaftar membuat laporan ditolak validasi. Yang
// diperbaiki: Tanjung Gading, Gedong Meneng, Gedong Meneng Baru, Pasir Gintung,
// dan Gulak Galik ditambahkan; 'Nyunyai' dihapus karena bukan kelurahan resmi
// (yang benar 'Rajabasa Nunyai', sudah ada); 'Tukik' diperbaiki menjadi
// 'Teluk Betung'.
//
// Dua ejaan diselaraskan dengan sumber Kemendagri lewat BMKG: 'Gedong Pakuon'
// dan 'Parwata'. 'Gedong Pakuon' sempat diubah menjadi 'Gedong Pakuan' pada
// perbaikan sebelumnya -- perubahan itu keliru dan dikembalikan di sini.
// Tidak ada laporan yang memakai nama lama, jadi perbaikan ini tidak merusak
// data yang ada.
export const KECAMATAN_DATA = {
  'Bumi Waras': [
    'Bumi Raya', 'Bumi Waras', 'Garuntang', 'Kangkung', 'Sukaraja',
  ],
  'Enggal': [
    'Enggal', 'Gunung Sari', 'Pahoman', 'Pelita', 'Rawa Laut', 'Tanjung Karang',
  ],
  'Kedamaian': [
    'Bumi Kedamaian', 'Kalibalau Kencana', 'Kedamaian', 'Tanjung Agung Raya', 'Tanjung Baru',
    'Tanjung Gading', 'Tanjung Raya',
  ],
  'Kedaton': [
    'Kedaton', 'Penengahan', 'Penengahan Raya', 'Sidodadi', 'Sukamenanti', 'Sukamenanti Baru',
    'Surabaya',
  ],
  'Kemiling': [
    'Beringin Jaya', 'Beringin Raya', 'Kedaung', 'Kemiling Permai', 'Kemiling Raya',
    'Pinang Jaya', 'Sumber Agung', 'Sumber Rejo', 'Sumber Rejo Sejahtera',
  ],
  'Labuhan Ratu': [
    'Kampung Baru', 'Kampung Baru Raya', 'Kota Sepang', 'Labuhan Ratu', 'Labuhan Ratu Raya',
    'Sepang Jaya',
  ],
  'Langkapura': [
    'Bilabong Jaya', 'Gunung Agung', 'Gunung Terang', 'Langkapura', 'Langkapura Baru',
  ],
  'Panjang': [
    'Karang Maritim', 'Ketapang', 'Ketapang Kuala', 'Panjang Selatan', 'Panjang Utara',
    'Pidada', 'Srengsem', 'Way Lunik',
  ],
  'Rajabasa': [
    'Gedong Meneng', 'Gedong Meneng Baru', 'Rajabasa', 'Rajabasa Jaya', 'Rajabasa Nunyai',
    'Rajabasa Pemuka', 'Rajabasa Raya',
  ],
  'Sukabumi': [
    'Campang Jaya', 'Campang Raya', 'Nusantara Permai', 'Sukabumi', 'Sukabumi Indah',
    'Way Gubak', 'Way Laga',
  ],
  'Sukarame': [
    'Korpri Jaya', 'Korpri Raya', 'Sukarame', 'Sukarame Baru', 'Way Dadi', 'Way Dadi Baru',
  ],
  'Tanjung Karang Barat': [
    'Gedong Air', 'Kelapa Tiga Permai', 'Segala Mider', 'Sukadanaham', 'Sukajawa',
    'Sukajawa Baru', 'Susunan Baru',
  ],
  'Tanjung Karang Pusat': [
    'Durian Payung', 'Gotong Royong', 'Kaliawi', 'Kaliawi Persada', 'Kelapa Tiga', 'Palapa',
    'Pasir Gintung',
  ],
  'Tanjung Karang Timur': [
    'Kebon Jeruk', 'Kota Baru', 'Sawah Brebes', 'Sawah Lama', 'Tanjung Agung',
  ],
  'Tanjung Senang': [
    'Labuhan Dalam', 'Pematang Wangi', 'Perumnas Way Kandis', 'Tanjung Senang', 'Way Kandis',
  ],
  'Teluk Betung Barat': [
    'Bakung', 'Batu Putuk', 'Kuripan', 'Negeri Olok Gading', 'Sukarame II',
  ],
  'Teluk Betung Selatan': [
    'Gedong Pakuon', 'Gunung Mas', 'Pesawahan', 'Sumur Putri', 'Talang', 'Teluk Betung',
  ],
  'Teluk Betung Timur': [
    'Keteguhan', 'Kota Karang', 'Kota Karang Raya', 'Parwata', 'Sukamaju', 'Way Tataan',
  ],
  'Teluk Betung Utara': [
    'Gulak Galik', 'Kupang Kota', 'Kupang Raya', 'Kupang Teba', 'Pengajaran', 'Sumur Batu',
  ],
  'Way Halim': [
    'Gunung Sulah', 'Jagabaya I', 'Jagabaya II', 'Jagabaya III', 'Perumnas Way Halim',
    'Way Halim Permai',
  ],
}

export const PUBLIC_FACILITIES = [
  { name: 'RSUD Abdul Moeloek', type: 'Rumah sakit', lat: -5.3994, lng: 105.2526 },
  { name: 'Stasiun Tanjung Karang', type: 'Transportasi', lat: -5.4077, lng: 105.2581 },
  { name: 'Pasar Bambu Kuning', type: 'Pasar', lat: -5.4128, lng: 105.2586 },
  { name: 'Terminal Rajabasa', type: 'Transportasi', lat: -5.3717, lng: 105.2406 },
  { name: 'Universitas Lampung', type: 'Kampus', lat: -5.3648, lng: 105.2438 },
  { name: 'Lapangan Saburai', type: 'Ruang publik', lat: -5.4238, lng: 105.2588 },
  { name: 'Pelabuhan Panjang', type: 'Pelabuhan', lat: -5.4729, lng: 105.3182 },
  { name: 'Pasar Kangkung', type: 'Pasar', lat: -5.4395, lng: 105.2674 },
]

// Batas Kota Bandar Lampung. Koordinat di luar kotak ini bukan laporan yang sah.
export const CITY_BOUNDS = {
  latMin: -5.62,
  latMax: -5.28,
  lngMin: 105.15,
  lngMax: 105.36,
}

export function isInsideCity(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  return latitude >= CITY_BOUNDS.latMin && latitude <= CITY_BOUNDS.latMax
    && longitude >= CITY_BOUNDS.lngMin && longitude <= CITY_BOUNDS.lngMax
}

// Kode wilayah Permendagri untuk endpoint prakiraan BMKG. Daftarnya kurasi,
// sama persis dengan app/src/main/assets/bandar_lampung_kelurahan.json di mobile.
// Baru 20 dari 126 kelurahan yang terpetakan; sisanya memakai pencadangan
// tingkat kecamatan lalu titik acuan kota (lihat resolveAdm4).
// Kode wilayah BMKG untuk SELURUH 126 kelurahan.
//
// Tiap kode di bawah dibaca langsung dari endpoint prakiraan BMKG pada
// 26 Agustus 2026, satu per satu, dan nama desa yang dikembalikannya dicocokkan
// dengan daftar di atas. Tidak ada kode yang ditebak.
//
// Sebelumnya hanya ada 20 baris di sini, dan 17 di antaranya salah: enam
// menunjuk kecamatan yang sama sekali berbeda (18.71.06 ternyata Tanjung Karang
// Pusat, bukan Sukarame) dan tiga tidak ada di Bandar Lampung sama sekali.
// Endpoint tetap menjawab 200 untuk kode yang salah, sehingga kekeliruannya
// tidak pernah terlihat: faktor Cuaca memakai hujan dari wilayah yang keliru
// tanpa satu pun tanda kesalahan.
export const KELURAHAN_ADM4 = [
  ['Kedaton', 'Kedaton', '18.71.01.1003'],
  ['Kedaton', 'Surabaya', '18.71.01.1004'],
  ['Kedaton', 'Sukamenanti', '18.71.01.1005'],
  ['Kedaton', 'Sidodadi', '18.71.01.1006'],
  ['Kedaton', 'Sukamenanti Baru', '18.71.01.1009'],
  ['Kedaton', 'Penengahan', '18.71.01.1010'],
  ['Kedaton', 'Penengahan Raya', '18.71.01.1012'],
  ['Sukarame', 'Sukarame', '18.71.02.1003'],
  ['Sukarame', 'Way Dadi', '18.71.02.1004'],
  ['Sukarame', 'Sukarame Baru', '18.71.02.1006'],
  ['Sukarame', 'Way Dadi Baru', '18.71.02.1007'],
  ['Sukarame', 'Korpri Jaya', '18.71.02.1008'],
  ['Sukarame', 'Korpri Raya', '18.71.02.1009'],
  ['Tanjung Karang Barat', 'Gedong Air', '18.71.03.1001'],
  ['Tanjung Karang Barat', 'Sukajawa', '18.71.03.1002'],
  ['Tanjung Karang Barat', 'Susunan Baru', '18.71.03.1004'],
  ['Tanjung Karang Barat', 'Sukadanaham', '18.71.03.1006'],
  ['Tanjung Karang Barat', 'Kelapa Tiga Permai', '18.71.03.1008'],
  ['Tanjung Karang Barat', 'Sukajawa Baru', '18.71.03.1010'],
  ['Tanjung Karang Barat', 'Segala Mider', '18.71.03.1011'],
  ['Panjang', 'Panjang Selatan', '18.71.04.1001'],
  ['Panjang', 'Srengsem', '18.71.04.1002'],
  ['Panjang', 'Panjang Utara', '18.71.04.1003'],
  ['Panjang', 'Pidada', '18.71.04.1004'],
  ['Panjang', 'Karang Maritim', '18.71.04.1007'],
  ['Panjang', 'Way Lunik', '18.71.04.1008'],
  ['Panjang', 'Ketapang', '18.71.04.1009'],
  ['Panjang', 'Ketapang Kuala', '18.71.04.1010'],
  ['Tanjung Karang Timur', 'Kota Baru', '18.71.05.1002'],
  ['Tanjung Karang Timur', 'Tanjung Agung', '18.71.05.1003'],
  ['Tanjung Karang Timur', 'Kebon Jeruk', '18.71.05.1004'],
  ['Tanjung Karang Timur', 'Sawah Lama', '18.71.05.1005'],
  ['Tanjung Karang Timur', 'Sawah Brebes', '18.71.05.1006'],
  ['Tanjung Karang Pusat', 'Durian Payung', '18.71.06.1001'],
  ['Tanjung Karang Pusat', 'Gotong Royong', '18.71.06.1002'],
  ['Tanjung Karang Pusat', 'Palapa', '18.71.06.1005'],
  ['Tanjung Karang Pusat', 'Kaliawi', '18.71.06.1006'],
  ['Tanjung Karang Pusat', 'Kelapa Tiga', '18.71.06.1007'],
  ['Tanjung Karang Pusat', 'Pasir Gintung', '18.71.06.1010'],
  ['Tanjung Karang Pusat', 'Kaliawi Persada', '18.71.06.1012'],
  ['Teluk Betung Selatan', 'Pesawahan', '18.71.07.1001'],
  ['Teluk Betung Selatan', 'Teluk Betung', '18.71.07.1002'],
  ['Teluk Betung Selatan', 'Talang', '18.71.07.1008'],
  ['Teluk Betung Selatan', 'Gedong Pakuon', '18.71.07.1009'],
  ['Teluk Betung Selatan', 'Sumur Putri', '18.71.07.1012'],
  ['Teluk Betung Selatan', 'Gunung Mas', '18.71.07.1013'],
  ['Teluk Betung Barat', 'Bakung', '18.71.08.1005'],
  ['Teluk Betung Barat', 'Kuripan', '18.71.08.1006'],
  ['Teluk Betung Barat', 'Negeri Olok Gading', '18.71.08.1007'],
  ['Teluk Betung Barat', 'Sukarame II', '18.71.08.1008'],
  ['Teluk Betung Barat', 'Batu Putuk', '18.71.08.1009'],
  ['Teluk Betung Utara', 'Kupang Kota', '18.71.09.1001'],
  ['Teluk Betung Utara', 'Kupang Raya', '18.71.09.1003'],
  ['Teluk Betung Utara', 'Kupang Teba', '18.71.09.1004'],
  ['Teluk Betung Utara', 'Pengajaran', '18.71.09.1006'],
  ['Teluk Betung Utara', 'Gulak Galik', '18.71.09.1007'],
  ['Teluk Betung Utara', 'Sumur Batu', '18.71.09.1008'],
  ['Rajabasa', 'Rajabasa', '18.71.10.1001'],
  ['Rajabasa', 'Gedong Meneng', '18.71.10.1002'],
  ['Rajabasa', 'Rajabasa Nunyai', '18.71.10.1005'],
  ['Rajabasa', 'Rajabasa Pemuka', '18.71.10.1006'],
  ['Rajabasa', 'Gedong Meneng Baru', '18.71.10.1007'],
  ['Rajabasa', 'Rajabasa Raya', '18.71.10.1008'],
  ['Rajabasa', 'Rajabasa Jaya', '18.71.10.1009'],
  ['Tanjung Senang', 'Tanjung Senang', '18.71.11.1001'],
  ['Tanjung Senang', 'Way Kandis', '18.71.11.1002'],
  ['Tanjung Senang', 'Labuhan Dalam', '18.71.11.1003'],
  ['Tanjung Senang', 'Perumnas Way Kandis', '18.71.11.1004'],
  ['Tanjung Senang', 'Pematang Wangi', '18.71.11.1005'],
  ['Sukabumi', 'Sukabumi', '18.71.12.1002'],
  ['Sukabumi', 'Sukabumi Indah', '18.71.12.1004'],
  ['Sukabumi', 'Campang Raya', '18.71.12.1007'],
  ['Sukabumi', 'Nusantara Permai', '18.71.12.1008'],
  ['Sukabumi', 'Campang Jaya', '18.71.12.1009'],
  ['Sukabumi', 'Way Gubak', '18.71.12.1010'],
  ['Sukabumi', 'Way Laga', '18.71.12.1011'],
  ['Kemiling', 'Sumber Rejo', '18.71.13.1001'],
  ['Kemiling', 'Beringin Jaya', '18.71.13.1003'],
  ['Kemiling', 'Kemiling Permai', '18.71.13.1004'],
  ['Kemiling', 'Sumber Agung', '18.71.13.1005'],
  ['Kemiling', 'Kedaung', '18.71.13.1006'],
  ['Kemiling', 'Pinang Jaya', '18.71.13.1007'],
  ['Kemiling', 'Sumber Rejo Sejahtera', '18.71.13.1008'],
  ['Kemiling', 'Kemiling Raya', '18.71.13.1009'],
  ['Kemiling', 'Beringin Raya', '18.71.13.1010'],
  ['Labuhan Ratu', 'Labuhan Ratu', '18.71.14.1001'],
  ['Labuhan Ratu', 'Labuhan Ratu Raya', '18.71.14.1002'],
  ['Labuhan Ratu', 'Sepang Jaya', '18.71.14.1003'],
  ['Labuhan Ratu', 'Kota Sepang', '18.71.14.1004'],
  ['Labuhan Ratu', 'Kampung Baru Raya', '18.71.14.1006'],
  ['Labuhan Ratu', 'Kampung Baru', '18.71.14.1007'],
  ['Way Halim', 'Perumnas Way Halim', '18.71.15.1001'],
  ['Way Halim', 'Way Halim Permai', '18.71.15.1002'],
  ['Way Halim', 'Gunung Sulah', '18.71.15.1003'],
  ['Way Halim', 'Jagabaya I', '18.71.15.1004'],
  ['Way Halim', 'Jagabaya II', '18.71.15.1005'],
  ['Way Halim', 'Jagabaya III', '18.71.15.1006'],
  ['Langkapura', 'Langkapura', '18.71.16.1001'],
  ['Langkapura', 'Langkapura Baru', '18.71.16.1002'],
  ['Langkapura', 'Gunung Terang', '18.71.16.1003'],
  ['Langkapura', 'Bilabong Jaya', '18.71.16.1005'],
  ['Langkapura', 'Gunung Agung', '18.71.16.1006'],
  ['Enggal', 'Enggal', '18.71.17.1001'],
  ['Enggal', 'Pelita', '18.71.17.1002'],
  ['Enggal', 'Tanjung Karang', '18.71.17.1003'],
  ['Enggal', 'Gunung Sari', '18.71.17.1004'],
  ['Enggal', 'Rawa Laut', '18.71.17.1005'],
  ['Enggal', 'Pahoman', '18.71.17.1006'],
  ['Kedamaian', 'Kedamaian', '18.71.18.1001'],
  ['Kedamaian', 'Bumi Kedamaian', '18.71.18.1002'],
  ['Kedamaian', 'Tanjung Agung Raya', '18.71.18.1003'],
  ['Kedamaian', 'Tanjung Baru', '18.71.18.1004'],
  ['Kedamaian', 'Kalibalau Kencana', '18.71.18.1005'],
  ['Kedamaian', 'Tanjung Raya', '18.71.18.1006'],
  ['Kedamaian', 'Tanjung Gading', '18.71.18.1007'],
  ['Teluk Betung Timur', 'Kota Karang', '18.71.19.1001'],
  ['Teluk Betung Timur', 'Kota Karang Raya', '18.71.19.1002'],
  ['Teluk Betung Timur', 'Parwata', '18.71.19.1003'],
  ['Teluk Betung Timur', 'Keteguhan', '18.71.19.1004'],
  ['Teluk Betung Timur', 'Sukamaju', '18.71.19.1005'],
  ['Teluk Betung Timur', 'Way Tataan', '18.71.19.1006'],
  ['Bumi Waras', 'Sukaraja', '18.71.20.1001'],
  ['Bumi Waras', 'Bumi Waras', '18.71.20.1002'],
  ['Bumi Waras', 'Garuntang', '18.71.20.1003'],
  ['Bumi Waras', 'Bumi Raya', '18.71.20.1004'],
  ['Bumi Waras', 'Kangkung', '18.71.20.1005'],
]

// Durian Payung, Tanjung Karang Pusat -- pusat kota yang sebenarnya.
const CITY_FALLBACK_ADM4 = '18.71.06.1001'

// Kelurahan persis -> kelurahan mana pun di kecamatan yang sama -> acuan kota.
// Hujan 3 jam BMKG bersifat regional, jadi pencadangan tingkat kecamatan tetap
// bermakna untuk faktor cuaca. Yang dihindari adalah mengarang kode wilayah.
export function resolveAdm4(kecamatan, kelurahan) {
  const kec = String(kecamatan || '').trim().toLowerCase()
  const kel = String(kelurahan || '').trim().toLowerCase()

  const exact = KELURAHAN_ADM4.find(([k, l]) => k.toLowerCase() === kec && l.toLowerCase() === kel)
  if (exact) return { adm4: exact[2], precision: 'kelurahan' }

  const sameKecamatan = KELURAHAN_ADM4.find(([k]) => k.toLowerCase() === kec)
  if (sameKecamatan) return { adm4: sameKecamatan[2], precision: 'kecamatan' }

  return { adm4: CITY_FALLBACK_ADM4, precision: 'kota' }
}
