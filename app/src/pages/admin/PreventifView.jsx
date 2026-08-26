import { useEffect, useState } from 'react'
import { AlertTriangle, MapPin, RefreshCw, Repeat, ShieldCheck } from 'lucide-react'
import { fetchRecurringPoints } from '../../services/recurringPointsService.js'
import { formatDateTime } from '../../domain/reports.js'
import './PreventifView.css'

// P-4 · Daftar Titik Preventif.
//
// Menjawab §7.2.4: pergeseran dari respons reaktif ke pemeliharaan terencana.
// Titik yang berulang SETELAH pernah ditangani ditandai tegas -- itu bukti
// respons per-laporan belum menyelesaikan akar masalahnya, dan menjadi kandidat
// terkuat untuk perbaikan fisik. Menjawab langsung keluhan §1.2 bahwa "laporan
// sedimentasi warga tidak pernah ditindaklanjuti".

function gapLabel(days) {
  if (days === null || days === undefined) return '—'
  if (days < 1) return 'kurang dari sehari'
  if (days < 30) return `tiap ~${Math.round(days)} hari`
  return `tiap ~${Math.round(days / 30)} bulan`
}

export default function PreventifView() {
  const [points, setPoints] = useState([])
  const [state, setState] = useState('loading')

  async function load() {
    setState('loading')
    const rows = await fetchRecurringPoints()
    setPoints(rows)
    setState('siap')
  }

  useEffect(() => {
    let active = true
    fetchRecurringPoints().then((rows) => {
      if (!active) return
      setPoints(rows)
      setState('siap')
    })
    return () => { active = false }
  }, [])

  const kambuh = points.filter((point) => point.recurredAfterDone)

  return (
    <div className="preventif-view">
      <div className="preventif-head">
        <div>
          <p className="preventif-lead">
            Titik yang berulang lintas waktu, dikelompokkan dalam radius 100 m
            selama 12 bulan terakhir. Prioritas untuk pemeliharaan terencana,
            bukan sekadar respons per laporan.
          </p>
          {kambuh.length > 0 && (
            <p className="preventif-warn">
              <AlertTriangle size={15} />
              {kambuh.length} titik kembali bermasalah setelah pernah ditangani.
            </p>
          )}
        </div>
        <button type="button" className="preventif-refresh" onClick={load} aria-label="Muat ulang">
          <RefreshCw size={16} />
        </button>
      </div>

      {state === 'loading' && <p className="preventif-empty">Menghitung titik berulang…</p>}

      {state === 'siap' && points.length === 0 && (
        <div className="preventif-empty">
          <ShieldCheck size={30} />
          <p>Belum ada titik yang berulang di atas ambang. Tidak ada pola kambuh yang terdeteksi.</p>
        </div>
      )}

      {state === 'siap' && points.length > 0 && (
        <ul className="preventif-list">
          {points.map((point) => (
            <li key={point.clusterId} className={point.recurredAfterDone ? 'preventif-item is-recurred' : 'preventif-item'}>
              <div className="preventif-count">
                <strong>{point.eventCount}×</strong>
                <small><Repeat size={12} /> {gapLabel(point.avgGapDays)}</small>
              </div>
              <div className="preventif-body">
                <div className="preventif-loc">
                  <MapPin size={14} />
                  <strong>{point.kelurahan || '—'}</strong>
                  <span>{point.kecamatan || '—'}</span>
                </div>
                <div className="preventif-meta">
                  <span>Pertama {formatDateTime(point.firstAt)}</span>
                  <span>Terakhir {formatDateTime(point.lastAt)}</span>
                  <span>Contoh {point.sampleCode}</span>
                </div>
              </div>
              {point.recurredAfterDone && (
                <span className="preventif-tag">
                  <AlertTriangle size={12} /> Berulang setelah ditangani
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
