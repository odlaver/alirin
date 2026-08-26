import { useEffect, useState } from 'react'
import { AlertTriangle, CloudRain, X } from 'lucide-react'
import { fetchActiveAlerts } from '../services/alertsService.js'
import './AlertBanner.css'

// P-6 · Spanduk alert di dashboard admin dan halaman peta.
//
// Menampilkan alert aktif. Alert 'hulu' -- hujan di wilayah atas -- diberi ikon
// dan warna berbeda karena itu peringatan yang paling khas ALIRIN: wilayah
// bawah diperingatkan sebelum kiriman airnya tiba.

const REFRESH_MS = 2 * 60 * 1000

export default function AlertBanner({ kecamatan = null }) {
  const [alerts, setAlerts] = useState([])
  const [dismissed, setDismissed] = useState(() => new Set())

  useEffect(() => {
    let active = true

    async function load() {
      const rows = await fetchActiveAlerts({ kecamatan })
      if (active) setAlerts(rows)
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => { active = false; clearInterval(timer) }
  }, [kecamatan])

  const visible = alerts.filter((alert) => !dismissed.has(alert.id))
  if (visible.length === 0) return null

  return (
    <div className="alert-banner-stack" role="status" aria-live="polite">
      {visible.map((alert) => (
        <div key={alert.id} className={`alert-banner alert-banner-${alert.jenis}`}>
          <span className="alert-banner-icon">
            {alert.jenis === 'hulu' ? <CloudRain size={18} /> : <AlertTriangle size={18} />}
          </span>
          <p className="alert-banner-text">{alert.pesan}</p>
          <button
            type="button"
            className="alert-banner-close"
            aria-label="Tutup peringatan"
            onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
