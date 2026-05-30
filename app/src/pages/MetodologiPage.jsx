import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardCheck,
  Database,
  Droplets,
  Gauge,
  LockKeyhole,
  MapPin,
  ShieldAlert,
} from 'lucide-react'
import './MetodologiPage.css'

const scoreItems = [
  { label: 'Keparahan laporan', weight: '30%', detail: 'Ringan, sedang, parah, atau kritis.' },
  { label: 'Kategori masalah', weight: '25%', detail: 'Sumbatan, genangan, drainase rusak, aliran lambat, bau, atau lainnya.' },
  { label: 'Laporan sekitar', weight: '20%', detail: 'Jumlah laporan lain dalam radius sederhana sekitar titik laporan.' },
  { label: 'Fasilitas publik', weight: '15%', detail: 'Kedekatan dengan fasilitas dummy seperti kampus, pasar, rumah sakit, atau terminal.' },
  { label: 'Umur laporan', weight: '10%', detail: 'Laporan lama yang belum selesai naik prioritasnya secara bertahap.' },
]

const safetyItems = [
  {
    icon: LockKeyhole,
    title: 'Demo login, bukan auth produksi',
    body: 'Akun admin di project ini hanya untuk simulasi alur. Untuk produksi tetap perlu backend, session server-side, role, dan audit log.',
  },
  {
    icon: Database,
    title: 'Local-first',
    body: 'Data tersimpan di localStorage browser. Cocok untuk tugas, demo, dan eksplorasi, tetapi belum lintas perangkat.',
  },
  {
    icon: ShieldAlert,
    title: 'Input dibatasi',
    body: 'Laporan baru divalidasi, status harus memakai enum resmi, foto wajib berupa data URL image, dan export CSV diberi proteksi formula injection.',
  },
]

function Topbar() {
  return (
    <header className="method-topbar">
      <Link to="/" className="method-back">
        <ArrowLeft size={18} />
        Beranda
      </Link>
      <div className="method-brand">
        <span className="method-brand-mark"><Droplets size={18} /></span>
        ALIRIN
      </div>
      <Link to="/lapor" className="method-action">Buat laporan</Link>
    </header>
  )
}

export default function MetodologiPage() {
  return (
    <div className="method-page">
      <Topbar />

      <main className="method-main">
        <section className="method-hero">
          <span className="method-kicker">Metodologi prototype</span>
          <h1>Cara ALIRIN menghitung prioritas laporan drainase.</h1>
          <p>
            Halaman ini menjelaskan batasan dan cara kerja ALIRIN agar project tetap jujur
            sebagai prototype local-first untuk kebutuhan perkuliahan.
          </p>
        </section>

        <section className="method-grid">
          <article className="method-card method-card-wide">
            <div className="method-card-head">
              <Gauge size={20} />
              <div>
                <span>Risk scoring</span>
                <h2>Skor 0 sampai 100</h2>
              </div>
            </div>
            <p>
              Skor prioritas dihitung saat laporan dibuat. Angka ini bukan keputusan final,
              tetapi alat bantu admin untuk menyusun urutan tindak lanjut.
            </p>
            <div className="score-method-list">
              {scoreItems.map((item) => (
                <div key={item.label} className="score-method-row">
                  <strong>{item.weight}</strong>
                  <span>
                    <b>{item.label}</b>
                    <small>{item.detail}</small>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="method-card">
            <div className="method-card-head">
              <MapPin size={20} />
              <div>
                <span>Data lokal</span>
                <h2>Bandar Lampung</h2>
              </div>
            </div>
            <p>
              Data wilayah, fasilitas publik, dan laporan demo dipakai untuk membuat peta
              terasa lokal. Data ini masih dummy terstruktur, bukan data resmi produksi.
            </p>
          </article>

          <article className="method-card">
            <div className="method-card-head">
              <ClipboardCheck size={20} />
              <div>
                <span>Status</span>
                <h2>Timeline warga</h2>
              </div>
            </div>
            <p>
              Setiap perubahan status menambah riwayat. Warga bisa mengecek kode laporan
              untuk melihat progres dari masuk sampai selesai atau ditolak.
            </p>
          </article>
        </section>

        <section className="method-safety">
          <div className="method-section-title">
            <span>Keamanan dan batasan</span>
            <h2>Yang sudah diamankan di prototype ini.</h2>
          </div>
          <div className="safety-grid">
            {safetyItems.map((item) => (
              <article className="safety-card" key={item.title}>
                <item.icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="method-note">
          <strong>Batasan penting:</strong>
          <span>
            ALIRIN saat ini belum memakai backend, belum multi-user sungguhan, dan belum boleh
            dianggap sebagai sistem operasional pemerintah. Versi ini aman untuk demo lokal,
            evaluasi konsep, dan tugas kuliah.
          </span>
        </section>
      </main>
    </div>
  )
}
