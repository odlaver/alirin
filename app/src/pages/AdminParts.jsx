import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle, CheckCircle2, Clock, FileCheck2,
  MapPin, TrendingUp, TrendingDown, X,
} from 'lucide-react'
import RiskBreakdown from '../components/RiskBreakdown.jsx'
import { getCachedOfficers, loadOfficers } from '../services/officersService.js'
import { REPORT_STATUSES, STATUS_CLASS, STATUS_LABEL, canTransitionTo } from '../domain/status.js'
import {
  formatDateTime,
  formatRelativeTime,
  reportToAdminRow,
  reportToMarker,
  reportsToMarkers,
} from '../domain/reports.js'

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const RISK_COLORS = {
  Kritis: 'var(--color-danger)',
  Tinggi: 'var(--color-risk-high)',
  Waspada: 'var(--color-warning)',
  Normal: 'var(--color-success)',
}
const RiskMap = lazy(() => import('../components/RiskMap.jsx'))

function MapLoading({ label = 'Memuat peta...' }) {
  return (
    <div className="admin-map-loading" role="status" aria-live="polite">
      <span className="admin-map-loading-dot" />
      <span>{label}</span>
    </div>
  )
}

export function Counter({ to, duration = 1200 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [to, duration])
  return <>{val}</>
}


export function KpiCards({ reports = [], animated }) {
  const [now] = useState(() => Date.now())
  const criticalCount = reports.filter((report) => report.riskLevel === 'Kritis').length
  const handledCount = reports.filter((report) => report.status === 'ditangani').length
  const newThisWeek = reports.filter((report) => now - new Date(report.createdAt).getTime() <= 7 * 24 * 36e5).length
  const avgAgeHours = reports.length
    ? Math.round(reports.reduce((sum, report) => sum + Math.max(0, now - new Date(report.createdAt).getTime()) / 36e5, 0) / reports.length)
    : 0
  const cards = [
    { label:'Total Laporan', value:reports.length, unit:'', icon:FileCheck2, color:'blue', trend:'up', trendVal:`+${newThisWeek}`, sub:`${newThisWeek} laporan minggu ini` },
    { label:'Titik Kritis', value:criticalCount, unit:'', icon:AlertTriangle, color:'red', trend:'up', trendVal:`${criticalCount}`, sub:'Perlu segera ditangani' },
    { label:'Dalam Penanganan', value:handledCount, unit:'', icon:CheckCircle2, color:'green', trend:'up', trendVal:`${handledCount}`, sub:'Laporan aktif di lapangan' },
    { label:'Umur Avg', value:avgAgeHours, unit:' jam', icon:Clock, color:'orange', trend:'down', trendVal:`${avgAgeHours}j`, sub:'Rata-rata laporan aktif' },
  ]
  return (
    <div className="kpi-grid">
      {cards.map((c, i) => (
        <motion.div key={c.label} className={`kpi-card theme-${c.color}`}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:i*0.09, duration:0.5, ease:[0.22,1,0.36,1] }}>
          
          <div className="kpi-header">
            <span className={`kpi-icon ${c.color}`}><c.icon size={22} strokeWidth={2.5}/></span>
            <span className={`kpi-trend ${c.trend}`}>
              {c.trend === 'up' ? <TrendingUp size={14} strokeWidth={2.5}/> : <TrendingDown size={14} strokeWidth={2.5}/>}
              {c.trendVal}
            </span>
          </div>
          
          <div>
            <div className="kpi-value">
              {animated ? <Counter to={c.value}/> : c.value}
              {c.unit && <span style={{ fontSize: '18px', color: 'var(--color-text-secondary)', fontWeight: 600, marginLeft: 4 }}>{c.unit}</span>}
            </div>
            <div className="kpi-label">{c.label}</div>
          </div>
          
          <div className="kpi-sub">{c.sub}</div>
          
        </motion.div>
      ))}
    </div>
  )
}


export function ReportModal({ report, onClose, onStatusChange, onAssignOfficer }) {
  const [status, setStatus] = useState(report?.status ?? 'masuk')
  const [note, setNote] = useState('')
  const [officerId, setOfficerId] = useState(report?.assignedOfficerId ?? '')
  const [statusError, setStatusError] = useState('')
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isAssigningOfficer, setIsAssigningOfficer] = useState(false)
  const [officers, setOfficers] = useState(getCachedOfficers)

  useEffect(() => {
    let mounted = true
    loadOfficers().then((list) => { if (mounted) setOfficers(list) })
    return () => { mounted = false }
  }, [])

  if (!report) return null
  const row = reportToAdminRow(report)
  const marker = reportToMarker(report)

  async function handleSaveStatus() {
    try {
      setStatusError('')
      setIsSavingStatus(true)
      await onStatusChange(report.id, status, note)
      setNote('')
      toast.success('Status berhasil diperbarui!')
    } catch (err) {
      setStatusError(err.message || 'Transisi status tidak valid.')
      toast.error('Gagal memperbarui status.')
    } finally {
      setIsSavingStatus(false)
    }
  }

  async function handleAssignOfficer() {
    if (!officerId) return
    try {
      setStatusError('')
      setIsAssigningOfficer(true)
      await onAssignOfficer?.(report.id, officerId)
      toast.success('Petugas berhasil ditugaskan!')
    } catch (err) {
      setStatusError(err.message || 'Gagal menugaskan petugas.')
      toast.error('Gagal menugaskan petugas.')
    } finally {
      setIsAssigningOfficer(false)
    }
  }

  const canAssignOfficer = ['diverifikasi', 'dijadwalkan'].includes(report.status)
  
  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}>
      <motion.div className="modal-card premium-modal" onClick={e=>e.stopPropagation()}
        initial={{scale:0.92,y:20}} animate={{scale:1,y:0}} exit={{scale:0.92,y:20}}
        transition={{type:'spring',damping:24,stiffness:260}}>
        
        <div className="modal-cover">
          <button className="modal-close-float" aria-label="Tutup" onClick={onClose}><X size={20}/></button>
          <div className="cover-overlay">
            <span className="modal-badge">
              <span className={`report-severity-dot dot-${report.severity}`}/>
              {report.severity.toUpperCase()} â€¢ SKOR {report.riskScore}
            </span>
            <div className="cover-title">
              <span className="cover-id">{report.code}</span>
              <h2>{row.title}</h2>
            </div>
          </div>
        </div>

        <div className="modal-body-split">
          <div className="modal-info-col">
            <div className="info-block">
              <div className="info-icon"><MapPin size={20}/></div>
              <div className="info-content">
                <small>Lokasi Kejadian</small>
                <p>{row.loc}<br/><span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{report.address || '-'}</span></p>
              </div>
            </div>
            <div className="info-block">
              <div className="info-icon"><AlertTriangle size={20}/></div>
              <div className="info-content">
                <small>Deskripsi Kondisi</small>
                <p>{report.description}</p>
              </div>
            </div>
            <RiskBreakdown items={report.riskBreakdown} />
            <div className="info-grid-2">
              <div className="info-block">
                <div className="info-icon"><CheckCircle2 size={18}/></div>
                <div className="info-content">
                  <small>Pelapor</small>
                  <p>{row.pelapor}<br/><span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{row.kontak}</span></p>
                </div>
              </div>
              <div className="info-block">
                <div className="info-icon"><Clock size={18}/></div>
                <div className="info-content">
                  <small>Waktu Laporan</small>
                  <p>{formatDateTime(report.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="modal-photo-strip">
              {report.photos.map((photo, index) => (
                <img key={photo.id ?? photo.url} src={photo.url} alt={`Bukti laporan ${index + 1}`} />
              ))}
            </div>
          </div>
          
          <div className="modal-side-col">
            <div className="mini-map-preview">
              <Suspense fallback={<MapLoading label="Memuat lokasi..." />}>
                <RiskMap height={160} compact={true} markers={[marker]} selectedMarkerId={marker.id} showHead={false} previewMode={true} />
              </Suspense>
            </div>
            
            <div className="status-update-box">
              <label>Update Status Laporan</label>
              <select className="status-select-premium" value={status} onChange={(event) => { setStatus(event.target.value); setStatusError('') }}>
                {REPORT_STATUSES
                  .filter((s) => canTransitionTo(report.status, s) || s === report.status)
                  .filter((s) => s !== 'selesai' || report.status === 'selesai')
                  .map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)
                }
              </select>
              {report.status === 'ditangani' && (
                <p className="assignment-note">
                  Penutupan pekerjaan dilakukan petugas lapangan bersama foto bukti penyelesaian.
                </p>
              )}
              <textarea
                className="status-note-input"
                rows={3}
                placeholder="Catatan opsional untuk timeline warga"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <button className="btn-action primary" type="button" onClick={handleSaveStatus} disabled={isSavingStatus}>
                <TrendingUp size={16}/> {isSavingStatus ? 'Menyimpan...' : 'Simpan Status'}
              </button>
              {statusError && <p className="status-error-msg" role="alert">{statusError}</p>}
            </div>

            <div className="status-update-box">
              <label>Tugaskan Petugas</label>
              <select
                className="status-select-premium"
                value={officerId}
                onChange={(event) => setOfficerId(event.target.value)}
                disabled={!canAssignOfficer}
              >
                <option value="">Pilih petugas</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>{officer.name} - {officer.area}</option>
                ))}
              </select>
              {report.assignedOfficerName && (
                <p className="assignment-note">Ditugaskan ke {report.assignedOfficerName}</p>
              )}
              <button className="btn-action primary" type="button" onClick={handleAssignOfficer} disabled={!canAssignOfficer || !officerId || isAssigningOfficer}>
                <CheckCircle2 size={16}/> {isAssigningOfficer ? 'Menyimpan...' : 'Simpan Petugas'}
              </button>
            </div>

            <div className="status-history-box">
              <label>Timeline</label>
              {(report.statusHistory ?? []).slice().reverse().map((item, index) => (
                <div className="history-mini-item" key={`${item.status}-${item.at}-${index}`}>
                  <strong>{STATUS_LABEL[item.status]}</strong>
                  <small>{formatRelativeTime(item.at)} - {item.actor}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions-premium">
          <button className="btn-action ghost" onClick={onClose}>Tutup</button>
        </div>
      </motion.div>
    </motion.div>
  )
}


export function ReportList({ reports, filter, onSelect }) {
  const filtered = (filter==='semua' ? reports : reports.filter(r=>r.status===filter))
    .map(reportToAdminRow)
  return (
    <div className="report-list">
      <AnimatePresence mode="popLayout">
        {filtered.map((r,i)=>(
          <motion.button key={r.id} type="button" className="report-row" onClick={()=>onSelect(r)}
            initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:12}}
            transition={{delay:i*0.04,duration:0.3}}>
            <span className={`report-severity-dot dot-${r.severity}`}/>
            <div className="report-info">
              <strong>{r.title}</strong>
              <small><MapPin size={11} style={{display:'inline',verticalAlign:'middle'}}/> {r.loc} Â· {r.time}</small>
            </div>
            <span className={`report-score score-${r.severity}`}>{r.riskScore}</span>
            <span className={`report-status-tag ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
          </motion.button>
        ))}
      </AnimatePresence>
      {filtered.length===0 && (
        <div className="empty-state report-empty-state">
          <span className="empty-state-icon"><FileCheck2 size={30}/></span>
          <strong>Belum ada laporan</strong>
          <p>Tidak ada laporan yang cocok dengan filter ini.</p>
        </div>
      )}
    </div>
  )
}


export function TrendChart({ reports = [] }) {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - offset))
      const key = date.toISOString().slice(0, 10)
      return {
        day: DAYS[date.getDay()],
        val: reports.filter((report) => report.createdAt?.slice(0, 10) === key).length,
      }
    })
  }, [reports])
  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.val, 0), [chartData])
  const max = useMemo(() => Math.max(...chartData.map(d=>d.val), 1), [chartData])
  return (
    <div className="trend-chart">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:13,color:'var(--color-text-secondary)',fontWeight:600}}>Laporan 7 hari terakhir</span>
        <span style={{fontSize:12,color:'var(--color-secondary-dark)',fontWeight:700}}>{total} total</span>
      </div>
      <div className="trend-bars">
        {chartData.map((d,i)=>(
          <div key={d.day} className="trend-bar-wrap">
            <motion.div className="trend-bar" initial={{height:0}}
              animate={{height:`${(d.val/max)*100}%`}}
              transition={{delay:i*0.07+0.3,duration:0.7,ease:[0.22,1,0.36,1]}}
              title={`${d.day}: ${d.val}`}/>
            <span className="trend-bar-label">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


export function RiskDist({ reports = [] }) {
  const dist = useMemo(() => {
    return ['Kritis', 'Tinggi', 'Waspada', 'Normal'].map((label) => {
      const count = reports.filter((report) => report.riskLevel === label).length
      return {
        label,
        count,
        pct: reports.length ? Math.round((count / reports.length) * 100) : 0,
        color: RISK_COLORS[label],
      }
    })
  }, [reports])
  return (
    <div className="risk-dist-list">
      {dist.map((item,i)=>(
        <motion.div key={item.label} className="risk-dist-item"
          initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.08+0.4}}>
          <div className="risk-dist-info">
            <span className="risk-dist-label">{item.label}</span>
            <div className="risk-dist-stats">
              <span className="risk-dist-count">{item.count}</span>
              <span className="risk-dist-pct">({item.pct}%)</span>
            </div>
          </div>
          <div className="risk-dist-track">
            <motion.div className="risk-dist-fill" style={{background:item.color}}
              initial={{width:0}} animate={{width:`${item.pct}%`}}
              transition={{delay:i*0.1+0.5,duration:0.8,ease:[0.22,1,0.36,1]}}>
              <div className="risk-dist-glow" />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}


export function ActivityFeed({ reports = [] }) {
  const feed = useMemo(() => {
    return reports
      .flatMap((report) => (report.statusHistory ?? []).map((item) => ({
        text: `${report.code} - ${STATUS_LABEL[item.status]}`,
        time: formatRelativeTime(item.at),
        color: item.status === 'selesai'
          ? 'var(--color-success)'
          : item.status === 'masuk'
            ? 'var(--color-danger)'
            : 'var(--color-secondary)',
        at: item.at,
      })))
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5)
  }, [reports])
  return (
    <div className="activity-feed">
      {feed.map((item,i)=>(
        <motion.div key={`${item.text}-${item.time}`} className="activity-item"
          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.07+0.3}}>
          <div className="activity-dot-wrap">
            <span className="activity-dot" style={{background:item.color}}/>
            <span className="activity-line"/>
          </div>
          <div className="activity-text"><strong>{item.text}</strong><small>{item.time}</small></div>
        </motion.div>
      ))}
      {feed.length === 0 && <div className="empty-state"><FileCheck2 size={34}/><p>Belum ada aktivitas aktif.</p></div>}
    </div>
  )
}


export function MapPreview({ reports = [] }) {
  const markers = useMemo(() => reportsToMarkers(reports), [reports])
  return (
    <div className="admin-map-preview-wrapper" style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={<MapLoading />}>
        <RiskMap
          height="100%"
          showHead={false}
          markers={markers}
        />
      </Suspense>
    </div>
  )
}
