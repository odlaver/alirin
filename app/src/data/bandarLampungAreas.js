// Master wilayah Kota Bandar Lampung: 20 kecamatan, 126 kelurahan.
// Sumber: Daftar kecamatan dan kelurahan di Kota Bandar Lampung (Wikipedia,
// mengikuti Permendagri), diperiksa ulang 26 Agustus 2026.
//
// Sebelumnya daftar ini hanya memuat 122 kelurahan, sehingga titik yang dipilih
// di wilayah yang belum terdaftar membuat laporan ditolak validasi. Yang
// diperbaiki: Tanjung Gading, Gedong Meneng, Gedong Meneng Baru, Pasir Gintung,
// dan Gulak Galik ditambahkan; 'Nyunyai' dihapus karena bukan kelurahan resmi
// (yang benar 'Rajabasa Nunyai', sudah ada); 'Gedong Pakuon' dan 'Tukik'
// diperbaiki menjadi 'Gedong Pakuan' dan 'Teluk Betung'.
export const KECAMATAN_DATA = {
  'Bumi Waras': ['Bumi Raya', 'Bumi Waras', 'Garuntang', 'Kangkung', 'Sukaraja'],
  Enggal: ['Enggal', 'Gunung Sari', 'Pahoman', 'Pelita', 'Rawa Laut', 'Tanjung Karang'],
  Kedamaian: ['Bumi Kedamaian', 'Kalibalau Kencana', 'Kedamaian', 'Tanjung Agung Raya', 'Tanjung Baru', 'Tanjung Gading', 'Tanjung Raya'],
  Kedaton: ['Kedaton', 'Penengahan', 'Penengahan Raya', 'Sidodadi', 'Sukamenanti', 'Sukamenanti Baru', 'Surabaya'],
  Kemiling: ['Beringin Jaya', 'Beringin Raya', 'Kedaung', 'Kemiling Permai', 'Kemiling Raya', 'Pinang Jaya', 'Sumber Agung', 'Sumber Rejo', 'Sumber Rejo Sejahtera'],
  'Labuhan Ratu': ['Kampung Baru', 'Kampung Baru Raya', 'Kota Sepang', 'Labuhan Ratu', 'Labuhan Ratu Raya', 'Sepang Jaya'],
  Langkapura: ['Bilabong Jaya', 'Gunung Agung', 'Gunung Terang', 'Langkapura', 'Langkapura Baru'],
  Panjang: ['Karang Maritim', 'Ketapang', 'Ketapang Kuala', 'Panjang Selatan', 'Panjang Utara', 'Pidada', 'Srengsem', 'Way Lunik'],
  Rajabasa: ['Gedong Meneng', 'Gedong Meneng Baru', 'Rajabasa', 'Rajabasa Jaya', 'Rajabasa Nunyai', 'Rajabasa Pemuka', 'Rajabasa Raya'],
  Sukabumi: ['Campang Jaya', 'Campang Raya', 'Nusantara Permai', 'Sukabumi', 'Sukabumi Indah', 'Way Gubak', 'Way Laga'],
  Sukarame: ['Korpri Jaya', 'Korpri Raya', 'Sukarame', 'Sukarame Baru', 'Way Dadi', 'Way Dadi Baru'],
  'Tanjung Karang Barat': ['Gedong Air', 'Kelapa Tiga Permai', 'Segala Mider', 'Sukadanaham', 'Sukajawa', 'Sukajawa Baru', 'Susunan Baru'],
  'Tanjung Karang Pusat': ['Durian Payung', 'Gotong Royong', 'Kaliawi', 'Kaliawi Persada', 'Kelapa Tiga', 'Palapa', 'Pasir Gintung'],
  'Tanjung Karang Timur': ['Kebon Jeruk', 'Kota Baru', 'Sawah Brebes', 'Sawah Lama', 'Tanjung Agung'],
  'Tanjung Senang': ['Labuhan Dalam', 'Pematang Wangi', 'Perumnas Way Kandis', 'Tanjung Senang', 'Way Kandis'],
  'Teluk Betung Barat': ['Bakung', 'Batu Putuk', 'Kuripan', 'Negeri Olok Gading', 'Sukarame II'],
  'Teluk Betung Selatan': ['Gedong Pakuan', 'Gunung Mas', 'Pesawahan', 'Sumur Putri', 'Talang', 'Teluk Betung'],
  'Teluk Betung Timur': ['Keteguhan', 'Kota Karang', 'Kota Karang Raya', 'Perwata', 'Sukamaju', 'Way Tataan'],
  'Teluk Betung Utara': ['Gulak Galik', 'Kupang Kota', 'Kupang Raya', 'Kupang Teba', 'Pengajaran', 'Sumur Batu'],
  'Way Halim': ['Gunung Sulah', 'Jagabaya I', 'Jagabaya II', 'Jagabaya III', 'Perumnas Way Halim', 'Way Halim Permai'],
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
export const KELURAHAN_ADM4 = [
  ['Kemiling', 'Beringin Jaya', '18.71.13.1001'],
  ['Kemiling', 'Beringin Raya', '18.71.13.1002'],
  ['Kemiling', 'Kedaung', '18.71.13.1003'],
  ['Kemiling', 'Kemiling Permai', '18.71.13.1004'],
  ['Kemiling', 'Kemiling Raya', '18.71.13.1005'],
  ['Kemiling', 'Pinang Jaya', '18.71.13.1007'],
  ['Rajabasa', 'Rajabasa', '18.71.10.1001'],
  ['Rajabasa', 'Rajabasa Jaya', '18.71.10.1002'],
  ['Rajabasa', 'Rajabasa Raya', '18.71.10.1006'],
  ['Sukarame', 'Sukarame', '18.71.06.1001'],
  ['Sukarame', 'Way Dadi', '18.71.06.1003'],
  ['Kedaton', 'Kedaton', '18.71.05.1001'],
  ['Kedaton', 'Sidodadi', '18.71.05.1004'],
  ['Way Halim', 'Way Halim Permai', '18.71.15.1006'],
  ['Way Halim', 'Perumnas Way Halim', '18.71.15.1005'],
  ['Sukabumi', 'Sukabumi Indah', '18.71.12.1005'],
  ['Sukabumi', 'Sukabumi', '18.71.12.1004'],
  ['Tanjung Karang Pusat', 'Gotong Royong', '18.71.03.1002'],
  ['Tanjung Karang Pusat', 'Palapa', '18.71.03.1006'],
  ['Labuhan Ratu', 'Labuhan Ratu', '18.71.14.1004'],
]

const CITY_FALLBACK_ADM4 = '18.71.03.1002'

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
