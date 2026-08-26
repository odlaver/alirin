import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, MapPin } from 'lucide-react'
import { useSEO } from '../hooks/useSEO.js'
import { ensureCitizenSession, fetchMyReports } from '../services/identityService.js'
import { getRiskLevelClass } from '../domain/scoring.js'
import { STATUS_LABEL } from '../domain/status.js'
import './StatusPage.css'

// P-8 · Laporan milik perangkat ini, tanpa perlu token.
//
// Sebelum ada identitas per perangkat, satu-satunya cara warga melacak
// laporannya adalah menyimpan token pelacakan tiap laporan. Dengan reporter_id,
// perangkat yang sama bisa melihat seluruh laporannya sekaligus.

export default function MyReportsPage() {
  useSEO({
    title: 'Laporan Saya',
    description: 'Daftar laporan drainase yang dikirim dari perangkat ini.',
  })

  const [state, setState] = useState('loading')
  const [reports, setReports] = useState([])

  useEffect(() => {
    let active = true

    async function load() {
      const ready = await ensureCitizenSession()
      if (!active) return
      if (!ready) {
        setState('tanpa-sesi')
        return
      }
      const rows = await fetchMyReports()
      if (!active) return
      setReports(rows)
      setState('siap')
    }

    load()
    return () => { active = false }
  }, [])

  return (
    <div className="status-page">
      <header className="status-topbar">
        <Link to="/" className="status-back">
          <ArrowLeft size={18} /> Beranda
        </Link>
        <h1>Laporan Saya</h1>
      </header>

      <main className="status-shell">
        {state === 'loading' && <p className="status-hint">Memuat laporan dari perangkat ini…</p>}

        {state === 'tanpa-sesi' && (
          <p className="status-hint">
            Perangkat ini belum memiliki sesi. Kirim satu laporan lebih dulu,
            atau lacak lewat token pelacakan yang Anda simpan.
          </p>
        )}

        {state === 'siap' && reports.length === 0 && (
          <div className="status-empty">
            <FileText size={32} />
            <p>Belum ada laporan dari perangkat ini.</p>
            <Link to="/lapor" className="btn btn-primary">Buat laporan</Link>
          </div>
        )}

        {state === 'siap' && reports.length > 0 && (
          <ul className="my-reports-list">
            {reports.map((row) => (
              <li key={row.id}>
                <Link to={`/status/${row.public_tracking_token ?? ''}`} className="my-reports-item">
                  <span className={`my-reports-score risk-${getRiskLevelClass(row.risk_level)}`}>
                    {row.risk_score}
                  </span>
                  <span className="my-reports-body">
                    <strong>{row.code}</strong>
                    <small>
                      <MapPin size={13} />
                      {row.kelurahan || '—'}, {row.kecamatan || '—'}
                    </small>
                  </span>
                  <span className="my-reports-status">{STATUS_LABEL[row.status] ?? row.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
