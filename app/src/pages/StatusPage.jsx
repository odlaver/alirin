import { useEffect, useMemo, useState } from 'react'
import { useSEO } from '../hooks/useSEO.js'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  Droplets,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import './StatusPage.css'
import { getReportByTrackingToken, subscribeReports } from '../services/reportsStore.js'
import {
  CATEGORY_LABEL,
  SEVERITY_LABEL,
  formatApproxReportCoordinates,
  formatDateTime,
  formatReportLocation,
} from '../domain/reports.js'
import { getRiskLevelClass } from '../domain/scoring.js'
import { STATUS_CLASS, STATUS_LABEL } from '../domain/status.js'

const TRACK_STEPS = [
  { id: 'masuk', label: 'Masuk', icon: Clock3 },
  { id: 'diverifikasi', label: 'Verifikasi', icon: ShieldCheck },
  { id: 'dijadwalkan', label: 'Jadwal', icon: MapPin },
  { id: 'ditangani', label: 'Ditangani', icon: Droplets },
  { id: 'selesai', label: 'Selesai', icon: CheckCircle2 },
]

function maskStatusToken(token) {
  const value = String(token || '').trim()
  if (!value) return 'tidak ada token'
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

function StatusBackdrop() {
  return (
    <>
      <div className="status-bg-grid" aria-hidden="true" />
      <div className="status-bg-wave wave-one" aria-hidden="true" />
      <div className="status-bg-wave wave-two" aria-hidden="true" />
      <div className="status-flow-line flow-one" aria-hidden="true" />
      <div className="status-flow-line flow-two" aria-hidden="true" />
    </>
  )
}

function NotFoundStatus({ token }) {
  return (
    <div className="status-page">
      <StatusBackdrop />
      <header className="status-topbar">
        <Link to="/" className="status-back"><ArrowLeft size={18} /> Beranda</Link>
        <div className="status-brand">
          <span className="status-brand-mark"><Droplets size={18} /></span>
          ALIRIN
        </div>
      </header>
      <main className="status-empty">
        <div className="status-empty-card">
          <span className="status-empty-icon"><AlertTriangle size={42} /></span>
          <span className="status-kicker">Status laporan</span>
          <h1>Link status tidak ditemukan</h1>
          <p>Token ini belum cocok dengan laporan yang tersimpan atau tersinkron di aplikasi.</p>
          <div className="status-empty-help">
            <span>Token dicek: <code>{maskStatusToken(token)}</code></span>
            <ul>
              <li>Pastikan link dibuka dari tombol status pada halaman sukses.</li>
              <li>Jika link disalin manual, cek lagi apakah ada karakter yang terpotong.</li>
              <li>Jika laporan dibuat di perangkat lain, tunggu sinkronisasi lalu muat ulang halaman.</li>
            </ul>
          </div>
          <div className="status-empty-actions">
            <Link to="/lapor" className="btn btn-primary">Buat laporan baru</Link>
            <Link to="/" className="btn btn-outline">Kembali ke beranda</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function StatusPage() {
  useSEO({
    title: 'Cek Status Laporan',
    description: 'Lacak perkembangan laporan drainase melalui link status pribadi.'
  })
  const { token } = useParams()
  const [, setStoreVersion] = useState(0)

  useEffect(() => {
    return subscribeReports(() => setStoreVersion((version) => version + 1))
  }, [])

  const report = getReportByTrackingToken(token)

  const sortedHistory = useMemo(() => {
    return [...(report?.statusHistory ?? [])].sort((a, b) => new Date(a.at) - new Date(b.at))
  }, [report])

  if (!report) return <NotFoundStatus token={token} />

  const riskClass = getRiskLevelClass(report.riskLevel)
  const latestStatus = STATUS_LABEL[report.status] ?? 'Masuk'
  const latestHistory = sortedHistory[sortedHistory.length - 1]
  const reportPhotos = report.photos ?? []
  const completionPhotos = report.completionPhotos ?? []
  const completedStatus = report.status === 'ditolak'
    ? [...sortedHistory].reverse().find((item) => item.status !== 'ditolak')?.status ?? 'masuk'
    : report.status
  const activeStepIndex = Math.max(0, TRACK_STEPS.findIndex((item) => item.id === completedStatus))
  const statusProgress = report.status === 'ditolak'
    ? 100
    : Math.round((activeStepIndex / (TRACK_STEPS.length - 1)) * 100)
  const totalPhotos = reportPhotos.length + completionPhotos.length

  return (
    <div className="status-page">
      <StatusBackdrop />
      <header className="status-topbar">
        <Link to="/" className="status-back"><ArrowLeft size={18} /> Beranda</Link>
        <div className="status-brand">
          <span className="status-brand-mark"><Droplets size={18} /></span>
          ALIRIN
        </div>
        <Link to="/lapor" className="status-new-link">Laporan baru</Link>
      </header>

      <main className="status-main">
        <section className="status-hero">
          <div className="status-hero-copy">
            <span className="status-kicker">Status laporan</span>
            <h1>{report.code}</h1>
            <p>{CATEGORY_LABEL[report.category]} di {formatReportLocation(report)}</p>
            <div className="status-hero-meta">
              <span><Clock3 size={15} /> Update {formatDateTime(report.updatedAt)}</span>
              <span><Camera size={15} /> {totalPhotos} foto</span>
            </div>
          </div>
          <div className="status-hero-card">
            <span className="status-card-label">Status saat ini</span>
            <div className={`status-current ${STATUS_CLASS[report.status]}`}>
              <ShieldCheck size={18} />
              {latestStatus}
            </div>
            <p>{latestHistory?.note || 'Laporan sedang dipantau sistem.'}</p>
          </div>
        </section>

        <section className={`status-tracker ${report.status === 'ditolak' ? 'is-rejected' : ''}`} style={{ '--status-progress': `${statusProgress}%` }}>
          <div className="status-tracker-line" aria-hidden="true" />
          {TRACK_STEPS.map((item, index) => {
            const Icon = item.icon
            const isComplete = report.status === 'ditolak' ? index <= activeStepIndex : index < activeStepIndex
            const isCurrent = report.status !== 'ditolak' && index === activeStepIndex
            return (
              <div
                className={`tracker-step ${isComplete ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''}`}
                key={item.id}
              >
                <span className="tracker-step-icon"><Icon size={17} /></span>
                <span>{item.label}</span>
              </div>
            )
          })}
          {report.status === 'ditolak' && (
            <div className="tracker-rejected">
              <AlertTriangle size={16} />
              Ditolak
            </div>
          )}
        </section>

        <section className="status-grid">
          <article className="status-panel status-summary-card">
            <div className="risk-score-wrap">
              <div
                className={`risk-score-ring risk-${riskClass}`}
                style={{ '--risk-deg': `${Math.round((Number(report.riskScore) / 100) * 360)}deg` }}
              >
                <span className="risk-score-glow" aria-hidden="true" />
                <strong>{report.riskScore}</strong>
                <span>{report.riskLevel}</span>
              </div>
              <div>
                <h2>Prioritas awal</h2>
                <p>Skor ini dihitung dari keparahan, kategori, laporan sekitar, fasilitas publik terdekat, dan umur laporan.</p>
              </div>
            </div>
            <div className="status-info-grid">
              <div><span>Kategori</span><strong>{CATEGORY_LABEL[report.category]}</strong></div>
              <div><span>Keparahan</span><strong>{SEVERITY_LABEL[report.severity]}</strong></div>
              <div><span>Dibuat</span><strong>{formatDateTime(report.createdAt)}</strong></div>
              <div><span>Diperbarui</span><strong>{formatDateTime(report.updatedAt)}</strong></div>
              <div><span>Petugas</span><strong>{report.assignedOfficerName || '-'}</strong></div>
              <div><span>Arsip</span><strong>{report.archivedAt ? formatDateTime(report.archivedAt) : '-'}</strong></div>
            </div>
          </article>

          <article className="status-panel">
            <div className="status-panel-head">
              <Clock3 size={18} />
              <h2>Timeline</h2>
            </div>
            <div className="timeline-list">
              {sortedHistory.map((item, index) => (
                <div className="timeline-item" key={`${item.status}-${item.at}-${index}`}>
                  <span className={`timeline-dot ${STATUS_CLASS[item.status] ?? ''}`}><CheckCircle2 size={14} /></span>
                  <div>
                    <strong>{STATUS_LABEL[item.status] ?? item.status}</strong>
                    <p>{item.note}</p>
                    <small>{item.actor} - {formatDateTime(item.at)}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="status-panel">
            <div className="status-panel-head">
              <MapPin size={18} />
              <h2>Lokasi dan deskripsi</h2>
            </div>
            <div className="status-detail-list">
              <div>
                <span>Wilayah</span>
                <strong>{formatReportLocation(report)}</strong>
              </div>
              <div>
                <span>Alamat / patokan</span>
                <strong>{report.address || '-'}</strong>
              </div>
              <div>
                <span>Koordinat area</span>
                <strong>{formatApproxReportCoordinates(report)}</strong>
                <small className="status-privacy-note">Dibulatkan untuk menjaga privasi lokasi pelapor.</small>
              </div>
              <p>{report.description}</p>
            </div>
          </article>

          <article className="status-panel">
            <div className="status-panel-head">
              <AlertTriangle size={18} />
              <h2>Alasan skor</h2>
            </div>
            <div className="breakdown-list">
              {report.riskBreakdown.map((item) => (
                <div
                  className="breakdown-row"
                  key={item.id}
                  style={{ '--breakdown-value': `${Math.round((item.points / item.weight) * 100)}%` }}
                >
                  <div className="breakdown-copy">
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                    <i className="breakdown-meter" aria-hidden="true" />
                  </div>
                  <span>{item.points}/{item.weight}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="status-panel status-photos-panel">
            <div className="status-panel-head">
              <Camera size={18} />
              <h2>Foto bukti</h2>
            </div>
            <div className="status-photo-grid">
              {reportPhotos.map((photo, index) => (
                <figure className="status-photo-card" key={photo.id ?? photo.url}>
                  <img src={photo.url} alt={`Foto laporan ${index + 1}`} loading="lazy" decoding="async" />
                  <figcaption>Foto {index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </article>

          {completionPhotos.length > 0 && (
            <article className="status-panel status-photos-panel">
              <div className="status-panel-head">
                <Camera size={18} />
                <h2>Foto penyelesaian</h2>
              </div>
              <div className="status-photo-grid">
                {completionPhotos.map((photo, index) => (
                  <figure className="status-photo-card" key={photo.id ?? photo.url}>
                    <img src={photo.url} alt={`Foto penyelesaian ${index + 1}`} loading="lazy" decoding="async" />
                    <figcaption>Selesai {index + 1}</figcaption>
                  </figure>
                ))}
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  )
}
