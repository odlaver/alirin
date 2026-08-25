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
  { label: 'Keparahan laporan', weight: '35%', detail: 'Ringan, sedang, parah, atau kritis, sesuai pilihan pelapor.' },
  { label: 'Histori kejadian', weight: '25%', detail: 'Laporan lain di titik yang sama, radius 350 m dalam 180 hari terakhir. Laporan yang ditolak tidak dihitung.' },
  { label: 'Cuaca', weight: '25%', detail: 'Curah hujan 3 jam ke depan dari prakiraan BMKG pada wilayah laporan. Bila BMKG tidak terjangkau, bobotnya dibagi ulang ke faktor lain.' },
  { label: 'Dampak lokasi', weight: '15%', detail: 'Jarak ke fasilitas publik terdekat: rumah sakit, kampus, pasar, atau simpul transportasi.' },
]

const safetyItems = [
  {
    icon: LockKeyhole,
    title: 'Autentikasi berbasis peran',
    body: 'Login memakai Supabase Auth. Peran admin dan petugas dibaca dari JWT lalu ditegakkan Row Level Security di sisi database, bukan hanya di antarmuka.',
  },
  {
    icon: Database,
    title: 'Satu sumber angka',
    body: 'Laporan tersimpan di PostgreSQL dan tersinkron lintas perangkat. Risk score dihitung trigger database, sehingga web dan aplikasi mobile menampilkan angka yang sama untuk laporan yang sama.',
  },
  {
    icon: ShieldAlert,
    title: 'Batas akses publik',
    body: 'Halaman publik membaca view tanpa nama dan kontak pelapor, dengan koordinat dibulatkan ke sekitar 110 meter. Koordinat presisi hanya terbuka bagi petugas yang login.',
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
          <span className="method-kicker">Metodologi</span>
          <h1>Cara ALIRIN menghitung prioritas laporan drainase.</h1>
          <p>
            Halaman ini menjelaskan cara kerja dan batasan ALIRIN secara terbuka, termasuk
            rumus prioritas yang dipakai dan hal-hal yang belum tercakup.
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
              Skor dihitung trigger database memakai rumus Proposal 4.4, dengan jendela
              histori berlabuh pada waktu laporan dibuat. Menghitung ulang kapan pun
              memberi angka yang sama, sehingga urutan prioritas bisa diaudit. Angka ini
              alat bantu penyusunan urutan, bukan keputusan final.
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
                <span>Data wilayah</span>
                <h2>Bandar Lampung</h2>
              </div>
            </div>
            <p>
              Master 20 kecamatan dan 122 kelurahan dipakai untuk memvalidasi wilayah
              laporan. Daftar fasilitas publik masih kurasi terbatas, dan pemetaan kode
              wilayah BMKG baru mencakup sebagian kelurahan.
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
              Setiap perubahan status menambah riwayat, dan urutannya dijaga di database
              sehingga tidak ada tahap yang bisa dilompati. Warga memakai link status
              pribadi untuk melihat progres dari masuk sampai selesai atau ditolak.
            </p>
          </article>
        </section>

        <section className="method-safety">
          <div className="method-section-title">
            <span>Keamanan dan batasan</span>
            <h2>Yang sudah ditegakkan sistem.</h2>
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
            ALIRIN adalah sistem pendukung keputusan, bukan pengganti kewenangan instansi.
            Skor risiko membantu menyusun urutan, sedangkan keputusan penanganan tetap pada
            admin dan verifikasi petugas di lapangan. Analisis berbantuan AI dan masukan
            sensor IoT masih tahap berikutnya pada roadmap, sehingga skor saat ini sepenuhnya
            berbasis aturan yang dapat diaudit di halaman ini.
          </span>
        </section>
      </main>
    </div>
  )
}
