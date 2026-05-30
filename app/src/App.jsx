import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useSEO } from './hooks/useSEO.js'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Camera,
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
  ListChecks,
  LocateFixed,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Navigation,
  RadioTower,
  Route as RouteIcon,
  Send,
  ShieldCheck,
  Target,
  TimerReset,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react'
import './App.css'
import { isRoleSessionActive } from './services/reportsStore.js'

const RiskMap = lazy(() => import('./components/RiskMap.jsx'))
const LaporPage = lazy(() => import('./pages/LaporPage.jsx'))
const PetaPage = lazy(() => import('./pages/PetaPage.jsx'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'))
const StatusPage = lazy(() => import('./pages/StatusPage.jsx'))
const MetodologiPage = lazy(() => import('./pages/MetodologiPage.jsx'))
const PetugasLoginPage = lazy(() => import('./pages/PetugasLoginPage.jsx'))
const PetugasTasksPage = lazy(() => import('./pages/PetugasTasksPage.jsx'))

const navItems = [
  { label: 'Masalah', href: '#masalah' },
  { label: 'Solusi', href: '#solusi' },
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Peta Risiko', href: '#peta-risiko' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Dampak', href: '#dampak' },
]

const problemCards = [
  {
    icon: Waves,
    title: 'Genangan berulang',
    body: 'Titik rawan muncul lebih cepat di peta.',
    tone: 'danger',
  },
  {
    icon: Clock3,
    title: 'Pelaporan lambat',
    body: 'Laporan masuk singkat, lengkap, dan terlacak.',
    tone: 'warning',
  },
  {
    icon: ListChecks,
    title: 'Prioritas kabur',
    body: 'Skor risiko membantu menentukan urutan kerja.',
    tone: 'neutral',
  },
]

const solutionCards = [
  {
    icon: Map,
    title: 'Peta risiko sebagai pusat kerja',
    body: 'Semua titik laporan terbaca dari satu tampilan.',
  },
  {
    icon: Gauge,
    title: 'Risk scoring 0-100',
    body: 'Prioritas dibuat dari lokasi, frekuensi, dampak, dan bukti.',
  },
  {
    icon: GitBranch,
    title: 'Status transparan',
    body: 'Status laporan jelas dari masuk sampai selesai.',
  },
]

const workflowSteps = [
  {
    icon: Camera,
    kicker: 'Langkah 1',
    title: 'Warga melapor cepat',
    body: 'Titik, foto, kategori, kirim.',
  },
  {
    icon: ShieldCheck,
    kicker: 'Langkah 2',
    title: 'Sistem memberi skor',
    body: 'Risiko dihitung otomatis.',
  },
  {
    icon: ClipboardCheck,
    kicker: 'Langkah 3',
    title: 'Admin menindaklanjuti',
    body: 'Petugas bekerja dari daftar prioritas.',
  },
]

const featureCards = [
  {
    icon: LocateFixed,
    title: 'Laporan berbasis lokasi',
    body: 'Koordinat, wilayah, kategori, foto.',
  },
  {
    icon: BarChart3,
    title: 'Prioritas otomatis',
    body: 'Titik paling urgent tampil lebih dulu.',
  },
  {
    icon: Filter,
    title: 'Filter wilayah dan status',
    body: 'Saring berdasarkan wilayah, status, dan risiko.',
  },
  {
    icon: ImageIcon,
    title: 'Foto bukti wajib',
    body: 'Minimal satu foto tersimpan bersama laporan.',
  },
  {
    icon: RadioTower,
    title: 'Ruang riset IoT',
    body: 'Sensor air bisa ditambahkan setelah core flow stabil.',
  },
  {
    icon: LockKeyhole,
    title: 'Demo admin lokal',
    body: 'Login demo untuk simulasi, bukan keamanan produksi.',
  },
]

const impactItems = [
  {
    icon: TimerReset,
    title: 'Respons lebih cepat',
    body: 'Petugas langsung melihat titik prioritas.',
  },
  {
    icon: Target,
    title: 'Pemeliharaan lebih tepat',
    body: 'Pola rawan terlihat per wilayah.',
  },
  {
    icon: FileCheck2,
    title: 'Akuntabilitas lapangan',
    body: 'Status dan bukti kerja tersimpan rapi.',
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
  const scrolledRef = useRef(false)

  useEffect(() => {
    let frameId = 0

    const updateScrolled = () => {
      frameId = 0
      const nextScrolled = window.scrollY > 16

      if (scrolledRef.current !== nextScrolled) {
        scrolledRef.current = nextScrolled
        setScrolled(nextScrolled)
      }
    }

    const onScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(updateScrolled)
    }

    updateScrolled()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', onScroll)
    }
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
          <Link className="btn btn-ghost" to="/admin/login">
            Masuk Dashboard
          </Link>
          <Link className="btn btn-primary" to="/lapor">
            <Send size={17} />
            Laporkan Drainase
          </Link>
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
            <Link className="btn btn-primary" to="/lapor">
              <Send size={17} />
              Laporkan Drainase
            </Link>
            <Link className="btn btn-outline" to="/peta">
              <Map size={17} />
              Lihat Peta Risiko
            </Link>
            <Link className="btn btn-ghost drawer-login" to="/admin/login">
              Masuk Dashboard
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}

function WaveCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    let frameId = 0
    let resizeObserver

    const draw = () => {
      frameId = 0
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      if (!width || !height) return

      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)

      const drawWave = (offset, amplitude, color, alpha, baseline) => {
        context.beginPath()
        context.moveTo(0, height)
        for (let x = 0; x <= width; x += 12) {
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

      drawWave(0.45, height * 0.12, '#22B8CF', 0.26, 0.46)
      drawWave(1.85, height * 0.08, '#0B7285', 0.18, 0.56)
      drawWave(2.6, height * 0.06, '#FFFFFF', 0.07, 0.66)
    }

    const scheduleDraw = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(draw)
    }

    scheduleDraw()

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(scheduleDraw)
      resizeObserver.observe(canvas)
    } else {
      window.addEventListener('resize', scheduleDraw, { passive: true })
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener('resize', scheduleDraw)
      }
    }
  }, [])

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
  return (
    <Suspense
      fallback={(
        <div className={`risk-map-card osm-map-card ${compact ? 'is-compact' : ''} map-preview-loading`}>
          <Droplets size={22} />
          <span>Memuat peta...</span>
        </div>
      )}
    >
      <RiskMap compact={compact} />
    </Suspense>
  )
}

const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const CHILD = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
  },
}

function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="hero-background" aria-hidden="true">
        <WaveCanvas />
        <div className="signal-line signal-line-one" />
        <div className="signal-line signal-line-two" />
        <div className="hero-scanline" />
        <div className="hero-noise" />
      </div>

      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          variants={STAGGER}
          initial="hidden"
          animate="show"
        >
          <motion.span className="hero-eyebrow" variants={CHILD}>
            <span aria-hidden="true" />
            Smart drainage intelligence
          </motion.span>

          <motion.h1 variants={CHILD} className="hero-headline">
            ALIRIN
          </motion.h1>

          <motion.p variants={CHILD}>
            Peta risiko drainase mikro untuk membaca laporan warga, titik rawan,
            dan prioritas lapangan dalam satu kanvas kerja.
          </motion.p>

          <motion.div className="hero-actions" variants={CHILD}>
            <Link className="btn btn-primary btn-large" to="/lapor">
              <Send size={18} />
              Laporkan Drainase
            </Link>
            <Link className="btn btn-on-dark btn-large" to="/peta">
              <Map size={18} />
              Lihat Peta Risiko
            </Link>
          </motion.div>

        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, x: 42, rotateY: -5 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-visual-glow" aria-hidden="true" />
          <RiskMapPreview compact />
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
          title="Drainase bermasalah perlu terlihat lebih cepat."
          body="Dari laporan warga menjadi sinyal risiko wilayah."
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
          title="Satu peta untuk melihat, memilah, dan menindaklanjuti."
          body="Peta, skor, status, dan bukti lapangan."
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
          title="Lapor cepat. Prioritas jelas."
          body="Alur sederhana untuk warga dan petugas."
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
            title="Risiko terlihat dari lokasi dan angka."
            body="Titik kritis, status, dan prioritas dalam satu tampilan."
          />

          <div className="score-panel">
            <div className="score-ring" aria-label="Skor risiko 86 dari 100">
              <span>86</span>
              <small>Kritis</small>
            </div>
            <div className="score-copy">
              <span className="risk-badge risk-kritis">Prioritas utama</span>
              <h3>Kedaton - Drainase tersumbat sampah</h3>
              <p>Genangan berulang dekat akses utama.</p>
            </div>
          </div>

          <div className="pipeline" aria-label="Alur status laporan">
            {statusPipeline.map((status, index) => (
              <span key={status} className={index < 3 ? 'is-done' : ''}>
                {status}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link className="btn btn-on-dark btn-large" to="/peta">
              <Map size={18} />
              Lihat Peta Risiko
            </Link>
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

function FeaturesSection() {
  return (
    <section className="section features-section" id="fitur">
      <div className="container">
        <SectionIntro
          align="center"
          label="Fitur Utama"
          title="Fitur inti untuk kerja lapangan."
          body="Ringkas, berbasis lokasi, dan mudah dipantau."
        />

        <div className="features-grid">
          {featureCards.map((feature, index) => (
            <motion.article
              className="feature-tile"
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.48, delay: index * 0.07 }}
            >
              <span className="feature-tile-icon">
                <feature.icon size={22} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </motion.article>
          ))}
        </div>
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
          title="Laporan warga menjadi sinyal preventif."
          body="Lebih cepat dibaca, lebih mudah ditindaklanjuti."
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
        <RouteIcon />
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
          <h2>Lihat risiko lebih cepat. Tindaklanjuti lebih tepat.</h2>
          <p>Kirim laporan dan pantau statusnya.</p>
          <div className="cta-actions">
            <Link className="btn btn-primary btn-large" to="/lapor">
              <Send size={18} />
              Laporkan Drainase
            </Link>
            <Link className="btn btn-on-dark btn-large" to="/peta">
              <Map size={18} />
              Lihat Peta Risiko
            </Link>
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
          <p>Peta risiko drainase mikro untuk Bandar Lampung.</p>
        </div>

        <div>
          <h2>Platform</h2>
          <Link to="/lapor">Laporkan Drainase</Link>
          <Link to="/peta">Peta Risiko</Link>
          <Link to="/metodologi">Metodologi</Link>
        </div>

        <div>
          <h2>Admin</h2>
          <Link to="/admin/login">Masuk Dashboard</Link>
          <Link to="/petugas/login">Masuk Petugas</Link>
          <Link to="/admin/dashboard">Dashboard Admin</Link>
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
        <span>Peta, laporan, prioritas.</span>
      </div>
    </footer>
  )
}

function LandingPage() {
  useSEO({
    title: 'Beranda',
    description: 'ALIRIN - Sistem pelaporan dan pemetaan risiko drainase mikro untuk warga Kota Bandar Lampung.'
  })

  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <WorkflowSection />
        <RiskSection />
        <FeaturesSection />
        <StatsBand />
        <ImpactSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function NotFoundPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'var(--color-background)', textAlign: 'center', padding: 24 }}>
      <span style={{ fontSize: 72, fontWeight: 800, color: 'var(--color-secondary)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>404</span>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Halaman tidak ditemukan</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0, maxWidth: 360 }}>
        Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
        <Droplets size={17} />
        Kembali ke Beranda
      </Link>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="brand-mark" aria-hidden="true">
        <Droplets size={21} strokeWidth={2.4} />
      </span>
      <strong>Memuat ALIRIN...</strong>
    </div>
  )
}

function AdminRoute() {
  if (isRoleSessionActive('admin')) return <AdminDashboard />
  return <Navigate to="/admin/login" replace state={{ from: '/admin/dashboard' }} />
}

function PetugasRoute() {
  if (isRoleSessionActive('petugas')) return <PetugasTasksPage />
  return <Navigate to="/petugas/login" replace state={{ from: '/petugas/tugas' }} />
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lapor" element={<LaporPage />} />
          <Route path="/status/:code" element={<StatusPage />} />
          <Route path="/peta" element={<PetaPage />} />
          <Route path="/metodologi" element={<MetodologiPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute />} />
          <Route path="/petugas/login" element={<PetugasLoginPage />} />
          <Route path="/petugas/tugas" element={<PetugasRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
