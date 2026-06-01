import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { REPORT_STATUSES, STATUS_LABEL } from '../../domain/status.js'
import { matchesReportSearch, sortReportsByPriority } from '../../domain/reports.js'
import { MapPreview, ReportList } from '../AdminParts.jsx'

export function LaporanView({ reports, onSelect, search, onSearchChange, title = 'Semua Laporan', emptyLabel = 'laporan aktif' }) {
  const [filter, setFilter] = useState('semua')
  const filters = ['semua', ...REPORT_STATUSES]
  const filtered = reports.filter((report) => {
    if (filter !== 'semua' && report.status !== filter) return false
    if (!matchesReportSearch(report, search)) return false
    return true
  })

  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head panel-head-wrap">
        <div><h2>{title}</h2><p>{reports.length} {emptyLabel} terdaftar</p></div>
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Cari laporan..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </div>
      </div>
      <div className="filter-pills report-filter-strip">
        {filters.map((item) => (
          <button key={item} className={`pill-btn ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>
            {STATUS_LABEL[item] || 'Semua'}
          </button>
        ))}
      </div>
      <div className="panel-body"><ReportList reports={filtered} filter="semua" onSelect={onSelect} /></div>
    </motion.div>
  )
}

export function ArsipView({ reports, onSelect, search, onSearchChange }) {
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

export function PrioritasView({ reports, onSelect, search }) {
  const sorted = sortReportsByPriority(reports.filter((report) => matchesReportSearch(report, search)))
  return (
    <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-head"><div><h2>Daftar Prioritas</h2><p>Diurutkan berdasarkan tingkat risiko bahaya</p></div></div>
      <div className="panel-body"><ReportList reports={sorted} filter="semua" onSelect={onSelect} /></div>
    </motion.div>
  )
}

export function PetaView({ reports, onSelect }) {
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
