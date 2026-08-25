import { resolveAdm4 } from '../data/bandarLampungAreas.js'

// Klien prakiraan BMKG untuk web. Sebelumnya integrasi cuaca hanya ada di
// mobile dan tidak pernah masuk ke perhitungan risiko; sekarang keduanya
// memakai masukan yang sama, yaitu faktor Cuaca 25% pada Proposal 4.4.
const BMKG_ENDPOINT = 'https://api.bmkg.go.id/publik/prakiraan-cuaca'

// BMKG mengembalikan slot berdurasi 3 jam. "Prakiraan 3 jam ke depan" pada
// Proposal 4.4 karena itu berarti SATU slot pertama, bukan tiga slot
// (tiga slot = 9 jam).
const FORECAST_SLOTS = 1
const REQUEST_TIMEOUT_MS = 8000

function flattenForecastHours(payload) {
  const blocks = Array.isArray(payload?.data) ? payload.data : []
  const nested = blocks[0]?.cuaca
  if (!Array.isArray(nested)) return []
  return nested.flat().filter((hour) => hour && typeof hour === 'object')
}

// Akumulasi curah hujan 3 jam ke depan, satuan mm.
export function sumRainfallMm(payload, slots = FORECAST_SLOTS) {
  const window = flattenForecastHours(payload).slice(0, slots)
  if (!window.length) return null
  return window.reduce((total, slot) => total + (Number(slot.tp) || 0), 0)
}

export function describeForecast(payload) {
  const window = flattenForecastHours(payload).slice(0, FORECAST_SLOTS)
  const descriptions = window.map((slot) => slot.weather_desc).filter(Boolean)
  return [...new Set(descriptions)].join(', ')
}

// Mengembalikan null bila BMKG tidak terjangkau. Nilai null bermakna
// "tidak diketahui" di mesin skor, bukan "tidak hujan": bobot cuaca dialihkan
// ke faktor lain, bukan dihitung nol.
export async function fetchRainfallMm(kecamatan, kelurahan) {
  const { adm4, precision } = resolveAdm4(kecamatan, kelurahan)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BMKG_ENDPOINT}?adm4=${encodeURIComponent(adm4)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const payload = await response.json()
    const rainfallMm = sumRainfallMm(payload)
    if (rainfallMm === null) return null

    return {
      rainfallMm,
      adm4,
      precision,
      description: describeForecast(payload),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
