import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

const KECAMATAN_DATA = {
  'Bumi Waras': ['Bumi Raya', 'Bumi Waras', 'Garuntang', 'Kangkung', 'Sukaraja'],
  'Enggal': ['Enggal', 'Gunung Sari', 'Pahoman', 'Pelita', 'Rawa Laut', 'Tanjung Karang'],
  'Kedamaian': ['Bumi Kedamaian', 'Kalibalau Kencana', 'Kedamaian', 'Tanjung Agung Raya', 'Tanjung Baru', 'Tanjung Raya'],
  'Kedaton': ['Kedaton', 'Penengahan', 'Penengahan Raya', 'Sidodadi', 'Sukamenanti', 'Sukamenanti Baru', 'Surabaya'],
  'Kemiling': ['Beringin Jaya', 'Beringin Raya', 'Kedaung', 'Kemiling Permai', 'Kemiling Raya', 'Pinang Jaya', 'Sumber Agung', 'Sumber Rejo', 'Sumber Rejo Sejahtera'],
  'Labuhan Ratu': ['Kampung Baru', 'Kampung Baru Raya', 'Kota Sepang', 'Labuhan Ratu', 'Labuhan Ratu Raya', 'Sepang Jaya'],
  'Langkapura': ['Bilabong Jaya', 'Gunung Agung', 'Gunung Terang', 'Langkapura', 'Langkapura Baru'],
  'Panjang': ['Karang Maritim', 'Ketapang', 'Ketapang Kuala', 'Panjang Selatan', 'Panjang Utara', 'Pidada', 'Srengsem', 'Way Lunik'],
  'Rajabasa': ['Nyunyai', 'Rajabasa', 'Rajabasa Jaya', 'Rajabasa Nunyai', 'Rajabasa Pemuka', 'Rajabasa Raya'],
  'Sukabumi': ['Campang Jaya', 'Campang Raya', 'Nusantara Permai', 'Sukabumi', 'Sukabumi Indah', 'Way Gubak', 'Way Laga'],
  'Sukarame': ['Korpri Jaya', 'Korpri Raya', 'Sukarame', 'Sukarame Baru', 'Way Dadi', 'Way Dadi Baru'],
  'Tanjung Karang Barat': ['Gedong Air', 'Kelapa Tiga Permai', 'Segala Mider', 'Sukadanaham', 'Sukajawa', 'Sukajawa Baru', 'Susunan Baru'],
  'Tanjung Karang Pusat': ['Durian Payung', 'Gotong Royong', 'Kaliawi', 'Kaliawi Persada', 'Kelapa Tiga', 'Palapa'],
  'Tanjung Karang Timur': ['Kota Baru', 'Sawah Brebes', 'Sawah Lama', 'Tanjung Agung', 'Kebon Jeruk'],
  'Tanjung Senang': ['Labuhan Dalam', 'Pematang Wangi', 'Perumnas Way Kandis', 'Tanjung Senang', 'Way Kandis'],
  'Teluk Betung Barat': ['Bakung', 'Batu Putuk', 'Kuripan', 'Negeri Olok Gading', 'Sukarame II'],
  'Teluk Betung Selatan': ['Gedong Pakuon', 'Gunung Mas', 'Pesawahan', 'Sumur Putri', 'Talang', 'Tukik'],
  'Teluk Betung Timur': ['Keteguhan', 'Kota Karang', 'Kota Karang Raya', 'Perwata', 'Sukamaju', 'Way Tataan'],
  'Teluk Betung Utara': ['Kupang Kota', 'Kupang Raya', 'Kupang Teba', 'Pengajaran', 'Sumur Batu'],
  'Way Halim': ['Gunung Sulah', 'Jagabaya I', 'Jagabaya II', 'Jagabaya III', 'Perumnas Way Halim', 'Way Halim Permai'],
}

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

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude

        setIsLocating(false)
        setData({ ...data, lat, lng: lon, alamat: 'Lokasi terkini Anda' })
      },
      () => {
        setIsLocating(false)
        alert('Gagal mengambil lokasi. Pastikan izin lokasi aktif.')
      }
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

  function handleFiles(files) {
    const next = [...photos]

    for (const file of files) {
      if (next.length >= 3) break
      if (!file.type.startsWith('image/')) continue
      next.push({ file, url: URL.createObjectURL(file) })
    }

    onChange(next)
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
                  URL.revokeObjectURL(photos[index].url)
                  onChange(photos.filter((_, idx) => idx !== index))
                }}
                aria-label={`Hapus foto ${index + 1}`}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < 3 && (
          <motion.button
            type="button"
            className="photo-add"
            onClick={() => inputRef.current?.click()}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera size={24} />
            <span>Tambah foto</span>
            <small>Maks. 3</small>
          </motion.button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {photos.length === 0 && (
        <button
          type="button"
          className="photo-drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            handleFiles(event.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={28} />
          <span>
            <strong>Upload bukti</strong>
            <small>JPG, PNG, WEBP</small>
          </span>
        </button>
      )}
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
        <label>Foto bukti <span>Opsional</span></label>
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

function SuccessScreen() {
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
      <h2>ALR-2026-00129</h2>
      <p>Simpan kode ini untuk cek status.</p>

      <div className="success-actions">
        <Link to="/" className="btn btn-outline">
          <ArrowLeft size={18} />
          Beranda
        </Link>
        <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
          Laporan baru
        </button>
      </div>
    </motion.div>
  )
}

export default function LaporPage() {
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [data, setData] = useState(INITIAL_DATA)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function canNext() {
    if (step === 1) return data.kecamatan !== '' && data.kelurahan.trim() !== ''
    if (step === 2) return data.category !== '' && data.severity !== '' && data.deskripsi.trim().length >= 10
    return true
  }

  function goNext() {
    setDir(1)
    setStep((current) => current + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goPrev() {
    setDir(-1)
    setStep((current) => current - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1100))
    setLoading(false)
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        {submitted ? (
          <SuccessScreen />
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
                      disabled={loading}
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
