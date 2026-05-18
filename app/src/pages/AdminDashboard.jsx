import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Bell, Droplets, FileCheck2, LayoutDashboard,
  ListChecks, LogOut, Map, Menu, RefreshCw, Search, Settings,
  TrendingUp, Users
} from 'lucide-react'
import './AdminDashboard.css'
import { REPORTS, STATUS_LABEL } from './adminData.js'
import {
  KpiCards, ReportModal, ReportList, TrendChart,
  RiskDist, ActivityFeed, MapPreview,
  StatistikView, PetugasView, PengaturanView,
} from './AdminParts.jsx'

const NAV_MAIN = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'laporan', label: 'Laporan Masuk', icon: FileCheck2, badge: 6 },
  { id: 'prioritas', label: 'Daftar Prioritas', icon: ListChecks },
  { id: 'peta', label: 'Peta Risiko', icon: Map },
]

const NAV_EXTRA = [
  { id: 'statistik', label: 'Statistik', icon: BarChart3 },
  { id: 'petugas', label: 'Petugas', icon: Users },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
]

const PAGE_TITLE = {
  dashboard: ['Dashboard', 'Ringkasan semua data laporan'],
  laporan: ['Laporan Masuk', 'Kelola semua laporan warga'],
  prioritas: ['Daftar Prioritas', 'Laporan diurutkan berdasarkan skor risiko'],
  peta: ['Peta Risiko', 'Visualisasi titik rawan drainase'],
  statistik: ['Statistik', 'Analisis data laporan'],
  petugas: ['Petugas', 'Manajemen petugas lapangan'],
  pengaturan: ['Pengaturan', 'Konfigurasi sistem dashboard'],
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
function Sidebar({ nav, setNav, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-logo">
          <span className="logo-icon"><Droplets size={18} /></span>
          <div>ALIRIN<small>Admin Panel</small></div>
        </div>
        <nav className="admin-nav">
          <span className="admin-nav-section">Menu Utama</span>
          {NAV_MAIN.map(({ id, label, icon: I, badge }) => (
            <button key={id} className={`admin-nav-item ${nav === id ? 'active' : ''}`}
              onClick={() => { setNav(id); setMobileOpen(false) }}>
              <I size={18} />{label}
              {badge && <span className="admin-nav-badge">{badge}</span>}
            </button>
          ))}
          <span className="admin-nav-section" style={{ marginTop: 8 }}>Lainnya</span>
          {NAV_EXTRA.map(({ id, label, icon: I }) => (
            <button key={id} className={`admin-nav-item ${nav === id ? 'active' : ''}`}
              onClick={() => { setNav(id); setMobileOpen(false) }}>
              <I size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-avatar">A</div>
            <div className="admin-user-info"><strong>Admin ALIRIN</strong><small>admin@alirin.id</small></div>
            <LogOut size={16} className="logout-icon" />
          </div>
        </div>
      </aside>
    </>
  )
}

/* ── Dashboard View (home) ─────────────────────────────────────────────── */
function DashboardView({ reports, animated, onSelect }) {
  const [filter, setFilter] = useState('semua')
  const FILTERS = ['semua', 'masuk', 'verifikasi', 'proses', 'selesai']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Baris 1: KPI Cards */}
      <KpiCards animated={animated} />

      {/* Baris 2: Split Layout (Mirip Referensi Gambar: Listing & Map) */}
      <div className="split-layout">

        {/* Kolom Kiri: Listing Laporan */}
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="panel-head">
            <div>
              <h2>Laporan Terbaru</h2>
              <p>Diurutkan berdasarkan waktu & risiko</p>
            </div>
            <div className="filter-pills">
              {FILTERS.map(f => (
                <button key={f} className={`pill-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {STATUS_LABEL[f] || 'Semua'}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body">
            <ReportList reports={reports} filter={filter} onSelect={onSelect} />
          </div>
        </motion.div>

        {/* Kolom Kanan: Peta Risiko */}
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="panel-head">
            <div>

              <h2>Peta Risiko Wilayah</h2>
              <p>Titik rawan aktif hari ini</p>
            </div>
            <Link className="btn btn-primary btn-large" to="/peta">
              <Map size={18} />
              Lihat Peta Risiko
            </Link>
          </div>
          <div className="panel-body map-body">
            <MapPreview />
          </div>
        </motion.div>
      </div>

      {/* Baris 3: Analytics & Activity (Konsep Asli ALIRIN) */}
      <div className="bottom-grid">
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="panel-head">
            <div><h2>Tren Laporan</h2><p>7 hari terakhir</p></div>
            <span className="panel-badge info"><TrendingUp size={12} /> +22%</span>
          </div>
          <TrendChart />
        </motion.div>

        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="panel-head">
            <div><h2>Distribusi Risiko</h2><p>Berdasarkan skor ancaman</p></div>
          </div>
          <RiskDist />
        </motion.div>

        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <div className="panel-head">
            <div><h2>Aktivitas Terkini</h2><p>Update real-time</p></div>
          </div>
          <ActivityFeed />
        </motion.div>
      </div>
    </div>
  )
}

/* ── Laporan View ──────────────────────────────────────────────────────── */
function LaporanView({ reports, onSelect }) {
  const [filter, setFilter] = useState('semua')
  const [search, setSearch] = useState('')
  const FILTERS = ['semua', 'masuk', 'verifikasi', 'proses', 'selesai']
  const filtered = reports.filter(r => {
    if (filter !== 'semua' && r.status !== filter) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.loc.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div><h2>Semua Laporan</h2><p>{reports.length} laporan terdaftar</p></div>
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Cari laporan..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="filter-pills" style={{ padding: '0 32px 16px' }}>
        {FILTERS.map(f => (
          <button key={f} className={`pill-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {STATUS_LABEL[f] || 'Semua'}
          </button>
        ))}
      </div>
      <div className="panel-body"><ReportList reports={filtered} filter="semua" onSelect={onSelect} /></div>
    </motion.div>
  )
}

/* ── Prioritas View ────────────────────────────────────────────────────── */
function PrioritasView({ reports, onSelect }) {
  const sorted = [...reports].sort((a, b) => b.score - a.score)
  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head"><div><h2>Daftar Prioritas</h2><p>Diurutkan berdasarkan tingkat risiko bahaya</p></div></div>
      <div className="panel-body"><ReportList reports={sorted} filter="semua" onSelect={onSelect} /></div>
    </motion.div>
  )
}

/* ── Peta View ─────────────────────────────────────────────────────────── */
function PetaView() {
  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head"><div><h2>Peta Risiko Wilayah Lengkap</h2><p>Pantauan langsung seluruh area</p></div></div>
      <div className="panel-body" style={{ padding: 32 }}>
        <div className="admin-map-panel" style={{ height: 500 }}>
          <MapPreview />
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [nav, setNav] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [reports, setReports] = useState(REPORTS)
  const [selected, setSelected] = useState(null)

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  function handleRefresh() { setRefreshing(true); setTimeout(() => setRefreshing(false), 1200) }
  function handleStatusChange(id, newStatus) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    setSelected(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev)
  }

  const [title, subtitle] = PAGE_TITLE[nav] || ['Dashboard', '']

  function renderView() {
    switch (nav) {
      case 'laporan': return <LaporanView reports={reports} onSelect={setSelected} />
      case 'prioritas': return <PrioritasView reports={reports} onSelect={setSelected} />
      case 'peta': return <PetaView />
      case 'statistik': return <StatistikView />
      case 'petugas': return <PetugasView />
      case 'pengaturan': return <PengaturanView />
      default: return <DashboardView reports={reports} animated={animated} onSelect={setSelected} />
    }
  }

  return (
    <div className="admin-page">
      <Sidebar nav={nav} setNav={setNav} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setMobileOpen(true)}><Menu size={24} /></button>
            <div className="admin-topbar-title">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-search desktop-only">
              <Search size={16} />
              <input type="text" placeholder="Cari..." />
            </div>
            <button className="icon-btn"><Bell size={18} /><span className="notif-dot"></span></button>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Memuat...' : 'Perbarui'}</span>
            </button>
          </div>
        </div>

        <div className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div key={nav} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selected && <ReportModal report={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />}
      </AnimatePresence>
    </div>
  )
}
