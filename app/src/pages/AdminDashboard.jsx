import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Menu, RefreshCw, RotateCcw, Search } from 'lucide-react'
import { useSEO } from '../hooks/useSEO.js'
import './AdminDashboard.css'
import {
  assignReportOfficer,
  canResetDemoReports,
  createReportsCsv,
  getReports,
  isArchivedReport,
  resetDemoReports,
  subscribeReports,
  updateReportStatus,
} from '../services/reportsStore.js'
import { signOut } from '../services/authService.js'
import { ReportModal } from './AdminParts.jsx'
import AdminDashboardView from './admin/AdminDashboardView.jsx'
import { ArsipView, LaporanView, PetaView, PrioritasView } from './admin/AdminReportViews.jsx'
import AdminSidebar from './admin/AdminSidebar.jsx'
import { PAGE_TITLE } from './admin/adminNavigation.js'

export default function AdminDashboard() {
  useSEO({
    title: 'Dashboard Admin',
    description: 'Kelola laporan dan titik risiko genangan drainase Kota Bandar Lampung.',
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

  async function handleStatusChange(id, newStatus, note) {
    const updated = await updateReportStatus(id, newStatus, note)
    setReports(getReports())
    if (updated) setSelected(updated)
  }

  async function handleAssignOfficer(id, officerId) {
    const updated = await assignReportOfficer(id, officerId)
    setReports(getReports())
    if (updated) setSelected(updated)
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
    if (!canResetDemoReports()) return
    const ok = window.confirm('Reset semua laporan lokal dan isi ulang data demo ALIRIN? Laporan yang dibuat di browser ini akan tertimpa.')
    if (!ok) return
    const seeded = resetDemoReports()
    setReports(seeded)
    setSelected(null)
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const [title, subtitle] = PAGE_TITLE[nav] || ['Dashboard', '']
  const activeReports = reports.filter((report) => !isArchivedReport(report))
  const archivedReports = reports.filter(isArchivedReport)

  function renderView() {
    switch (nav) {
      case 'laporan':
        return <LaporanView reports={activeReports} onSelect={setSelected} search={quickSearch} onSearchChange={setQuickSearch} />
      case 'prioritas':
        return <PrioritasView reports={activeReports} onSelect={setSelected} search={quickSearch} />
      case 'peta':
        return <PetaView reports={activeReports} onSelect={setSelected} />
      case 'arsip':
        return <ArsipView reports={archivedReports} onSelect={setSelected} search={quickSearch} onSearchChange={setQuickSearch} />
      default:
        return <AdminDashboardView reports={activeReports} animated={animated} onSelect={setSelected} />
    }
  }

  return (
    <div className="admin-page">
      <AdminSidebar
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
                <button className="topbar-tool-btn topbar-icon-only" type="button" onClick={handleExportCsv} aria-label="Export CSV" title="Export CSV">
                  <Download size={16} />
                </button>
              </div>
              {canResetDemoReports() && (
                <button className="topbar-tool-btn subtle topbar-icon-only" type="button" onClick={handleResetDemo} aria-label="Reset demo" title="Reset demo">
                  <RotateCcw size={16} />
                </button>
              )}
              <button className="topbar-tool-btn topbar-icon-only topbar-refresh" type="button" onClick={handleRefresh} disabled={refreshing} aria-label="Perbarui data" title="Perbarui data">
                <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
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
        {selected && (
          <ReportModal
            key={selected.id}
            report={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onAssignOfficer={handleAssignOfficer}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
