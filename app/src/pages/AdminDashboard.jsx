import { useState, useEffect, useMemo } from 'react'
import { useSEO } from '../hooks/useSEO.js'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Droplets, FileCheck2, LayoutDashboard,
  Archive, Download, ListChecks, LogOut, Map, Menu, RefreshCw, RotateCcw, Search,
  TrendingUp
} from 'lucide-react'
import './AdminDashboard.css'
import { STATUS_LABEL, REPORT_STATUSES } from '../domain/status.js'
import { matchesReportSearch, sortReportsByPriority } from '../domain/reports.js'
import {
  getReports,
  createReportsCsv,
  assignReportOfficer,
  isArchivedReport,
  logoutDemoAdmin,
  resetDemoReports,
  subscribeReports,
  updateReportStatus,
} from '../services/reportsStore.js'
import {
  KpiCards, ReportModal, ReportList, TrendChart,
  RiskDist, ActivityFeed, MapPreview,
} from './AdminParts.jsx'

const NAV_MAIN = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'laporan', label: 'Laporan Masuk', icon: FileCheck2, badge: 6 },
  { id: 'prioritas', label: 'Daftar Prioritas', icon: ListChecks },
  { id: 'peta', label: 'Peta Risiko', icon: Map },
  { id: 'arsip', label: 'Arsip', icon: Archive },
]

const NAV_EXTRA = []

const PAGE_TITLE = {
  dashboard: ['Dashboard', 'Ringkasan semua data laporan'],
  laporan: ['Laporan Masuk', 'Kelola semua laporan warga'],
  prioritas: ['Daftar Prioritas', 'Laporan diurutkan berdasarkan skor risiko'],
  peta: ['Peta Risiko', 'Visualisasi titik rawan drainase'],
  arsip: ['Arsip', 'Laporan selesai dan ditolak'],
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
function Sidebar({ nav, setNav, mobileOpen, setMobileOpen, pendingCount, onLogout }) {
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
              {(id === 'laporan' ? pendingCount : badge) > 0 && (
                <span className="admin-nav-badge">{id === 'laporan' ? pendingCount : badge}</span>
              )}
            </button>
          ))}
          {NAV_EXTRA.length > 0 && (
            <>
              <span className="admin-nav-section" style={{ marginTop: 8 }}>Lainnya</span>
              {NAV_EXTRA.map(({ id, label, icon: I }) => (
                <button key={id} className={`admin-nav-item ${nav === id ? 'active' : ''}`}
                  onClick={() => { setNav(id); setMobileOpen(false) }}>
                  <I size={18} />{label}
                </button>
              ))}
            </>
          )}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-user-pill admin-user-button" type="button" onClick={onLogout}>
            <div className="admin-avatar">A</div>
            <div className="admin-user-info"><strong>Demo Admin</strong><small>admin@alirin.local</small></div>
            <LogOut size={16} className="logout-icon" />
          </button>
        </div>
      </aside>
    </>
  )
}

/* ── Dashboard View (home) ─────────────────────────────────────────────── */
function DashboardView({ reports, animated, onSelect }) {
  const [filter, setFilter] = useState('semua')
  const [now] = useState(() => Date.now())
  const FILTERS = ['semua', ...REPORT_STATUSES]
  const weeklyCount = reports.filter((report) => now - new Date(report.createdAt).getTime() <= 7 * 24 * 36e5).length
  const criticalCount = reports.filter((report) => report.riskLevel === 'Kritis').length
  const fieldCount = reports.filter((report) => ['dijadwalkan', 'ditangani'].includes(report.status)).length
  const assignedCount = reports.filter((report) => Boolean(report.assignedOfficerId)).length
  const criticalPct = reports.length ? Math.round((criticalCount / reports.length) * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Baris 1: KPI Cards */}
      <KpiCards reports={reports} animated={animated} />

      <motion.div
        className="admin-command-strip"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="command-strip-copy">
          <span>Pantauan aktif</span>
          <strong>{criticalCount} titik kritis dari {reports.length} laporan</strong>
          <p>{fieldCount} laporan sudah masuk jadwal/penanganan, {assignedCount} sudah memiliki petugas.</p>
        </div>
        <div className="command-meter" aria-label={`Risiko kritis ${criticalPct} persen`}>
          <span style={{ width: `${criticalPct}%` }} />
        </div>
        <button type="button" className="command-chip" onClick={() => setFilter('dijadwalkan')}>
          <ListChecks size={16} />
          Cek jadwal
        </button>
      </motion.div>

      {/* Baris 2: Split Layout (Mirip Referensi Gambar: Listing & Map) */}
      <div className="split-layout">

        {/* Kolom Kiri: Listing Laporan */}
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="panel-head panel-head-stacked">
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
            <ReportList reports={sortReportsByPriority(reports)} filter={filter} onSelect={onSelect} />
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
            <MapPreview reports={reports} />
          </div>
        </motion.div>
      </div>

      {/* Baris 3: Analytics & Activity (Konsep Asli ALIRIN) */}
      <div className="bottom-grid">
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="panel-head">
            <div><h2>Tren Laporan</h2><p>7 hari terakhir</p></div>
            <span className="panel-badge info"><TrendingUp size={12} /> {weeklyCount} aktif</span>
          </div>
          <TrendChart reports={reports} />
        </motion.div>

        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="panel-head">
            <div><h2>Distribusi Risiko</h2><p>Berdasarkan skor ancaman</p></div>
          </div>
          <RiskDist reports={reports} />
        </motion.div>

        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <div className="panel-head">
            <div><h2>Aktivitas Terkini</h2><p>Update real-time</p></div>
          </div>
          <ActivityFeed reports={reports} />
        </motion.div>
      </div>
    </div>
  )
}

/* ── Laporan View ──────────────────────────────────────────────────────── */
function LaporanView({ reports, onSelect, search, onSearchChange, title = 'Semua Laporan', emptyLabel = 'laporan aktif' }) {
  const [filter, setFilter] = useState('semua')
  const FILTERS = ['semua', ...REPORT_STATUSES]
  const filtered = reports.filter(r => {
    if (filter !== 'semua' && r.status !== filter) return false
    if (!matchesReportSearch(r, search)) return false
    return true
  })
  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div><h2>{title}</h2><p>{reports.length} {emptyLabel} terdaftar</p></div>
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Cari laporan..." value={search} onChange={e => onSearchChange(e.target.value)} />
        </div>
      </div>
      <div className="filter-pills report-filter-strip">
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

function ArsipView({ reports, onSelect, search, onSearchChange }) {
  return (
    <LaporanView
      reports={reports}
      onSelect={onSelect}
      search={search}
      onSearchChange={onSearchChange}
      title="Arsip Laporan"
      emptyLabel="laporan arsip"
    />
  )
}

/* ── Prioritas View ────────────────────────────────────────────────────── */
function PrioritasView({ reports, onSelect, search }) {
  const sorted = sortReportsByPriority(reports.filter((report) => matchesReportSearch(report, search)))
  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head"><div><h2>Daftar Prioritas</h2><p>Diurutkan berdasarkan tingkat risiko bahaya</p></div></div>
      <div className="panel-body"><ReportList reports={sorted} filter="semua" onSelect={onSelect} /></div>
    </motion.div>
  )
}

/* ── Peta View ─────────────────────────────────────────────────────────── */
function PetaView({ reports, onSelect }) {
  const topReports = sortReportsByPriority(reports).slice(0, 5)
  const criticalCount = reports.filter((report) => report.riskLevel === 'Kritis').length
  const highCount = reports.filter((report) => report.riskLevel === 'Tinggi').length
  return (
    <div className="admin-map-layout">
      <motion.div className="admin-panel map-focus-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="panel-head">
          <div><h2>Peta Risiko Wilayah Lengkap</h2><p>{reports.length} titik aktif dipantau dari dashboard</p></div>
        </div>
        <div className="panel-body map-focus-body">
          <div className="admin-map-panel">
            <MapPreview reports={reports} />
          </div>
        </div>
      </motion.div>

      <motion.aside className="admin-panel map-side-panel" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
        <div className="panel-head">
          <div><h2>Ringkasan Peta</h2><p>Prioritas yang perlu dipantau</p></div>
        </div>
        <div className="map-side-stats">
          <div><strong>{criticalCount}</strong><span>Kritis</span></div>
          <div><strong>{highCount}</strong><span>Tinggi</span></div>
          <div><strong>{reports.length}</strong><span>Aktif</span></div>
        </div>
        <div className="map-side-list">
          {topReports.map((report) => (
            <button key={report.id} type="button" className="map-side-item" onClick={() => onSelect(report)}>
              <span className={`report-score score-${report.severity}`}>{report.riskScore}</span>
              <div>
                <strong>{report.code}</strong>
                <small>{report.kecamatan || report.address || 'Lokasi belum lengkap'}</small>
              </div>
              <em>{report.riskLevel}</em>
            </button>
          ))}
        </div>
      </motion.aside>
    </div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  useSEO({
    title: 'Dashboard Admin',
    description: 'Kelola laporan dan titik risiko genangan drainase Kota Bandar Lampung.'
  })
  const navigate = useNavigate()
  const [nav, setNav] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [reports, setReports] = useState(() => getReports())
  const [selected, setSelected] = useState(null)
  const [quickSearch, setQuickSearch] = useState('')
  const [exportMode, setExportMode] = useState('semua')

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 100)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => subscribeReports(setReports), [])

  function handleRefresh() {
    setRefreshing(true)
    setReports(getReports())
    setTimeout(() => setRefreshing(false), 400)
  }

  function handleStatusChange(id, newStatus, note) {
    try {
      const updated = updateReportStatus(id, newStatus, note)
      setReports(getReports())
      if (updated) setSelected(updated)
    } catch (err) {
      throw err // Re-throw so ReportModal can catch and display inline
    }
  }

  function handleAssignOfficer(id, officerId) {
    try {
      const updated = assignReportOfficer(id, officerId)
      setReports(getReports())
      if (updated) setSelected(updated)
    } catch (err) {
      throw err // Re-throw so ReportModal can catch and display inline
    }
  }

  function handleExportCsv() {
    const exportReports = reports.filter((report) => {
      if (exportMode === 'aktif') return !isArchivedReport(report)
      if (exportMode === 'arsip') return isArchivedReport(report)
      return true
    })
    const csv = createReportsCsv(exportReports)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alirin-laporan-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function handleResetDemo() {
    const ok = window.confirm('Reset semua laporan lokal dan isi ulang data demo ALIRIN? Laporan yang dibuat di browser ini akan tertimpa.')
    if (!ok) return
    const seeded = resetDemoReports()
    setReports(seeded)
    setSelected(null)
  }

  function handleLogout() {
    logoutDemoAdmin()
    navigate('/admin/login', { replace: true })
  }

  const [title, subtitle] = PAGE_TITLE[nav] || ['Dashboard', '']
  const activeReports = reports.filter((report) => !isArchivedReport(report))
  const archivedReports = reports.filter(isArchivedReport)

  function renderView() {
    switch (nav) {
      case 'laporan': return <LaporanView reports={activeReports} onSelect={setSelected} search={quickSearch} onSearchChange={setQuickSearch} />
      case 'prioritas': return <PrioritasView reports={activeReports} onSelect={setSelected} search={quickSearch} />
      case 'peta': return <PetaView reports={activeReports} onSelect={setSelected} />
      case 'arsip': return <ArsipView reports={archivedReports} onSelect={setSelected} search={quickSearch} onSearchChange={setQuickSearch} />
      default: return <DashboardView reports={activeReports} animated={animated} onSelect={setSelected} />
    }
  }

  return (
    <div className="admin-page">
      <Sidebar
        nav={nav}
        setNav={setNav}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        pendingCount={activeReports.filter((report) => report.status === 'masuk').length}
        onLogout={handleLogout}
      />

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
              <input
                type="text"
                placeholder="Cari laporan..."
                value={quickSearch}
                onChange={(event) => {
                  setQuickSearch(event.target.value)
                  if (event.target.value.trim()) setNav('laporan')
                }}
              />
            </div>
            <div className="topbar-tools">
              <div className="admin-export-control">
                <select
                  className="export-mode-select"
                  value={exportMode}
                  onChange={(event) => setExportMode(event.target.value)}
                  aria-label="Mode export CSV"
                >
                  <option value="semua">Semua</option>
                  <option value="aktif">Aktif</option>
                  <option value="arsip">Arsip</option>
                </select>
                <button className="topbar-tool-btn" type="button" onClick={handleExportCsv}>
                  <Download size={16} />
                  <span>Export</span>
                </button>
              </div>
              <button className="topbar-tool-btn subtle topbar-icon-only" type="button" onClick={handleResetDemo} aria-label="Reset demo" title="Reset demo">
                <RotateCcw size={16} />
              </button>
              <button className="icon-btn" type="button" aria-label="Notifikasi demo"><Bell size={18} /><span className="notif-dot"></span></button>
              <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Memuat...' : 'Perbarui'}</span>
              </button>
            </div>
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
        {selected && <ReportModal key={selected.id} report={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} onAssignOfficer={handleAssignOfficer} />}
      </AnimatePresence>
    </div>
  )
}
