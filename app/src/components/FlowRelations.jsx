import { useEffect, useState } from 'react'
import { ArrowRight, CloudRain, Info } from 'lucide-react'
import { loadFlowRelations } from '../services/upstreamService.js'
import { isSupabaseConfigured, supabase } from '../services/supabaseClient.js'
import './FlowRelations.css'

// P-3 · Relasi hulu-hilir, inovasi ke-2 proposal.
//
// Sebagian wilayah Bandar Lampung berbukit dan berperan sebagai hulu; genangan
// di wilayah bawah bisa berasal dari hujan yang turun jauh di atasnya
// (Proposal 1.1 dan 1.4). Panel ini menampilkan relasi itu beserta hujan yang
// sedang tercatat di tiap hulu, sehingga admin melihat arah aliran, bukan hanya
// titik.
//
// Panah antar wilayah di atas peta belum digambar karena batas dan titik pusat
// kecamatan belum ada di sistem. Mengarang koordinatnya akan membuat peta
// tampak lebih tahu daripada datanya.

const KEKUATAN_LABEL = { 3: 'kuat', 2: 'sedang', 1: 'lemah' }
const WEATHER_FRESH_MS = 3 * 60 * 60 * 1000

function normalizeArea(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default function FlowRelations() {
  const [relations, setRelations] = useState([])
  const [weather, setWeather] = useState(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const rows = await loadFlowRelations()
      if (!active) return
      setRelations(rows)

      if (isSupabaseConfigured) {
        const { data } = await supabase.from('area_weather').select('kecamatan, rainfall_mm, observed_at')
        if (active && data) {
          const fresh = new Map()
          for (const row of data) {
            if (Date.now() - new Date(row.observed_at).getTime() > WEATHER_FRESH_MS) continue
            fresh.set(normalizeArea(row.kecamatan), row.rainfall_mm)
          }
          setWeather(fresh)
        }
      }
      if (active) setLoading(false)
    }

    load()
    return () => { active = false }
  }, [])

  if (loading) return null
  if (relations.length === 0) return null

  return (
    <div className="flow-relations">
      <div className="flow-relations-head">
        <small>Relasi Hulu–Hilir</small>
        <span>{relations.length} relasi</span>
      </div>

      <p className="flow-relations-intro">
        Hujan di wilayah atas ikut menaikkan risiko di wilayah bawah, walau di
        lokasinya sendiri sedang tidak hujan.
      </p>

      <ul className="flow-relations-list">
        {relations.map((relation) => {
          const rainfall = weather.get(normalizeArea(relation.kecamatan_hulu))
          const hasRain = Number.isFinite(Number(rainfall))
          return (
            <li key={`${relation.kecamatan_hulu}-${relation.kecamatan_hilir}`}>
              <div className="flow-relations-pair">
                <strong>{relation.kecamatan_hulu}</strong>
                <ArrowRight size={14} aria-label="mengalir ke" />
                <strong>{relation.kecamatan_hilir}</strong>
                <em className={`flow-strength flow-strength-${relation.kekuatan}`}>
                  {KEKUATAN_LABEL[relation.kekuatan] ?? 'lemah'}
                </em>
              </div>

              <div className="flow-relations-rain">
                <CloudRain size={13} />
                {hasRain
                  ? `${Number(rainfall).toFixed(1)} mm tercatat di hulu`
                  : 'Belum ada catatan hujan di hulu'}
              </div>

              <small className="flow-relations-source" title={relation.sumber}>
                <Info size={11} />
                {relation.sumber}
              </small>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
