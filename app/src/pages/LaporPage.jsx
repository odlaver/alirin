import { useRef, useState, useEffect } from 'react'
import { useSEO } from '../hooks/useSEO.js'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Droplets,
  FileText,
  MapPin,
  Navigation,
  Send,
  Trash2,
  Upload,
  Waves,
  Wind,
  Wrench,
  X,
} from 'lucide-react'
import './LaporPage.css'
import ReportMapPicker from '../components/ReportMapPicker.jsx'
import { KECAMATAN_DATA } from '../data/bandarLampungAreas.js'
import { createReport } from '../services/reportsStore.js'
import { MAX_REPORT_PHOTOS, prepareReportPhotos } from '../services/imageFiles.js'

const CATEGORIES = [
  { id: 'sumbatan', label: 'Sumbatan sampah', icon: Trash2 },
  { id: 'genangan', label: 'Genangan jalan', icon: Waves },
  { id: 'aliran-lambat', label: 'Aliran lambat', icon: Droplets },
  { id: 'drainase-rusak', label: 'Drainase rusak', icon: Wrench },
  { id: 'bau', label: 'Bau tidak sedap', icon: Wind },
  { id: 'lainnya', label: 'Lainnya', icon: ClipboardList },
]

const SEVERITY = [
  { id: 'ringan', label: 'Ringan', desc: 'Genangan kecil', color: 'normal' },
  { id: 'sedang', label: 'Sedang', desc: 'Mengganggu aktivitas', color: 'waspada' },
  { id: 'parah', label: 'Parah', desc: 'Menutup akses', color: 'tinggi' },
  { id: 'kritis', label: 'Kritis', desc: 'Butuh segera', color: 'kritis' },
]

const STEPS = ['Lokasi', 'Detail', 'Kirim']

const INITIAL_DATA = {
  lat: -5.3971,
  lng: 105.2668,
  kecamatan: '',
  kelurahan: '',
  alamat: '',
  category: '',
  severity: '',
  deskripsi: '',
  photos: [],
  nama: '',
  kontak: '',
}

const SLIDE_VARIANTS = {
  enter: (dir) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(6px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (dir) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(6px)',
  }),
}

const containerMotion = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const itemMotion = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
  },
}

function StepDot({ step, current, label }) {
  const done = current > step
  const active = current === step

  return (
    <div className={`step-dot-wrap ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}>
      <motion.div
        className="step-dot"
        animate={active ? { y: [0, -5, 0], scale: [1, 1.06, 1] } : { y: 0, scale: 1 }}
        transition={active ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] } : { duration: 0.2 }}
      >
        {done ? <CheckCircle2 size={16} /> : <span>{step}</span>}
      </motion.div>
      <span className="step-dot-label">{label}</span>
    </div>
  )
}

function Step1({ data, setData }) {
  const [isLocating, setIsLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation tidak didukung browser ini. Geser pin peta secara manual.')
      return
    }

    setLocError('')
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted.current) return
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude

        setIsLocating(false)
        setData({ ...data, lat, lng: lon, alamat: 'Lokasi terkini Anda' })
      },
      (err) => {
        if (!isMounted.current) return
        setIsLocating(false)
        if (err.code === err.TIMEOUT) {
          setLocError('Waktu pencarian lokasi habis. Pastikan GPS aktif atau geser pin peta secara manual.')
        } else {
          setLocError('Gagal mendapatkan lokasi. Pastikan izin akses lokasi diberikan.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="step-body">
      <div className="step-heading">
        <span className="step-icon-wrap bg-blue-soft">
          <MapPin size={24} />
        </span>
        <div>
          <h2>Tentukan lokasi</h2>
          <p>Pin titik masalah dan patokan terdekat.</p>
        </div>
      </div>

      <div className="map-picker-mock">
        <ReportMapPicker
          lat={data.lat}
          lng={data.lng}
          onChange={(point) => setData({ ...data, ...point })}
        />

        <div className="map-actions-row">
          <div className="map-coords">
            <MapPin size={14} />
            <span>
              {data.lat.toFixed(5)}, {data.lng.toFixed(5)}
            </span>
          </div>
          <button
            type="button"
            className="btn-locate-text"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
          >
            <Navigation size={14} className={isLocating ? 'icon-spin' : ''} />
            {isLocating ? 'Mencari...' : 'Lokasi terkini'}
          </button>
        </div>
      </div>
      {locError && <p className="location-error" role="alert">{locError}</p>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="kecamatan">Kecamatan</label>
          <select
            id="kecamatan"
            value={data.kecamatan}
            onChange={(event) => setData({ ...data, kecamatan: event.target.value, kelurahan: '' })}
          >
            <option value="">Pilih kecamatan</option>
            {Object.keys(KECAMATAN_DATA).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="kelurahan">Kelurahan</label>
          <select
            id="kelurahan"
            value={data.kelurahan}
            onChange={(event) => setData({ ...data, kelurahan: event.target.value })}
            disabled={!data.kecamatan}
          >
            <option value="">Pilih kelurahan</option>
            {data.kecamatan && KECAMATAN_DATA[data.kecamatan].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="alamat">Alamat / patokan</label>
        <input
          id="alamat"
          type="text"
          placeholder="Depan warung Bu Sari, RT 03"
          value={data.alamat}
          onChange={(event) => setData({ ...data, alamat: event.target.value })}
        />
      </div>
    </div>
  )
}

function Step2({ data, setData }) {
  return (
    <div className="step-body">
      <div className="step-heading">
        <span className="step-icon-wrap bg-orange-soft">
          <AlertTriangle size={24} />
        </span>
        <div>
          <h2>Detail masalah</h2>
          <p>Kategori, dampak, dan kondisi lapangan.</p>
        </div>
      </div>

      <div className="form-group">
        <label>Kategori</label>
        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              type="button"
              className={`category-chip ${data.category === cat.id ? 'is-selected' : ''}`}
              onClick={() => setData({ ...data, category: cat.id })}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <cat.icon size={18} />
              <span>{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Keparahan</label>
        <div className="severity-list">
          {SEVERITY.map((sev) => (
            <motion.button
              key={sev.id}
              type="button"
              className={`severity-item risk-${sev.color} ${data.severity === sev.id ? 'is-selected' : ''}`}
              onClick={() => setData({ ...data, severity: sev.id })}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="severity-dot" />
              <span className="severity-text">
                <strong>{sev.label}</strong>
                <small>{sev.desc}</small>
              </span>
              <span className="severity-check">
                {data.severity === sev.id && <CheckCircle2 size={18} />}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="deskripsi">Deskripsi</label>
        <textarea
          id="deskripsi"
          rows={3}
          maxLength={300}
          placeholder="Contoh: Air meluap setelah hujan, sampah menutup inlet."
          value={data.deskripsi}
          onChange={(event) => setData({ ...data, deskripsi: event.target.value })}
        />
        <small>{data.deskripsi.length}/300 karakter (minimal 10 karakter)</small>
      </div>
    </div>
  )
}

function PhotoUploader({ photos, onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleFiles(files) {
    const incoming = Array.from(files || [])
    const availableSlots = MAX_REPORT_PHOTOS - photos.length
    const messages = []
    setError('')

    if (photos.length + incoming.length > MAX_REPORT_PHOTOS) {
      messages.push(`Maksimal ${MAX_REPORT_PHOTOS} foto untuk satu laporan.`)
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
    <div className="photo-uploader">
      <div className="photo-grid">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.url}
              className="photo-thumb"
              initial={{ opacity: 0, scale: 0.78, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.78, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <img src={photo.url} alt={`Foto ${index + 1}`} />
              <button
                type="button"
                className="photo-remove"
                onClick={() => {
                  onChange(photos.filter((_, idx) => idx !== index))
                }}
                aria-label={`Hapus foto ${index + 1}`}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < MAX_REPORT_PHOTOS && (
          <motion.button
            type="button"
            className="photo-add"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera size={24} />
            <span>{processing ? 'Memproses...' : 'Tambah foto'}</span>
            <small>Maks. {MAX_REPORT_PHOTOS}</small>
          </motion.button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(event) => {
          void handleFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {photos.length === 0 && (
        <button
          type="button"
          className="photo-drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            void handleFiles(event.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={28} />
          <span>
            <strong>Upload bukti</strong>
            <small>JPG, PNG, WEBP, maks. 5 MB</small>
          </span>
        </button>
      )}
      {error && <p className="photo-error">{error}</p>}
    </div>
  )
}

function Step3({ data, setData }) {
  const cat = CATEGORIES.find((item) => item.id === data.category)
  const sev = SEVERITY.find((item) => item.id === data.severity)

  return (
    <div className="step-body">
      <div className="step-heading">
        <span className="step-icon-wrap bg-green-soft">
          <Camera size={24} />
        </span>
        <div>
          <h2>Foto & kirim</h2>
          <p>Bukti lapangan dan kontak opsional.</p>
        </div>
      </div>

      <div className="form-group">
        <label>Foto bukti <span>Wajib</span></label>
        <small className="photo-required-note">Minimal 1 foto. Maksimal 3 foto, 5 MB per file.</small>
        <PhotoUploader photos={data.photos} onChange={(photos) => setData({ ...data, photos })} />
      </div>

      <div className="review-section">
        <div className="review-header">
          <FileText size={18} />
          <h3>Review</h3>
        </div>
        <div className="review-content">
          <div className="review-item">
            <span>Lokasi</span>
            <p>{data.kecamatan || '-'}, {data.kelurahan || '-'}</p>
          </div>
          <div className="review-item">
            <span>Masalah</span>
            <p>
              {cat?.label || '-'}
              <strong className={`badge-risk-${sev?.color || 'normal'}`}>{sev?.label || '-'}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nama">Nama <span>Opsional</span></label>
          <input
            id="nama"
            type="text"
            placeholder="Nama atau anonim"
            value={data.nama}
            onChange={(event) => setData({ ...data, nama: event.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="kontak">WhatsApp <span>Opsional</span></label>
          <input
            id="kontak"
            type="tel"
            placeholder="Untuk konfirmasi"
            value={data.kontak}
            onChange={(event) => setData({ ...data, kontak: event.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ report, onNew }) {
  return (
    <motion.div
      className="success-screen"
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 210 }}
    >
      <motion.div
        className="success-icon"
        initial={{ scale: 0, rotate: -18 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.16, type: 'spring', damping: 14 }}
      >
        <CheckCircle2 size={50} />
      </motion.div>
      <span className="success-kicker">Laporan masuk</span>
      <h2>{report.code}</h2>
      <p>Simpan kode ini untuk cek status. Skor awal: {report.riskScore} ({report.riskLevel}).</p>

      <div className="success-actions">
        <Link to="/" className="btn btn-outline">
          <ArrowLeft size={18} />
          Beranda
        </Link>
        <Link to={`/status/${report.code}`} className="btn btn-primary">
          Cek Status Laporan
        </Link>
        <button className="btn btn-ghost" type="button" onClick={onNew}>
          Laporan baru
        </button>
      </div>
    </motion.div>
  )
}

export default function LaporPage() {
  useSEO({
    title: 'Lapor Masalah Drainase',
    description: 'Bantu cegah banjir dengan melaporkan kondisi drainase tersumbat atau rusak di sekitar Anda.'
  })
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [data, setData] = useState(INITIAL_DATA)
  const [submittedReport, setSubmittedReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function canNext() {
    if (step === 1) return data.kecamatan !== '' && data.kelurahan.trim() !== ''
    if (step === 2) return data.category !== '' && data.severity !== '' && data.deskripsi.trim().length >= 10
    return data.photos.length > 0
  }

  function goNext() {
    setSubmitError('')
    setDir(1)
    setStep((current) => current + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goPrev() {
    setSubmitError('')
    setDir(-1)
    setStep((current) => current - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!canNext()) return
    setSubmitError('')
    setLoading(true)
    try {
      const report = await createReport({
        ...data,
        description: data.deskripsi,
        address: data.alamat,
        reporterName: data.nama || 'Anonim',
        reporterContact: data.kontak || '-',
      })
      setSubmittedReport(report)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const isQuota = error.message?.toLowerCase().includes('penuh') ||
                      error.message?.toLowerCase().includes('quota') ||
                      error.name === 'QuotaExceededError'
      setSubmitError(
        isQuota
          ? 'Penyimpanan browser penuh karena terlalu banyak foto terkompresi. Kurangi jumlah foto atau minta admin mengosongkan data demo.'
          : (error.message || 'Laporan belum bisa dikirim. Periksa kembali data laporan.')
      )
    } finally {
      setLoading(false)
    }
  }

  function handleNewReport() {
    setData({ ...INITIAL_DATA })
    setSubmittedReport(null)
    setStep(1)
    navigate('/lapor', { replace: true })
  }

  return (
    <div className="lapor-page">
      <div className="lapor-bg" aria-hidden="true">
        <span className="bg-line line-one" />
        <span className="bg-line line-two" />
        <span className="bg-orbit orbit-one" />
        <span className="bg-orbit orbit-two" />
      </div>

      <header className="lapor-header">
        <div className="lapor-header-inner">
          <Link to="/" className="lapor-back">
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </Link>
          <div className="lapor-logo">
            <span className="logo-icon"><Droplets size={18} /></span>
            <strong>ALIRIN</strong>
          </div>
          <div className="header-right" />
        </div>
      </header>

      <main className="lapor-main">
        {submittedReport ? (
          <SuccessScreen report={submittedReport} onNew={handleNewReport} />
        ) : (
          <motion.div
            className="lapor-container"
            variants={containerMotion}
            initial="hidden"
            animate="show"
          >
            <div className="lapor-hero-grid">
              <motion.section className="lapor-intro" variants={itemMotion}>
                <span className="lapor-kicker">
                  <span aria-hidden="true" />
                  Laporan warga
                </span>
                <h1>Laporkan titik drainase.</h1>
                <p>Cepat, visual, langsung masuk prioritas.</p>
                <div className="lapor-intro-badges" aria-label="Ringkasan fitur laporan">
                  <span>Bukti</span>
                  <span>Lokasi</span>
                  <span>Risiko</span>
                </div>
              </motion.section>
            </div>

            <motion.section className="lapor-form-shell" variants={itemMotion}>
              <div className="lapor-progress">
                <div className="step-track">
                  <span className="step-track-bg" />
                  <motion.span
                    className="step-track-fill"
                    animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {STEPS.map((label, index) => (
                    <StepDot key={label} step={index + 1} current={step} label={label} />
                  ))}
                </div>
              </div>

              <motion.div className="lapor-card-content" layout>
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={step}
                    custom={dir}
                    variants={SLIDE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {step === 1 && <Step1 data={data} setData={setData} />}
                    {step === 2 && <Step2 data={data} setData={setData} />}
                    {step === 3 && <Step3 data={data} setData={setData} />}
                  </motion.div>
                </AnimatePresence>

                {submitError && (
                  <p className="submit-error" role="alert">
                    {submitError}
                  </p>
                )}

                <div className="lapor-nav-sticky">
                  {step > 1 ? (
                    <motion.button
                      type="button"
                      className="btn btn-ghost"
                      onClick={goPrev}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <ArrowLeft size={18} />
                      Kembali
                    </motion.button>
                  ) : <span />}

                  {step < 3 ? (
                    <motion.button
                      type="button"
                      className="btn btn-primary"
                      onClick={goNext}
                      disabled={!canNext()}
                      whileHover={canNext() ? { y: -4, scale: 1.02 } : undefined}
                      whileTap={canNext() ? { scale: 0.97 } : undefined}
                    >
                      Lanjut
                      <ChevronRight size={18} />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      className="btn btn-submit"
                      onClick={handleSubmit}
                      disabled={loading || !canNext()}
                      whileHover={!loading ? { y: -4, scale: 1.02 } : undefined}
                      whileTap={!loading ? { scale: 0.97 } : undefined}
                    >
                      {loading ? (
                        <>
                          <span className="spinner" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Kirim laporan
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.section>
          </motion.div>
        )}
      </main>
    </div>
  )
}
