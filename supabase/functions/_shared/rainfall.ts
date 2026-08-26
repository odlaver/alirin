// Kelas intensitas hujan BMKG. Kembar dengan describeRainfall di web,
// RiskEngine.describeRainfall di mobile, dan alirin_rainfall_label di Postgres.
// Empat salinan bukan hal bagus, tetapi lebih baik daripada empat aturan
// berbeda yang diam-diam menyimpang.
export function describeRainfall(mm: number | null): string {
  if (mm === null || !Number.isFinite(mm) || mm < 0) return 'Data BMKG belum tersedia'
  if (mm === 0) return 'Tidak hujan'
  if (mm < 1) return 'Gerimis'
  if (mm < 5) return 'Hujan ringan'
  if (mm < 10) return 'Hujan sedang'
  if (mm < 20) return 'Hujan lebat'
  return 'Hujan sangat lebat'
}

const BMKG_ENDPOINT = 'https://api.bmkg.go.id/publik/prakiraan-cuaca'

export interface ForecastSlot {
  rainfallMm: number
  temperature: number
  humidity: number
  description: string
}

// BMKG mengembalikan slot berdurasi 3 jam. "Prakiraan 3 jam ke depan" pada
// Proposal 4.4 karena itu berarti SATU slot pertama, bukan tiga slot
// (tiga slot = 9 jam).
export async function fetchForecast(adm4: string): Promise<ForecastSlot | null> {
  try {
    const response = await fetch(`${BMKG_ENDPOINT}?adm4=${encodeURIComponent(adm4)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const payload = await response.json()
    const slot = payload?.data?.[0]?.cuaca?.flat?.()?.[0]
    if (!slot) return null

    return {
      rainfallMm: Number(slot.tp ?? 0),
      temperature: Number(slot.t ?? 28),
      humidity: Number(slot.hu ?? 80),
      description: String(slot.weather_desc ?? '-'),
    }
  } catch {
    return null
  }
}

// Perkiraan debit drainase mikro, rumus sederhana yang sama dengan versi mobile.
export function estimateDischarge(rainfallMm: number): number {
  return Number((rainfallMm * 0.0015).toFixed(4))
}
