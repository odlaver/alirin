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

function NotFoundStatus({ token }) {
  return (
    <div className="status-page">
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
          <p>
            Token <code>{maskStatusToken(token)}</code> belum cocok dengan laporan yang tersimpan.
            Pastikan link dibuka dari halaman sukses laporan.
          </p>
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
      <header className="status-topbar">
        <Link to="/" className="status-back"><ArrowLeft size={18} /> Beranda</Link>
        <div className="status-brand">
          <span className="status-brand-mark"><Droplets size={18} /></span>
          ALIRIN
        </div>
        <Link to="/lapor" className="status-new-link">Laporan baru</Link>
      </header>

      <main className="status-main">
        <section className="status-overview">
          <div className="status-overview-copy">
            <span className="status-kicker">Status laporan</span>
            <h1>{report.code}</h1>
            <p>{CATEGORY_LABEL[report.category]} di {formatReportLocation(report)}</p>
            <div className="status-meta-row">
              <span><Clock3 size={15} /> Update {formatDateTime(report.updatedAt)}</span>
              <span><Camera size={15} /> {totalPhotos} foto</span>
            </div>
          </div>
          <aside className="status-now-card" aria-label="Status saat ini">
            <span className="status-card-label">Status saat ini</span>
            <div className={`status-current ${STATUS_CLASS[report.status]}`}>
              <ShieldCheck size={18} />
              {latestStatus}
            </div>
            <p>{latestHistory?.note || 'Laporan sedang dipantau sistem.'}</p>
          </aside>
        </section>

        <section className={`status-tracker ${report.status === 'ditolak' ? 'is-rejected' : ''}`} style={{ '--status-progress': `${statusProgress}%` }}>
          <div className="status-tracker-head">
            <span>Alur penanganan</span>
            <strong>{report.status === 'ditolak' ? 'Ditolak' : latestStatus}</strong>
          </div>
          <div className="status-tracker-line" aria-hidden="true"><span /></div>
          <div className="status-tracker-steps">
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
          </div>
        </section>

        <section className="status-grid">
          <article className="status-panel status-summary-card">
            <div className="status-summary-line">
              <span className={`status-priority-pill risk-${riskClass}`}>
                <strong>{report.riskScore}</strong>
                {report.riskLevel}
              </span>
              <div>
                <h2>Prioritas awal</h2>
                <p>Dipakai petugas untuk mengurutkan penanganan.</p>
              </div>
            </div>
            <div className="status-info-grid">
              <div><span>Kategori</span><strong>{CATEGORY_LABEL[report.category]}</strong></div>
              <div><span>Keparahan</span><strong>{SEVERITY_LABEL[report.severity]}</strong></div>
              <div><span>Dibuat</span><strong>{formatDateTime(report.createdAt)}</strong></div>
              <div><span>Petugas</span><strong>{report.assignedOfficerName || '-'}</strong></div>
              {report.archivedAt && (
                <div><span>Arsip</span><strong>{formatDateTime(report.archivedAt)}</strong></div>
              )}
            </div>
          </article>

          <details className="status-panel status-disclosure">
            <summary>
              <span className="status-panel-head">
                <Clock3 size={18} />
                <h2>Timeline</h2>
              </span>
              <small>{sortedHistory.length} update</small>
            </summary>
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
          </details>

          <details className="status-panel status-disclosure">
            <summary>
              <span className="status-panel-head">
                <MapPin size={18} />
                <h2>Lokasi dan deskripsi</h2>
              </span>
              <small>{report.kecamatan || 'Lokasi'}</small>
            </summary>
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
          </details>

          {reportPhotos.length > 0 && (
            <details className="status-panel status-disclosure status-photos-panel">
              <summary>
                <span className="status-panel-head">
                  <Camera size={18} />
                  <h2>Foto bukti</h2>
                </span>
                <small>{reportPhotos.length} foto</small>
              </summary>
              <div className="status-photo-grid">
                {reportPhotos.map((photo, index) => (
                  <figure className="status-photo-card" key={photo.id ?? photo.url}>
                    <img src={photo.url} alt={`Foto laporan ${index + 1}`} loading="lazy" decoding="async" />
                    <figcaption>Foto {index + 1}</figcaption>
                  </figure>
                ))}
              </div>
            </details>
          )}

          {completionPhotos.length > 0 && (
            <details className="status-panel status-disclosure status-photos-panel">
              <summary>
                <span className="status-panel-head">
                  <Camera size={18} />
                  <h2>Foto penyelesaian</h2>
                </span>
                <small>{completionPhotos.length} foto</small>
              </summary>
              <div className="status-photo-grid">
                {completionPhotos.map((photo, index) => (
                  <figure className="status-photo-card" key={photo.id ?? photo.url}>
                    <img src={photo.url} alt={`Foto penyelesaian ${index + 1}`} loading="lazy" decoding="async" />
                    <figcaption>Selesai {index + 1}</figcaption>
                  </figure>
                ))}
              </div>
            </details>
          )}
        </section>
      </main>
    </div>
  )
}
