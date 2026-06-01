import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  Droplets,
  Layers3,
  LogOut,
  Map as MapIcon,
  MapPin,
  Play,
  Upload,
  Wrench,
} from 'lucide-react'
import './PetugasTasksPage.css'
import {
  getReports,
  isArchivedReport,
  subscribeReports,
  updateFieldProgress,
} from '../services/reportsStore.js'
import { signOut } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import {
  CATEGORY_LABEL,
  formatDateTime,
  formatReportLocation,
  reportToAdminRow,
  reportsToMarkers,
  sortReportsByPriority,
} from '../domain/reports.js'
import { STATUS_LABEL } from '../domain/status.js'
import { MAX_REPORT_PHOTOS, prepareReportPhotos } from '../services/imageFiles.js'

const RiskMap = lazy(() => import('../components/RiskMap.jsx'))

function TaskCard({ report, active, onSelect }) {
  const row = reportToAdminRow(report)
  return (
    <button type="button" className={`field-task-card ${active ? 'is-active' : ''}`} onClick={() => onSelect(report)}>
      <span className={`field-score risk-${String(report.riskLevel).toLowerCase()}`}>{report.riskScore}</span>
      <span>
        <strong>{report.code}</strong>
        <small>{row.title}</small>
        <small><MapPin size={13} /> {row.loc}</small>
      </span>
      <em>{STATUS_LABEL[report.status]}</em>
    </button>
  )
}

function PhotoInput({ photos, onChange }) {
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleFiles(files) {
    const incoming = Array.from(files || [])
    const availableSlots = MAX_REPORT_PHOTOS - photos.length
    const messages = []
    setError('')
    if (photos.length + incoming.length > MAX_REPORT_PHOTOS) {
      messages.push(`Maksimal ${MAX_REPORT_PHOTOS} foto penyelesaian.`)
    }
    setProcessing(true)
    try {
      const { photos: preparedPhotos, errors } = await prepareReportPhotos(incoming, availableSlots)
      onChange([...photos, ...preparedPhotos])
      messages.push(...errors)
    } finally {
      setProcessing(false)
    }
    if (messages.length) setError(messages.join(' '))
  }

  return (
    <div className="field-photo-box">
      <label className="field-upload-button">
        <Upload size={17} />
        {processing ? 'Memproses...' : 'Upload foto selesai'}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </label>
      {photos.length > 0 && (
        <div className="field-photo-preview">
          {photos.map((photo, index) => (
            <img key={photo.id ?? photo.url} src={photo.url} alt={`Foto selesai ${index + 1}`} />
          ))}
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function FieldCityMap({ reports, assignedReports }) {
  const markers = reportsToMarkers(reports)
  const criticalCount = reports.filter((report) => report.riskLevel === 'Kritis').length
  const handledCount = reports.filter((report) => report.status === 'ditangani').length
  const topReports = sortReportsByPriority(reports).slice(0, 4)

  return (
    <section className="field-map-panel">
      <div className="field-map-head">
        <div>
          <span><Layers3 size={15} /> Situasi kota</span>
          <h2>Peta risiko Bandar Lampung</h2>
          <p>Titik aktif dari laporan warga, tanpa arsip selesai/ditolak.</p>
        </div>
        <Link to="/peta" className="field-map-link">
          <MapIcon size={16} />
          Peta publik
        </Link>
      </div>

      <div className="field-map-stats">
        <div><strong>{reports.length}</strong><span>Titik aktif</span></div>
        <div><strong>{criticalCount}</strong><span>Kritis</span></div>
        <div><strong>{handledCount}</strong><span>Ditangani</span></div>
        <div><strong>{assignedReports.length}</strong><span>Tugas saya</span></div>
      </div>

      <div className="field-map-shell">
        <Suspense fallback={<div className="field-map-loading">Memuat peta...</div>}>
          <RiskMap height={460} markers={markers} />
        </Suspense>
      </div>

      <div className="field-priority-strip">
        {topReports.map((report) => (
          <div key={report.id} className="field-priority-item">
            <span className={`field-score risk-${String(report.riskLevel).toLowerCase()}`}>{report.riskScore}</span>
            <div>
              <strong>{report.code}</strong>
              <small>{formatReportLocation(report)}</small>
            </div>
            <em>{report.riskLevel}</em>
          </div>
        ))}
        {topReports.length === 0 && (
          <div className="field-empty compact">
            <CheckCircle2 size={28} />
            <p>Belum ada titik aktif di peta kota.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default function PetugasTasksPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const session = {
    email: user?.email,
    name: user?.user_metadata?.name || user?.email,
    role: user?.user_metadata?.role || (user?.email?.includes('admin') ? 'admin' : 'petugas'),
    officerId: user?.user_metadata?.officerId || 'ofc-budi'
  }
  const [reports, setReports] = useState(() => getReports())
  const [tab, setTab] = useState('aktif')
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [blockedReason, setBlockedReason] = useState('')
  const [completionPhotos, setCompletionPhotos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => subscribeReports(setReports), [])

  const officerReports = useMemo(() => {
    return reports.filter((report) => report.assignedOfficerId === session?.officerId)
  }, [reports, session?.officerId])

  const activeTasks = useMemo(() => {
    return officerReports.filter((report) => !isArchivedReport(report))
  }, [officerReports])

  const doneTasks = useMemo(() => {
    return officerReports.filter(isArchivedReport)
  }, [officerReports])

  const activeCityReports = useMemo(() => {
    return reports.filter((report) => !isArchivedReport(report))
  }, [reports])

  const scheduledTasks = activeTasks.filter((report) => report.status === 'dijadwalkan').length
  const inProgressTasks = activeTasks.filter((report) => report.status === 'ditangani').length
  const highPriorityTasks = activeTasks.filter((report) => report.riskScore >= 70).length
  const currentList = tab === 'selesai' ? doneTasks : activeTasks
  const selected = currentList.find((report) => report.id === selectedId) ?? currentList[0] ?? null
  const selectedRow = selected ? reportToAdminRow(selected) : null

  function resetForm() {
    setNote('')
    setBlockedReason('')
    setCompletionPhotos([])
    setError('')
  }

  function updateTask(action, payload = {}) {
    if (!selected) return
    setError('')
    try {
      const updated = updateFieldProgress(selected.id, action, payload, session)
      if (!updated) {
        setError('Aksi belum bisa dilakukan untuk status laporan saat ini.')
        return
      }
      setReports(getReports())
      setSelectedId(updated.id)
      resetForm()
    } catch (err) {
      setError(err.message || 'Aksi petugas gagal disimpan.')
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/petugas/login', { replace: true })
  }

  return (
    <div className="field-page">
      <header className="field-topbar">
        <Link to="/" className="field-back"><ArrowLeft size={18} /> Beranda</Link>
        <div className="field-brand"><span><Droplets size={18} /></span> ALIRIN Petugas</div>
        <button type="button" className="field-logout" onClick={handleLogout}><LogOut size={17} /> Keluar</button>
      </header>

      <main className="field-main">
        <section className="field-hero">
          <div className="field-hero-copy">
            <span>Tugas lapangan</span>
            <h1>{session?.name || 'Petugas Demo'}</h1>
            <p>Mulai penanganan, catat kendala, dan unggah bukti selesai.</p>
          </div>
          <div className="field-hero-metrics">
            <div className="field-hero-stats">
              <strong>{activeTasks.length}</strong>
              <span>aktif</span>
            </div>
            <div className="field-mini-stat">
              <strong>{scheduledTasks}</strong>
              <span>siap mulai</span>
            </div>
            <div className="field-mini-stat">
              <strong>{inProgressTasks}</strong>
              <span>ditangani</span>
            </div>
            <div className="field-mini-stat accent">
              <strong>{highPriorityTasks}</strong>
              <span>prioritas</span>
            </div>
          </div>
        </section>

        <section className="field-layout">
          <aside className="field-list-panel">
            <div className="field-tabs">
              <button type="button" className={tab === 'aktif' ? 'is-active' : ''} onClick={() => { setTab('aktif'); setSelectedId(''); resetForm() }}>
                Aktif
              </button>
              <button type="button" className={tab === 'peta' ? 'is-active' : ''} onClick={() => { setTab('peta'); setSelectedId(''); resetForm() }}>
                Peta
              </button>
              <button type="button" className={tab === 'selesai' ? 'is-active' : ''} onClick={() => { setTab('selesai'); setSelectedId(''); resetForm() }}>
                Selesai
              </button>
            </div>
            <div className="field-task-list">
              {tab === 'peta' ? (
                <div className="field-city-summary">
                  <strong>Pantauan aktif kota</strong>
                  <p>Gunakan peta untuk melihat titik risiko lain sebelum bergerak ke lokasi tugas.</p>
                  <span>{activeCityReports.length} titik aktif terpantau</span>
                </div>
              ) : (
                <>
                  {currentList.map((report) => (
                    <TaskCard
                      key={report.id}
                      report={report}
                      active={selected?.id === report.id}
                      onSelect={(item) => { setSelectedId(item.id); resetForm() }}
                    />
                  ))}
                  {currentList.length === 0 && (
                    <div className="field-empty">
                      <CheckCircle2 size={34} />
                      <p>{tab === 'aktif' ? 'Tidak ada tugas aktif.' : 'Belum ada tugas selesai.'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          <section className="field-detail-panel">
            {tab === 'peta' ? (
              <FieldCityMap reports={activeCityReports} assignedReports={activeTasks} />
            ) : selected ? (
              <>
                <div className="field-detail-layout">
                  <div className="field-detail-main">
                    <div className="field-detail-head">
                      <div>
                        <span>{selected.code}</span>
                        <h2>{CATEGORY_LABEL[selected.category]}</h2>
                        <p>{formatReportLocation(selected)}</p>
                      </div>
                      <strong>{STATUS_LABEL[selected.status]}</strong>
                    </div>

                    <div className="field-info-grid">
                      <div><MapPin size={17} /><span>Alamat</span><strong>{selected.address || '-'}</strong></div>
                      <div><Clock3 size={17} /><span>Dibuat</span><strong>{formatDateTime(selected.createdAt)}</strong></div>
                      <div><AlertTriangle size={17} /><span>Skor</span><strong>{selected.riskScore} ({selected.riskLevel})</strong></div>
                      <div><Wrench size={17} /><span>Masalah</span><strong>{selectedRow.title}</strong></div>
                    </div>

                    <p className="field-description">{selected.description}</p>

                    <div className="field-photo-strip">
                      {selected.photos.map((photo, index) => (
                        <img key={photo.id ?? photo.url} src={photo.url} alt={`Foto warga ${index + 1}`} />
                      ))}
                    </div>

                    {selected.completionPhotos?.length > 0 && (
                      <div className="field-completion">
                        <h3>Foto penyelesaian</h3>
                        <div className="field-photo-strip">
                          {selected.completionPhotos.map((photo, index) => (
                            <img key={photo.id ?? photo.url} alt={`Foto penyelesaian ${index + 1}`} src={photo.url} />
                          ))}
                        </div>
                      </div>
                    )}

                    {tab === 'aktif' && (
                      <div className="field-actions">
                        <textarea
                          rows={3}
                          placeholder="Catatan lapangan"
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                        />
                        <div className="field-button-row">
                          <button type="button" className="field-primary" onClick={() => updateTask('start', { note })} disabled={selected.status !== 'dijadwalkan'}>
                            <Play size={16} /> Mulai
                          </button>
                          <button type="button" onClick={() => updateTask('blocked', { blockedReason })}>
                            <AlertTriangle size={16} /> Simpan Kendala
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Kendala, contoh: butuh alat tambahan"
                          value={blockedReason}
                          onChange={(event) => setBlockedReason(event.target.value)}
                        />
                        <PhotoInput photos={completionPhotos} onChange={setCompletionPhotos} />
                        <button type="button" className="field-complete" onClick={() => updateTask('complete', { note, photos: completionPhotos })} disabled={selected.status !== 'ditangani'}>
                          <Camera size={16} /> Selesaikan dengan foto
                        </button>
                        {error && <p className="field-error">{error}</p>}
                      </div>
                    )}
                  </div>

                  <aside className="field-timeline">
                    <div className="field-timeline-head">
                      <span>Riwayat</span>
                      <h3>Timeline</h3>
                    </div>
                    <div className="field-timeline-list">
                      {(selected.statusHistory ?? []).slice().reverse().map((item, index) => (
                        <div className="field-history-item" key={`${item.status}-${item.at}-${index}`}>
                          <strong>{STATUS_LABEL[item.status] ?? item.status}</strong>
                          <span>{item.note}</span>
                          <small>{item.actor} - {formatDateTime(item.at)}</small>
                        </div>
                      ))}
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              <div className="field-empty detail">
                <CheckCircle2 size={42} />
                <h2>Tidak ada tugas</h2>
                <p>Tugas yang ditugaskan admin akan muncul di sini.</p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}
