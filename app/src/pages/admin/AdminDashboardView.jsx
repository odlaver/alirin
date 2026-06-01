import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ListChecks, Map, TrendingUp } from 'lucide-react'
import { REPORT_STATUSES, STATUS_LABEL } from '../../domain/status.js'
import { sortReportsByPriority } from '../../domain/reports.js'
import {
  ActivityFeed,
  KpiCards,
  MapPreview,
  ReportList,
  RiskDist,
  TrendChart,
} from '../AdminParts.jsx'

export default function AdminDashboardView({ reports, animated, onSelect }) {
  const [filter, setFilter] = useState('semua')
  const [now] = useState(() => Date.now())
  const filters = ['semua', ...REPORT_STATUSES]
  const weeklyCount = reports.filter((report) => now - new Date(report.createdAt).getTime() <= 7 * 24 * 36e5).length
  const criticalCount = reports.filter((report) => report.riskLevel === 'Kritis').length
  const fieldCount = reports.filter((report) => ['dijadwalkan', 'ditangani'].includes(report.status)).length
  const assignedCount = reports.filter((report) => Boolean(report.assignedOfficerId)).length
  const criticalPct = reports.length ? Math.round((criticalCount / reports.length) * 100) : 0

  return (
    <div className="dashboard-view-stack">
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
        <div
          className="command-meter"
          style={{ '--critical-risk-width': `${criticalPct}%` }}
          aria-label={`Risiko kritis ${criticalPct} persen`}
        >
          <span />
        </div>
        <button type="button" className="command-chip" onClick={() => setFilter('dijadwalkan')}>
          <ListChecks size={16} />
          Cek jadwal
        </button>
      </motion.div>

      <div className="split-layout">
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="panel-head panel-head-stacked">
            <div>
              <h2>Laporan Terbaru</h2>
              <p>Diurutkan berdasarkan waktu & risiko</p>
            </div>
            <div className="filter-pills">
              {filters.map((item) => (
                <button key={item} className={`pill-btn ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>
                  {STATUS_LABEL[item] || 'Semua'}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body">
            <ReportList reports={sortReportsByPriority(reports)} filter={filter} onSelect={onSelect} />
          </div>
        </motion.div>

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
