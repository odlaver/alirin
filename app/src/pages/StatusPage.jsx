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
import { getReportByCode, subscribeReports } from '../services/reportsStore.js'
import { CATEGORY_LABEL, SEVERITY_LABEL, formatDateTime, formatReportLocation } from '../domain/reports.js'
import { getRiskLevelClass } from '../domain/scoring.js'
import { STATUS_CLASS, STATUS_LABEL } from '../domain/status.js'

function NotFoundStatus({ code }) {
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
        <AlertTriangle size={46} />
        <h1>Kode laporan tidak ditemukan</h1>
        <p>Kode {code} belum ada di penyimpanan lokal browser ini.</p>
        <Link to="/lapor" className="btn btn-primary">Buat laporan baru</Link>
      </main>
    </div>
  )
}

export default function StatusPage() {
  useSEO({
    title: 'Cek Status Laporan',
    description: 'Lacak perkembangan laporan drainase Anda dengan memasukkan nomor laporan atau nomor HP.'
  })
  const { code } = useParams()
  const [, setStoreVersion] = useState(0)

  useEffect(() => {
    return subscribeReports(() => setStoreVersion((version) => version + 1))
  }, [])

  const report = getReportByCode(code)

  const sortedHistory = useMemo(() => {
    return [...(report?.statusHistory ?? [])].sort((a, b) => new Date(a.at) - new Date(b.at))
  }, [report])

  if (!report) return <NotFoundStatus code={code} />

  const riskClass = getRiskLevelClass(report.riskLevel)
  const latestStatus = STATUS_LABEL[report.status] ?? 'Masuk'

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
        <section className="status-hero">
          <div>
            <span className="status-kicker">Status laporan</span>
            <h1>{report.code}</h1>
            <p>{CATEGORY_LABEL[report.category]} di {formatReportLocation(report)}</p>
          </div>
          <div className={`status-current ${STATUS_CLASS[report.status]}`}>
            <ShieldCheck size={18} />
            {latestStatus}
          </div>
        </section>

        <section className="status-grid">
          <article className="status-panel status-summary-card">
            <div className="risk-score-wrap">
              <div className={`risk-score-ring risk-${riskClass}`}>
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
                  <span className="timeline-dot"><CheckCircle2 size={14} /></span>
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
                <span>Koordinat</span>
                <strong>{Number(report.lat).toFixed(5)}, {Number(report.lng).toFixed(5)}</strong>
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
                <div className="breakdown-row" key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
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
              {report.photos.map((photo, index) => (
                <img src={photo.url} alt={`Foto laporan ${index + 1}`} key={photo.id ?? photo.url} />
              ))}
            </div>
          </article>

          {report.completionPhotos?.length > 0 && (
            <article className="status-panel status-photos-panel">
              <div className="status-panel-head">
                <Camera size={18} />
                <h2>Foto penyelesaian</h2>
              </div>
              <div className="status-photo-grid">
                {report.completionPhotos.map((photo, index) => (
                  <img src={photo.url} alt={`Foto penyelesaian ${index + 1}`} key={photo.id ?? photo.url} />
                ))}
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  )
}
