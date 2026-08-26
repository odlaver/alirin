import { useEffect, useState } from 'react'
import { CloudRain, Sparkles, Waves } from 'lucide-react'
import { fetchWeatherBrief } from '../services/aiService.js'
import { resolveAdm4 } from '../data/bandarLampungAreas.js'
import './WeatherBrief.css'

// P-1 · Kartu prakiraan yang sebelumnya hanya ada di mobile.
//
// Laporan audit mencatat admin di web tidak melihat konteks cuaca sama sekali,
// padahal warga di mobile melihatnya. Kartu ini menutup jarak itu, dan
// memanggilnya lewat Edge Function -- bukan langsung ke Groq -- supaya tidak
// ada kunci API yang perlu ada di sisi browser.
//
// Label sumber ditampilkan apa adanya. Kartu berlabel "Analisis AI" yang isinya
// sebenarnya if-else adalah hal yang harus dihindari, bukan disamarkan.

const DEFAULT_AREA = { kecamatan: 'Tanjung Karang Pusat', kelurahan: 'Durian Payung' }

export default function WeatherBrief({ kecamatan, kelurahan }) {
  const [brief, setBrief] = useState(null)
  const [state, setState] = useState('loading')

  const area = kecamatan && kelurahan
    ? { kecamatan, kelurahan }
    : DEFAULT_AREA

  useEffect(() => {
    let active = true

    async function load() {
      const { adm4 } = resolveAdm4(area.kecamatan, area.kelurahan)
      const result = await fetchWeatherBrief(adm4, area.kelurahan)
      if (!active) return
      if (!result) {
        setState('gagal')
        return
      }
      setBrief(result)
      setState('siap')
    }

    load()
    return () => { active = false }
  }, [area.kecamatan, area.kelurahan])

  if (state === 'loading') return null
  if (state === 'gagal' || !brief) {
    return (
      <div className="weather-brief weather-brief-empty">
        <small>Prakiraan cuaca belum bisa diambil.</small>
      </div>
    )
  }

  const isAi = brief.source === 'ai'

  return (
    <div className="weather-brief">
      <div className="weather-brief-head">
        <small>
          {isAi ? <Sparkles size={12} /> : <CloudRain size={12} />}
          {isAi ? 'Analisis AI · 3 jam ke depan' : 'Aturan baseline · 3 jam ke depan'}
        </small>
        <span>{area.kelurahan}</span>
      </div>

      <div className="weather-brief-figures">
        <div>
          <strong>{Number(brief.curah_hujan_mm).toFixed(1)}</strong>
          <small>mm hujan</small>
        </div>
        <div>
          <strong>{Number(brief.suhu_celsius).toFixed(0)}°</strong>
          <small>{brief.kondisi_udara}</small>
        </div>
        <div>
          <strong>{Number(brief.debit_air_ms).toFixed(3)}</strong>
          <small><Waves size={11} /> m³/s</small>
        </div>
      </div>

      <p className="weather-brief-summary">{brief.ringkasan}</p>

      {brief.rekomendasi?.length > 0 && (
        <ul className="weather-brief-actions">
          {brief.rekomendasi.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  )
}
