export const REPORTS = [
  { id:'ALR-006', title:'Sumbatan dekat pasar', loc:'Enggal, Pelita', severity:'kritis', score:91, status:'masuk', time:'4 jam lalu', desc:'Saluran tertutup penuh oleh sampah pasar. Air meluap ke jalan utama.', pelapor:'Andi S.', kontak:'0812xxx' },
  { id:'ALR-001', title:'Drainase tersumbat sampah', loc:'Kedaton, Sidodadi', severity:'kritis', score:86, status:'masuk', time:'5 mnt lalu', desc:'Sampah menumpuk di inlet drainase. Genangan meluas saat hujan.', pelapor:'Budi R.', kontak:'0813xxx' },
  { id:'ALR-002', title:'Genangan jalan raya', loc:'Tanjung Karang, Palapa', severity:'parah', score:74, status:'verifikasi', time:'18 mnt lalu', desc:'Genangan setinggi 15cm menutup separuh jalan.', pelapor:'Siti M.', kontak:'0821xxx' },
  { id:'ALR-005', title:'Drainase rusak sisi barat', loc:'Panjang, Panjang Utara', severity:'parah', score:68, status:'masuk', time:'3 jam lalu', desc:'Dinding saluran retak dan amblas sekitar 2 meter.', pelapor:'Hendra', kontak:'-' },
  { id:'ALR-003', title:'Aliran lambat inlet timur', loc:'Sukarame, Way Dadi', severity:'sedang', score:55, status:'proses', time:'1 jam lalu', desc:'Debit aliran sangat lambat meski tidak ada sumbatan terlihat.', pelapor:'Wati', kontak:'0856xxx' },
  { id:'ALR-004', title:'Bau tidak sedap saluran', loc:'Kemiling, Sumber Rejo', severity:'sedang', score:48, status:'proses', time:'2 jam lalu', desc:'Bau menyengat dari saluran, kemungkinan limbah rumah tangga.', pelapor:'Anonim', kontak:'-' },
  { id:'ALR-007', title:'Genangan kecil RT 04', loc:'Rajabasa, Rajabasa Jaya', severity:'ringan', score:28, status:'selesai', time:'Kemarin', desc:'Genangan kecil di gang sempit, cepat surut.', pelapor:'Pak RT 04', kontak:'0857xxx' },
]

export const TREND_DATA = [
  { day:'Sen', val:12 }, { day:'Sel', val:18 }, { day:'Rab', val:9 },
  { day:'Kam', val:22 }, { day:'Jum', val:31 }, { day:'Sab', val:14 }, { day:'Min', val:27 },
]

export const MONTHLY_DATA = [
  { mon:'Jan', val:42 }, { mon:'Feb', val:38 }, { mon:'Mar', val:55 },
  { mon:'Apr', val:61 }, { mon:'Mei', val:128 },
]

export const RISK_DIST = [
  { label:'Kritis', count:8, pct:6, color:'var(--color-danger)' },
  { label:'Parah', count:19, pct:15, color:'var(--color-risk-high)' },
  { label:'Sedang', count:34, pct:27, color:'var(--color-warning)' },
  { label:'Ringan', count:67, pct:52, color:'var(--color-success)' },
]

export const ACTIVITY = [
  { text:'Laporan ALR-006 masuk - skor kritis 91', time:'4 mnt lalu', color:'var(--color-danger)' },
  { text:'Petugas Budi mulai tangani ALR-003', time:'22 mnt lalu', color:'var(--color-secondary)' },
  { text:'ALR-007 ditandai selesai + foto bukti', time:'1 jam lalu', color:'var(--color-success)' },
  { text:'Verifikasi ALR-002 oleh Supervisor', time:'2 jam lalu', color:'var(--color-secondary-dark)' },
  { text:'5 laporan baru dari wilayah Kemiling', time:'3 jam lalu', color:'var(--color-warning)' },
]

export const PETUGAS = [
  { name:'Budi Santoso', role:'Teknisi Lapangan', area:'Kedaton & Rajabasa', tasks:12, done:9, status:'online', color:'var(--color-secondary)' },
  { name:'Ahmad Fauzi', role:'Teknisi Lapangan', area:'Tanjung Karang', tasks:8, done:7, status:'online', color:'var(--color-success)' },
  { name:'Deni Pratama', role:'Supervisor', area:'Seluruh wilayah', tasks:5, done:5, status:'online', color:'var(--color-primary)' },
  { name:'Rina Wati', role:'Teknisi Lapangan', area:'Kemiling & Langkapura', tasks:10, done:6, status:'offline', color:'var(--color-warning)' },
  { name:'Slamet Riyadi', role:'Teknisi Lapangan', area:'Panjang & Bumi Waras', tasks:7, done:4, status:'offline', color:'var(--color-risk-high)' },
]

export const SETTINGS_ITEMS = [
  { id:'notif', label:'Notifikasi laporan baru', desc:'Push notification saat laporan masuk', default:true },
  { id:'sound', label:'Suara notifikasi', desc:'Bunyi alert untuk laporan kritis', default:true },
  { id:'auto', label:'Auto-refresh dashboard', desc:'Perbarui data setiap 30 detik', default:false },
  { id:'dark', label:'Mode gelap', desc:'Aktif secara default', default:true },
  { id:'export', label:'Export CSV otomatis', desc:'Kirim rekap harian ke email admin', default:false },
]

export const STATUS_OPTIONS = ['masuk','verifikasi','proses','selesai']
export const STATUS_LABEL = { masuk:'Masuk', verifikasi:'Verifikasi', proses:'Diproses', selesai:'Selesai' }
export const STATUS_CLASS = { masuk:'tag-masuk', verifikasi:'tag-verifikasi', proses:'tag-proses', selesai:'tag-selesai' }

export const DONUT_DATA = [
  { label:'Sumbatan', val:38, color:'var(--color-danger)' },
  { label:'Genangan', val:28, color:'var(--color-risk-high)' },
  { label:'Aliran lambat', val:18, color:'var(--color-warning)' },
  { label:'Rusak', val:10, color:'var(--color-secondary)' },
  { label:'Lainnya', val:6, color:'var(--color-text-secondary)' },
]
