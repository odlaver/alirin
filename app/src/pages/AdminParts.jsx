import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle2, Clock, FileCheck2,
  MapPin, TrendingUp, TrendingDown, X,
} from 'lucide-react'
import {
  TREND_DATA, RISK_DIST, ACTIVITY,
  STATUS_LABEL, STATUS_CLASS, STATUS_OPTIONS,
  MONTHLY_DATA, DONUT_DATA, PETUGAS, SETTINGS_ITEMS,
} from './adminData.js'
import RiskMap from '../components/RiskMap.jsx'

/* ── Animated Counter ──────────────────────────────────────────────────── */
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

/* ── KPI Cards ─────────────────────────────────────────────────────────── */
export function KpiCards({ animated }) {
  const cards = [
    { label:'Total Laporan', value:128, unit:'', icon:FileCheck2, color:'blue', trend:'up', trendVal:'+12%', sub:'18 laporan minggu ini' },
    { label:'Titik Kritis', value:8, unit:'', icon:AlertTriangle, color:'red', trend:'up', trendVal:'+3', sub:'Perlu segera ditangani' },
    { label:'Selesai Ditangani', value:87, unit:'%', icon:CheckCircle2, color:'green', trend:'up', trendVal:'+5%', sub:'Dari total laporan' },
    { label:'Respons Avg', value:4, unit:' jam', icon:Clock, color:'orange', trend:'down', trendVal:'-1.2j', sub:'Lebih cepat dari target' },
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

/* ── Report Detail Modal ───────────────────────────────────────────────── */
export function ReportModal({ report, onClose, onStatusChange }) {
  const [status, setStatus] = useState(report?.status ?? 'masuk')
  if (!report) return null
  function handleChange(e) {
    setStatus(e.target.value)
    onStatusChange(report.id, e.target.value)
  }
  
  const locLower = report.loc.toLowerCase()
  let markerId = 'kedaton'
  if (locLower.includes('tanjung karang')) markerId = 'tanjungkarang'
  else if (locLower.includes('teluk')) markerId = 'telukbetung'
  else if (locLower.includes('sukarame') || locLower.includes('way dadi')) markerId = 'sukarame'
  
  return (
    <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}>
      <motion.div className="modal-card premium-modal" onClick={e=>e.stopPropagation()}
        initial={{scale:0.92,y:20}} animate={{scale:1,y:0}} exit={{scale:0.92,y:20}}
        transition={{type:'spring',damping:24,stiffness:260}}>
        
        <div className="modal-cover">
          <button className="modal-close-float" onClick={onClose}><X size={20}/></button>
          <div className="cover-overlay">
            <span className="modal-badge">
              <span className={`report-severity-dot dot-${report.severity}`}/>
              {report.severity.toUpperCase()} • SKOR {report.score}
            </span>
            <div className="cover-title">
              <span className="cover-id">{report.id}</span>
              <h2>{report.title}</h2>
            </div>
          </div>
        </div>

        <div className="modal-body-split">
          <div className="modal-info-col">
            <div className="info-block">
              <div className="info-icon"><MapPin size={20}/></div>
              <div className="info-content">
                <small>Lokasi Kejadian</small>
                <p>{report.loc}</p>
              </div>
            </div>
            <div className="info-block">
              <div className="info-icon"><AlertTriangle size={20}/></div>
              <div className="info-content">
                <small>Deskripsi Kondisi</small>
                <p>{report.desc}</p>
              </div>
            </div>
            <div className="info-grid-2">
              <div className="info-block">
                <div className="info-icon"><CheckCircle2 size={18}/></div>
                <div className="info-content">
                  <small>Pelapor</small>
                  <p>{report.pelapor}<br/><span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{report.kontak}</span></p>
                </div>
              </div>
              <div className="info-block">
                <div className="info-icon"><Clock size={18}/></div>
                <div className="info-content">
                  <small>Waktu Laporan</small>
                  <p>{report.time}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-side-col">
            <div className="mini-map-preview">
               <RiskMap height={160} compact={true} selectedMarkerId={markerId} showHead={false} previewMode={true} />
            </div>
            
            <div className="status-update-box">
              <label>Update Status Laporan</label>
              <select className="status-select-premium" value={status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-actions-premium">
          <button className="btn-action ghost" onClick={onClose}>Tutup</button>
          <button className="btn-action primary"><TrendingUp size={16}/> Tugaskan Tim Lapangan</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Report List ───────────────────────────────────────────────────────── */
export function ReportList({ reports, filter, onSelect }) {
  const filtered = filter==='semua' ? reports : reports.filter(r=>r.status===filter)
  return (
    <div className="report-list">
      <AnimatePresence mode="popLayout">
        {filtered.map((r,i)=>(
          <motion.div key={r.id} className="report-row" onClick={()=>onSelect(r)}
            initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:12}}
            transition={{delay:i*0.04,duration:0.3}}>
            <span className={`report-severity-dot dot-${r.severity}`}/>
            <div className="report-info">
              <strong>{r.title}</strong>
              <small><MapPin size={11} style={{display:'inline',verticalAlign:'middle'}}/> {r.loc} · {r.time}</small>
            </div>
            <span className={`report-score score-${r.severity}`}>{r.score}</span>
            <span className={`report-status-tag ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {filtered.length===0 && <div className="empty-state"><FileCheck2 size={40}/><p>Tidak ada laporan dengan filter ini.</p></div>}
    </div>
  )
}

/* ── Trend Chart ───────────────────────────────────────────────────────── */
export function TrendChart() {
  const max = Math.max(...TREND_DATA.map(d=>d.val))
  return (
    <div className="trend-chart">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:13,color:'var(--color-text-secondary)',fontWeight:600}}>Laporan 7 hari terakhir</span>
        <span style={{fontSize:12,color:'var(--color-secondary-dark)',fontWeight:700}}>133 total</span>
      </div>
      <div className="trend-bars">
        {TREND_DATA.map((d,i)=>(
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

/* ── Risk Distribution ─────────────────────────────────────────────────── */
export function RiskDist() {
  return (
    <div className="risk-dist-list">
      {RISK_DIST.map((item,i)=>(
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

/* ── Activity Feed ─────────────────────────────────────────────────────── */
export function ActivityFeed() {
  return (
    <div className="activity-feed">
      {ACTIVITY.map((item,i)=>(
        <motion.div key={`${item.text}-${item.time}`} className="activity-item"
          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.07+0.3}}>
          <div className="activity-dot-wrap">
            <span className="activity-dot" style={{background:item.color}}/>
            <span className="activity-line"/>
          </div>
          <div className="activity-text"><strong>{item.text}</strong><small>{item.time}</small></div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Map Preview ───────────────────────────────────────────────────────── */
export function MapPreview() {
  return (
    <div className="admin-map-preview-wrapper" style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .admin-map-preview-wrapper .osm-map-card { height: 100%; display: flex; flex-direction: column; border: 1px solid var(--color-border) !important; border-radius: var(--radius-md) !important; box-shadow: none !important; overflow: hidden; }
        .admin-map-preview-wrapper .osm-map-card .real-map-viewport { flex: 1; height: auto !important; min-height: 300px; }
      `}</style>
      <RiskMap 
        height="100%" 
        showHead={false} 
      />
    </div>
  )
}

/* ── Statistik View ────────────────────────────────────────────────────── */
export function StatistikView() {
  const max = Math.max(...MONTHLY_DATA.map(d=>d.val)) || 100
  const total = DONUT_DATA.reduce((a,b)=>a+b.val,0) || 1

  const donutSegments = useMemo(() => {
    return DONUT_DATA.reduce((segments, d) => {
      const prevOffset = segments.length > 0 ? segments[segments.length - 1]._nextOffset : 0
      const pct = d.val / total * 100
      const dash = pct * 0.94
      segments.push({ ...d, pct, dash, offset: prevOffset * 0.94, _nextOffset: prevOffset + pct })
      return segments
    }, [])
  }, [total])

  const trendMax = Math.max(...TREND_DATA.map(d=>d.val)) || 100
  const trendW = 100 / (TREND_DATA.length - 1)
  const areaPath = TREND_DATA.map((d,i) => {
    const x = i * trendW
    const y = 100 - (d.val / trendMax) * 80
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
  const areaFill = `${areaPath} L100,100 L0,100 Z`

  const summaryCards = [
    { label: 'Total bulan ini', value: '128', sub: '+22% vs lalu', accent: 'var(--color-secondary)' },
    { label: 'Rata-rata harian', value: '4.1', sub: 'laporan/hari', accent: 'var(--color-primary)' },
    { label: 'Waktu respons', value: '3.2j', sub: '-18% vs target', accent: 'var(--color-success)' },
    { label: 'Tingkat selesai', value: '87%', sub: 'kinerja stabil', accent: 'var(--color-warning)' },
  ]

  return (
    <div className="statistik-layout">
      <div className="stat-summary-row">
        {summaryCards.map((c, i) => (
          <motion.div key={c.label} className="stat-summary-card"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}>
            <div className="stat-summary-accent" style={{ background: c.accent }} />
            <div className="stat-summary-content">
              <span className="stat-summary-value">{c.value}</span>
              <div className="stat-summary-info">
                <span className="stat-summary-label">{c.label}</span>
                <span className="stat-summary-sub">{c.sub}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="panel-head">
          <div><h2>Laporan per Bulan</h2><p>Tahun 2026</p></div>
          <span className="panel-badge info">Total: {MONTHLY_DATA.reduce((a, b) => a + b.val, 0)} Laporan</span>
        </div>
        <div className="stat-chart-area">
          <div className="stat-gridlines">
            {[100, 75, 50, 25, 0].map(pct => (
              <div key={pct} className="stat-gridline">
                <span>{Math.round(max * pct / 100)}</span>
                <div className="stat-gridline-rule" />
              </div>
            ))}
          </div>
          <div className="stat-big-chart">
            {MONTHLY_DATA.map((d, i) => (
              <div key={d.mon} className="stat-bar-col">
                <motion.div className="stat-bar"
                  initial={{ height: 0 }} animate={{ height: `${(d.val / max) * 100}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' }}>
                  <span className="stat-bar-val">{d.val}</span>
                  <div className="stat-bar-glow" />
                </motion.div>
                <span className="stat-bar-lbl">{d.mon}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="stat-two-col">
        <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="panel-head"><div><h2>Tren Mingguan</h2><p>7 hari terakhir</p></div></div>
          <div className="trend-chart-wrap">
            <div className="trend-svg-container">
              {/* Path uses viewBox to scale */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="trend-area-svg">
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-surface)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaFill} fill="url(#trendGrad)" />
                <path d={areaPath} fill="none" stroke="var(--color-secondary)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
              {/* Interactive HTML overlay */}
              {TREND_DATA.map((d, i) => {
                const leftPct = i * trendW
                const topPct = 100 - (d.val / trendMax) * 80
                return (
                  <div key={d.day} className="trend-interact-col" style={{ left: `${leftPct}%` }}>
                    <div className="trend-col-hover-line" />
                    <div className="trend-node" style={{ top: `${topPct}%` }}>
                      <div className="trend-node-label">{d.val} <span>laporan</span></div>
                      <div className="trend-node-dot" />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="trend-labels">
              {TREND_DATA.map(d => <span key={d.day}>{d.day}</span>)}
            </div>
          </div>
        </motion.div>

        <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="panel-head"><div><h2>Kategori Laporan</h2><p>Distribusi masalah</p></div></div>
          <div className="donut-wrap">
            <div className="donut-ring-container">
              <svg className="donut-svg" viewBox="0 0 42 42">
                {donutSegments.map(seg => (
                  <circle key={seg.label} cx="21" cy="21" r="15" fill="none" stroke={seg.color} strokeWidth="4"
                    strokeDasharray={`${seg.dash} ${94 - seg.dash}`} strokeDashoffset={-seg.offset}
                    transform="rotate(-90 21 21)" strokeLinecap="round" />
                ))}
              </svg>
              <div className="donut-center-label">
                <strong>{total}</strong>
                <small>Laporan</small>
              </div>
            </div>
            <div className="donut-legend">
              {DONUT_DATA.map(d => (
                <div key={d.label} className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: d.color }} />
                  <span className="donut-legend-text">{d.label}</span>
                  <span className="donut-legend-pct">{Math.round((d.val / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div className="admin-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="panel-head"><div><h2>Distribusi Risiko</h2><p>128 laporan total</p></div></div>
        <RiskDist />
      </motion.div>
    </div>
  )
}

/* ── Petugas View ──────────────────────────────────────────────────────── */
export function PetugasView() {
  return (
    <motion.div className="admin-panel" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="panel-head"><div><h2>Daftar Petugas</h2><p>{PETUGAS.length} petugas terdaftar</p></div>
        <span className="panel-badge info">{PETUGAS.filter(p=>p.status==='online').length} online</span>
      </div>
      <div className="petugas-grid">
        {PETUGAS.map((p,i)=>(
          <motion.div key={p.name} className="petugas-row"
            initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}}>
            <div className="petugas-avatar" style={{background:p.color}}>{p.name.charAt(0)}</div>
            <div className="petugas-info"><strong>{p.name}</strong><small>{p.role} · {p.area}</small></div>
            <div className="petugas-stat"><strong>{p.done}/{p.tasks}</strong><small>tugas selesai</small></div>
            <span className={`petugas-status petugas-${p.status}`}>{p.status==='online'?'Online':'Offline'}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Pengaturan View ───────────────────────────────────────────────────── */
export function PengaturanView() {
  const [toggles, setToggles] = useState(Object.fromEntries(SETTINGS_ITEMS.map(s=>[s.id,s.default])))
  const toggle = id => setToggles(prev=>({...prev,[id]:!prev[id]}))
  return (
    <motion.div className="admin-panel" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="panel-head"><div><h2>Pengaturan</h2><p>Konfigurasi dashboard</p></div></div>
      <div className="settings-group">
        {SETTINGS_ITEMS.map((s,i)=>(
          <motion.div key={s.id} className="setting-row"
            initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}>
            <div className="setting-text"><strong>{s.label}</strong><small>{s.desc}</small></div>
            <button className={`toggle-switch ${toggles[s.id]?'on':'off'}`} onClick={()=>toggle(s.id)}/>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
