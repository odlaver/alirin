import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Droplets,
  FileCheck2,
  Filter,
  Gauge,
  GitBranch,
  Image as ImageIcon,
  Layers3,
  LayoutDashboard,
  ListChecks,
  LocateFixed,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Navigation,
  RadioTower,
  Route,
  Search,
  Send,
  ShieldCheck,
  Target,
  TimerReset,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react'
import './App.css'

const navItems = [
  { label: 'Masalah', href: '#masalah' },
  { label: 'Solusi', href: '#solusi' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Peta Risiko', href: '#peta-risiko' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Dampak', href: '#dampak' },
]

const heroStats = [
  { value: '128+', label: 'Laporan masuk' },
  { value: '20', label: 'Kelurahan terpantau' },
  { value: '87%', label: 'Ditindaklanjuti' },
]

const problemCards = [
  {
    icon: Waves,
    title: 'Genangan berulang',
    body: 'Titik yang sama sering tergenang karena sumbatan mikro baru terlihat setelah hujan deras.',
    tone: 'danger',
  },
  {
    icon: Clock3,
    title: 'Pelaporan lambat',
    body: 'Warga punya bukti lapangan, tetapi kanal laporan sering tidak ringkas dan sulit dilacak.',
    tone: 'warning',
  },
  {
    icon: ListChecks,
    title: 'Prioritas kabur',
    body: 'Laporan masuk tanpa skor risiko membuat tim lapangan sulit memilih titik yang paling mendesak.',
    tone: 'neutral',
  },
]

const solutionCards = [
  {
    icon: Map,
    title: 'Peta risiko sebagai pusat kerja',
    body: 'Titik laporan tampil dengan level Normal, Waspada, Tinggi, dan Kritis agar keputusan dimulai dari lokasi.',
  },
  {
    icon: Gauge,
    title: 'Risk scoring 0-100',
    body: 'Skor dibentuk dari tingkat genangan, frekuensi laporan sekitar, lokasi strategis, riwayat rawan, dan bukti foto.',
  },
  {
    icon: GitBranch,
    title: 'Status transparan',
    body: 'Warga melihat laporan dari verifikasi, jadwal penanganan, proses lapangan, sampai selesai dengan dokumentasi.',
  },
]

const workflowSteps = [
  {
    icon: Camera,
    kicker: 'Langkah 1',
    title: 'Warga melapor cepat',
    body: 'Pilih titik, unggah foto, pilih kategori, lalu kirim laporan drainase dalam alur tiga langkah.',
  },
  {
    icon: ShieldCheck,
    kicker: 'Langkah 2',
    title: 'Sistem memberi skor',
    body: 'ALIRIN membaca konteks wilayah, frekuensi laporan, tingkat genangan, dan bukti visual untuk menyusun prioritas.',
  },
  {
    icon: ClipboardCheck,
    kicker: 'Langkah 3',
    title: 'Admin menindaklanjuti',
    body: 'Kelurahan atau dinas melihat peta, daftar prioritas, dan timeline kerja sebelum memperbarui status laporan.',
  },
]

const featureCards = [
  {
    icon: LocateFixed,
    title: 'Laporan berbasis lokasi',
    body: 'Setiap laporan terhubung ke koordinat, kecamatan, kelurahan, kategori masalah, dan bukti foto.',
  },
  {
    icon: BarChart3,
    title: 'Prioritas otomatis',
    body: 'Dashboard menonjolkan titik dengan skor tertinggi agar tim tidak memulai dari daftar laporan mentah.',
  },
  {
    icon: Filter,
    title: 'Filter wilayah dan status',
    body: 'Admin dapat melihat pola berdasarkan wilayah, kategori, status verifikasi, dan level risiko.',
  },
  {
    icon: ImageIcon,
    title: 'Dokumentasi before-after',
    body: 'Foto sebelum dan sesudah penanganan menjaga akuntabilitas serta memudahkan rekap pekerjaan.',
  },
  {
    icon: RadioTower,
    title: 'Siap integrasi IoT',
    body: 'Struktur produk dapat berkembang ke sensor tinggi air, curah hujan, dan notifikasi rawan genangan.',
  },
  {
    icon: LockKeyhole,
    title: 'Cocok untuk tata kelola',
    body: 'Bahasa, komponen status, dan alur verifikasi disiapkan untuk kerja warga, RT, kelurahan, dan dinas.',
  },
]

const riskMarkers = [
  {
    id: 'kedaton',
    x: 29,
    y: 24,
    score: 86,
    level: 'Kritis',
    area: 'Kedaton',
    issue: 'Drainase tersumbat sampah',
    status: 'Menunggu Verifikasi',
  },
  {
    id: 'sukarame',
    x: 63,
    y: 36,
    score: 72,
    level: 'Tinggi',
    area: 'Sukarame',
    issue: 'Genangan menutup badan jalan',
    status: 'Dijadwalkan',
  },
  {
    id: 'tanjungkarang',
    x: 46,
    y: 64,
    score: 54,
    level: 'Waspada',
    area: 'Tanjung Karang Pusat',
    issue: 'Aliran melambat setelah hujan',
    status: 'Sudah Diverifikasi',
  },
  {
    id: 'telukbetung',
    x: 75,
    y: 68,
    score: 31,
    level: 'Normal',
    area: 'Teluk Betung Selatan',
    issue: 'Pantauan rutin drainase',
    status: 'Selesai',
  },
]

const priorityRows = [
  {
    code: 'ALR-2026-00128',
    area: 'Kedaton',
    category: 'Sumbatan sampah',
    score: 86,
    level: 'Kritis',
    status: 'Menunggu Verifikasi',
  },
  {
    code: 'ALR-2026-00124',
    area: 'Sukarame',
    category: 'Genangan jalan',
    score: 72,
    level: 'Tinggi',
    status: 'Dijadwalkan',
  },
  {
    code: 'ALR-2026-00119',
    area: 'Tanjung Karang',
    category: 'Aliran lambat',
    score: 54,
    level: 'Waspada',
    status: 'Sudah Diverifikasi',
  },
]

const impactItems = [
  {
    icon: TimerReset,
    title: 'Respons lebih cepat',
    body: 'Laporan yang sudah tersusun berdasarkan risiko membantu petugas menemukan titik prioritas tanpa memilah manual.',
  },
  {
    icon: Target,
    title: 'Pemeliharaan lebih tepat',
    body: 'Pola genangan per wilayah bisa dipakai untuk merencanakan pembersihan drainase sebelum dampaknya meluas.',
  },
  {
    icon: FileCheck2,
    title: 'Akuntabilitas lapangan',
    body: 'Timeline status dan dokumentasi foto membuat warga tahu apakah laporan sudah diverifikasi dan ditangani.',
  },
]

const statusPipeline = [
  'Laporan masuk',
  'Diverifikasi',
  'Dijadwalkan',
  'Sedang ditangani',
  'Selesai',
]

const revealViewport = { once: true, amount: 0.22 }

function getLevelClass(level) {
  return level.toLowerCase()
}

function smoothScrollToHash(event, href) {
  if (!href.startsWith('#')) return

  const target = document.querySelector(href)
  if (!target) return

  event.preventDefault()
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('drawer-lock', drawerOpen)
    return () => document.body.classList.remove('drawer-lock')
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <a
          className="brand"
          href="/"
          aria-label="ALIRIN beranda"
          onClick={(event) => smoothScrollToHash(event, '#top')}
        >
          <span className="brand-mark" aria-hidden="true">
            <Droplets size={21} strokeWidth={2.4} />
          </span>
          <span>ALIRIN</span>
        </a>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => smoothScrollToHash(event, item.href)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="desktop-actions">
          <a className="btn btn-ghost" href="/admin/login">
            Masuk Dashboard
          </a>
          <a className="btn btn-primary" href="/lapor">
            <Send size={17} />
            Laporkan Drainase
          </a>
        </div>

        <button
          className="menu-button"
          type="button"
          aria-label="Buka menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={24} />
        </button>
      </header>

      <div
        className={`drawer-shell ${drawerOpen ? 'is-open' : ''}`}
        aria-hidden={!drawerOpen}
      >
        <button
          className="drawer-backdrop"
          type="button"
          aria-label="Tutup menu"
          onClick={closeDrawer}
        />
        <aside
          className="mobile-drawer"
          id="mobile-drawer"
          aria-label="Menu mobile"
        >
          <div className="drawer-head">
            <span className="drawer-title">Menu ALIRIN</span>
            <button type="button" aria-label="Tutup menu" onClick={closeDrawer}>
              <X size={22} />
            </button>
          </div>

          <nav className="drawer-links" aria-label="Navigasi mobile">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  smoothScrollToHash(event, item.href)
                  closeDrawer()
                }}
              >
                {item.label}
                <ChevronRight size={16} />
              </a>
            ))}
          </nav>

          <div className="drawer-actions">
            <a className="btn btn-primary" href="/lapor">
              <Send size={17} />
              Laporkan Drainase
            </a>
            <a className="btn btn-outline" href="/peta">
              <Map size={17} />
              Lihat Peta Risiko
            </a>
            <a className="btn btn-ghost drawer-login" href="/admin/login">
              Masuk Dashboard
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}

function WaveCanvas() {
  const canvasRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || prefersReducedMotion) return undefined

    const context = canvas.getContext('2d')
    let frame = 0
    let animationFrame = 0
    let width = 0
    let height = 0
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const drawWave = (offset, amplitude, color, alpha, baseline) => {
      context.beginPath()
      context.moveTo(0, height)
      for (let x = 0; x <= width; x += 8) {
        const y =
          Math.sin((x / width) * Math.PI * 2 + offset) * amplitude +
          Math.sin((x / width) * Math.PI * 4 + offset * 0.8) *
            (amplitude * 0.36) +
          height * baseline
        context.lineTo(x, y)
      }
      context.lineTo(width, height)
      context.closePath()
      context.globalAlpha = alpha
      context.fillStyle = color
      context.fill()
      context.globalAlpha = 1
    }

    const render = () => {
      context.clearRect(0, 0, width, height)
      const time = frame * 0.012
      drawWave(time, height * 0.12, '#22B8CF', 0.28, 0.46)
      drawWave(time * 0.65 + 1.3, height * 0.08, '#0B7285', 0.19, 0.56)
      drawWave(time * 1.1 + 2.2, height * 0.06, '#FFFFFF', 0.08, 0.66)
      frame += 1
      animationFrame = requestAnimationFrame(render)
    }

    resize()
    render()
    window.addEventListener('resize', resize, { passive: true })

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
    }
  }, [prefersReducedMotion])

  return <canvas ref={canvasRef} className="wave-canvas" aria-hidden="true" />
}

function SectionIntro({ label, title, body, align = 'left' }) {
  return (
    <motion.div
      className={`section-intro section-intro-${align}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="section-label">{label}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </motion.div>
  )
}

function RiskMapPreview({ compact = false }) {
  const [activeMarker, setActiveMarker] = useState(riskMarkers[0])

  return (
    <div className={`risk-map-card ${compact ? 'is-compact' : ''}`}>
      <div className="map-card-head">
        <div>
          <span className="micro-label">Peta Risiko</span>
          <strong>Bandar Lampung</strong>
        </div>
        <span className="live-pill">
          <span aria-hidden="true" />
          Live MVP
        </span>
      </div>

      <div className="map-viewport" aria-label="Preview peta risiko Bandar Lampung">
        <div className="map-grid" aria-hidden="true" />
        <div className="map-water map-water-one" aria-hidden="true" />
        <div className="map-water map-water-two" aria-hidden="true" />
        <div className="map-road map-road-one" aria-hidden="true" />
        <div className="map-road map-road-two" aria-hidden="true" />
        <div className="map-road map-road-three" aria-hidden="true" />

        {riskMarkers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            className={`risk-marker risk-${getLevelClass(marker.level)} ${
              activeMarker.id === marker.id ? 'is-active' : ''
            }`}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            onClick={() => setActiveMarker(marker)}
            aria-label={`${marker.area}, skor ${marker.score}, risiko ${marker.level}`}
          >
            <span className="marker-pulse" aria-hidden="true" />
            <span className="marker-pin">{marker.score}</span>
          </button>
        ))}

        <motion.div
          key={activeMarker.id}
          className="map-popup"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28 }}
        >
          <div>
            <span className={`risk-badge risk-${getLevelClass(activeMarker.level)}`}>
              {activeMarker.level}
            </span>
            <strong>{activeMarker.area}</strong>
          </div>
          <p>{activeMarker.issue}</p>
          <span>{activeMarker.status}</span>
        </motion.div>
      </div>

      <div className="map-legend" aria-label="Legenda risiko">
        {['Normal', 'Waspada', 'Tinggi', 'Kritis'].map((level) => (
          <span key={level}>
            <i className={`legend-dot risk-${getLevelClass(level)}`} />
            {level}
          </span>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  const heroMotion = useMemo(
    () => ({
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    }),
    [],
  )

  return (
    <section className="hero-section" id="top">
      <div className="hero-background" aria-hidden="true">
        <WaveCanvas />
        <div className="signal-line signal-line-one" />
        <div className="signal-line signal-line-two" />
        <div className="hero-noise" />
      </div>

      <div className="container hero-grid">
        <motion.div className="hero-copy" {...heroMotion}>
          <span className="hero-eyebrow">
            <span aria-hidden="true" />
            Smart City Drainase Bandar Lampung
          </span>
          <h1>Ubah laporan drainase menjadi prioritas aksi preventif.</h1>
          <p>
            ALIRIN membantu warga melaporkan titik drainase bermasalah,
            menghitung risiko genangan, dan memberi pemerintah urutan
            penanganan yang lebih jelas.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary btn-large" href="/lapor">
              <Send size={18} />
              Laporkan Drainase
            </a>
            <a className="btn btn-on-dark btn-large" href="/peta">
              <Map size={18} />
              Lihat Peta Risiko
            </a>
          </div>

          <div className="hero-stat-row" aria-label="Statistik MVP ALIRIN">
            {heroStats.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, y: 34, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.82, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <RiskMapPreview compact />

          <motion.div
            className="floating-card floating-card-top"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="floating-icon danger-soft">
              <AlertTriangle size={19} />
            </span>
            <div>
              <span>Risiko Kritis</span>
              <strong>3 titik hari ini</strong>
            </div>
          </motion.div>

          <motion.div
            className="floating-card floating-card-bottom"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="floating-icon success-soft">
              <CheckCircle2 size={19} />
            </span>
            <div>
              <span>Selesai Ditangani</span>
              <strong>24 minggu ini</strong>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="hero-bottom-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 88" preserveAspectRatio="none">
          <path d="M0 42C180 70 338 74 520 50C718 24 858 -11 1090 28C1240 54 1344 66 1440 44V88H0V42Z" />
        </svg>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="section surface-section" id="masalah">
      <div className="container">
        <SectionIntro
          label="Masalah yang diselesaikan"
          title="Genangan kecil sering terlambat terlihat sampai dampaknya membesar."
          body="Drainase mikro yang tersumbat biasanya tersebar di gang, jalan lingkungan, dan dekat fasilitas publik. ALIRIN membuat sinyal lapangan itu masuk ke peta dan daftar prioritas."
        />

        <div className="card-grid three">
          {problemCards.map((item, index) => (
            <motion.article
              className="info-card"
              key={item.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.48, delay: index * 0.08 }}
            >
              <span className={`card-icon ${item.tone}`}>
                <item.icon size={24} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function SolutionSection() {
  return (
    <section className="section mist-section" id="solusi">
      <div className="container split-section">
        <SectionIntro
          label="Solusi ALIRIN"
          title="Satu alur dari laporan warga ke keputusan lapangan."
          body="Landing page ini menonjolkan inti produk: peta, risk score, validasi, dan status yang bisa dilacak oleh warga maupun admin."
        />

        <div className="solution-stack">
          {solutionCards.map((item, index) => (
            <motion.article
              className="solution-card"
              key={item.title}
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <span>
                <item.icon size={22} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkflowSection() {
  return (
    <section className="section surface-section" id="cara-kerja">
      <div className="container">
        <SectionIntro
          align="center"
          label="Cara kerja"
          title="Tiga langkah ringkas, cukup untuk demo MVP yang utuh."
          body="Alurnya dibuat sederhana untuk warga, tetapi tetap menyimpan konteks yang dibutuhkan admin saat mengambil keputusan."
        />

        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <motion.article
              className="workflow-card"
              key={step.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.52, delay: index * 0.1 }}
            >
              <span className="step-number">{index + 1}</span>
              <span className="workflow-icon">
                <step.icon size={27} />
              </span>
              <small>{step.kicker}</small>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function RiskSection() {
  return (
    <section className="section risk-section" id="peta-risiko">
      <div className="container risk-layout">
        <div>
          <SectionIntro
            label="Peta dan prioritas"
            title="Risk score terlihat sebagai angka, bukan sekadar warna marker."
            body="Admin dapat langsung melihat titik kritis, alasan risiko, status laporan, dan daftar prioritas terdekat dari peta."
          />

          <div className="score-panel">
            <div className="score-ring" aria-label="Skor risiko 86 dari 100">
              <span>86</span>
              <small>Kritis</small>
            </div>
            <div className="score-copy">
              <span className="risk-badge risk-kritis">Prioritas utama</span>
              <h3>Kedaton - Drainase tersumbat sampah</h3>
              <p>
                Skor tinggi karena genangan menutup akses jalan, laporan
                berulang dalam radius sekitar, dan dekat fasilitas publik.
              </p>
            </div>
          </div>

          <div className="pipeline" aria-label="Alur status laporan">
            {statusPipeline.map((status, index) => (
              <span key={status} className={index < 3 ? 'is-done' : ''}>
                {status}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.58 }}
        >
          <RiskMapPreview />
        </motion.div>
      </div>
    </section>
  )
}

function PrioritySection() {
  return (
    <section className="section command-section" id="fitur">
      <div className="container">
        <div className="command-heading">
          <SectionIntro
            label="Fitur utama"
            title="Command center ringan untuk prioritas drainase."
            body="ALIRIN tidak berhenti di form laporan. Setiap laporan langsung dibaca sebagai sinyal lokasi, diberi skor risiko, lalu masuk ke ruang kerja admin untuk diprioritaskan."
          />

          <div className="command-proof" aria-label="Keunggulan ALIRIN">
            <span>
              <Gauge size={16} />
              Risk scoring 0-100
            </span>
            <span>
              <MapPin size={16} />
              Map-first workflow
            </span>
            <span>
              <GitBranch size={16} />
              Status tracking
            </span>
          </div>
        </div>

        <motion.div
          className="command-shell"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          <aside className="command-sidebar" aria-label="Navigasi dashboard contoh">
            <div className="command-brand">
              <span className="brand-mark" aria-hidden="true">
                <Droplets size={19} />
              </span>
              <div>
                <strong>ALIRIN</strong>
                <span>Admin Kota</span>
              </div>
            </div>
            <nav>
              <span className="is-active">
                <LayoutDashboard size={17} />
                Dashboard
              </span>
              <span>
                <Map size={17} />
                Peta Risiko
              </span>
              <span>
                <ListChecks size={17} />
                Prioritas
              </span>
              <span>
                <ImageIcon size={17} />
                Dokumentasi
              </span>
            </nav>
          </aside>

          <div className="command-main">
            <div className="command-topbar">
              <div>
                <span className="micro-label">Dashboard Admin</span>
                <strong>Drainase Mikro Bandar Lampung</strong>
              </div>
              <div className="command-tools">
                <span>
                  <Search size={15} />
                  Cari lokasi atau kode
                </span>
                <span>
                  <Filter size={15} />
                  Semua status
                </span>
              </div>
            </div>

            <div className="command-kpis" aria-label="Ringkasan dashboard">
              <div className="kpi-card critical">
                <span>Risiko kritis</span>
                <strong>3</strong>
                <small>Perlu verifikasi lapangan</small>
              </div>
              <div className="kpi-card warning">
                <span>Menunggu validasi</span>
                <strong>18</strong>
                <small>RT dan kelurahan terkait</small>
              </div>
              <div className="kpi-card success">
                <span>Selesai minggu ini</span>
                <strong>24</strong>
                <small>Dengan foto after</small>
              </div>
              <div className="kpi-card aqua">
                <span>Kelurahan terpantau</span>
                <strong>20</strong>
                <small>Data demo MVP</small>
              </div>
            </div>

            <div className="command-workspace">
              <div className="ops-map-panel">
                <div className="ops-panel-head">
                  <div>
                    <span className="micro-label">Live map</span>
                    <strong>Titik risiko aktif</strong>
                  </div>
                  <span className="live-pill">
                    <span aria-hidden="true" />
                    Updated 2m ago
                  </span>
                </div>

                <div className="ops-map" aria-label="Peta operasional contoh">
                  <div className="ops-map-grid" aria-hidden="true" />
                  <div className="ops-drain-line one" aria-hidden="true" />
                  <div className="ops-drain-line two" aria-hidden="true" />
                  {riskMarkers.map((marker) => (
                    <span
                      className={`ops-marker risk-${getLevelClass(marker.level)}`}
                      key={marker.id}
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    >
                      <i aria-hidden="true" />
                      {marker.score}
                    </span>
                  ))}
                  <div className="ops-popup">
                    <span className="risk-badge risk-kritis">Kritis</span>
                    <strong>ALR-2026-00128</strong>
                    <p>Kedaton - sumbatan sampah dekat akses jalan utama.</p>
                  </div>
                </div>
              </div>

              <div className="ops-priority-panel">
                <div className="ops-panel-head">
                  <div>
                    <span className="micro-label">Prioritas tindakan</span>
                    <strong>Urutan lapangan hari ini</strong>
                  </div>
                  <span className="dashboard-chip">
                    <Activity size={14} />
                    5 update baru
                  </span>
                </div>

                <div className="ops-priority-list">
                  {priorityRows.map((row, index) => (
                    <article className="ops-priority-item" key={row.code}>
                      <div className="priority-rank">{String(index + 1).padStart(2, '0')}</div>
                      <div>
                        <strong>{row.area}</strong>
                        <span>{row.code} - {row.category}</span>
                      </div>
                      <div className="priority-score">
                        <span>{row.score}</span>
                        <i className={`legend-dot risk-${getLevelClass(row.level)}`} />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="recommendation-card">
                  <span>
                    <Target size={18} />
                  </span>
                  <div>
                    <strong>Rekomendasi aksi</strong>
                    <p>Verifikasi Kedaton lebih dulu, lalu jadwalkan pembersihan drainase di koridor Sukarame.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="command-feature-strip">
              {featureCards.map((feature) => (
                <span key={feature.title}>
                  <feature.icon size={16} />
                  {feature.title}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function StatsBand() {
  const stats = [
    { value: '128+', label: 'Laporan masuk', icon: FileCheck2 },
    { value: '20', label: 'Kelurahan terpantau', icon: MapPin },
    { value: '87%', label: 'Tindak lanjut', icon: TrendingUp },
    { value: '3', label: 'Titik kritis hari ini', icon: AlertTriangle },
  ]

  return (
    <section className="stats-band" aria-label="Statistik demo ALIRIN">
      <div className="container stats-grid">
        {stats.map((item, index) => (
          <motion.div
            className="stat-card"
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ duration: 0.42, delay: index * 0.06 }}
          >
            <item.icon size={22} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function ImpactSection() {
  return (
    <section className="section mist-section" id="dampak">
      <div className="container">
        <SectionIntro
          align="center"
          label="Dampak untuk Bandar Lampung"
          title="Data warga dipakai sebagai sinyal preventif, bukan hanya arsip keluhan."
          body="Setiap laporan menjadi bagian dari pola wilayah, prioritas perawatan, dan bukti tindak lanjut pemerintah."
        />

        <div className="impact-grid">
          {impactItems.map((item, index) => (
            <motion.article
              className="impact-card"
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.48, delay: index * 0.08 }}
            >
              <span>
                <item.icon size={24} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="final-cta">
      <div className="cta-watermark" aria-hidden="true">
        <Route />
        <Layers3 />
        <Navigation />
      </div>
      <div className="container final-cta-inner">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.55 }}
        >
          <span className="hero-eyebrow">
            <span aria-hidden="true" />
            Mulai dari satu titik drainase
          </span>
          <h2>Bantu kota melihat risiko sebelum genangan menjadi masalah besar.</h2>
          <p>
            Kirim laporan, lihat peta risiko, dan ikuti status penanganannya.
            ALIRIN membuat data lapangan lebih siap dipakai untuk aksi.
          </p>
          <div className="cta-actions">
            <a className="btn btn-primary btn-large" href="/lapor">
              <Send size={18} />
              Laporkan Drainase
            </a>
            <a className="btn btn-on-dark btn-large" href="/peta">
              <Map size={18} />
              Lihat Peta Risiko
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="brand footer-logo">
            <span className="brand-mark" aria-hidden="true">
              <Droplets size={20} />
            </span>
            ALIRIN
          </span>
          <p>
            Sistem kota cerdas berbasis peta untuk monitoring dan prioritas
            preventif drainase mikro di Bandar Lampung.
          </p>
        </div>

        <div>
          <h2>Platform</h2>
          <a href="/lapor">Laporkan Drainase</a>
          <a href="/peta">Peta Risiko</a>
          <a href="/status">Cek Status Laporan</a>
        </div>

        <div>
          <h2>Admin</h2>
          <a href="/admin/login">Masuk Dashboard</a>
          <a href="/admin/prioritas">Daftar Prioritas</a>
          <a href="/admin/statistik">Statistik</a>
        </div>

        <div>
          <h2>Fokus MVP</h2>
          <span>SDG 6</span>
          <span>SDG 11</span>
          <span>SDG 13</span>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>2026 ALIRIN - Smart City Bandar Lampung</span>
        <span>Clean civic-tech dashboard with purposeful water motion.</span>
      </div>
    </footer>
  )
}

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <WorkflowSection />
        <RiskSection />
        <PrioritySection />
        <StatsBand />
        <ImpactSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}

export default App
