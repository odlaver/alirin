import { isSupabaseConfigured, supabase } from './supabaseClient.js'
import { fetchRainfallMm } from './weatherService.js'

// P-3 · Konteks hulu-hilir.
//
// Proposal 1.4 mencatat warga Rajabasa mengenali hubungan banjir mereka dengan
// hujan deras di Kemiling, dan Kota Karang dengan kiriman dari Gunung Betung
// dan Batu Putu. Modul ini yang menerjemahkan pengetahuan itu menjadi angka:
// sebelum laporan dikirim, prakiraan BMKG untuk kecamatan hulu ikut diambil dan
// disimpan, sehingga basis data bisa memakainya saat menilai risiko.
//
// Tanpa langkah ini tabel cuaca per kecamatan hanya terisi kebetulan, dan
// faktor hulu praktis tidak pernah menyala.

const RELATION_TTL_MS = 10 * 60 * 1000
const WEATHER_FRESH_MS = 3 * 60 * 60 * 1000

// Nama kecamatan ditulis berbeda-beda ('Teluk Betung Barat' di aplikasi,
// 'Telukbetung Barat' di BMKG). Pencocokan mengabaikan spasi dan tanda baca.
function normalizeArea(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

let relationCache = { at: 0, rows: [] }

export function resetUpstreamCache() {
  relationCache = { at: 0, rows: [] }
}

export async function loadFlowRelations() {
  if (!isSupabaseConfigured) return []
  if (Date.now() - relationCache.at < RELATION_TTL_MS) return relationCache.rows

  const { data, error } = await supabase
    .from('area_flow_relations')
    .select('kecamatan_hulu, kecamatan_hilir, kekuatan, sumber')
    .eq('active', true)

  if (error) return relationCache.rows

  relationCache = { at: Date.now(), rows: data ?? [] }
  return relationCache.rows
}

export async function findUpstreamAreas(kecamatan) {
  const target = normalizeArea(kecamatan)
  if (!target) return []

  const relations = await loadFlowRelations()
  return relations
    .filter((row) => normalizeArea(row.kecamatan_hilir) === target)
    .sort((a, b) => b.kekuatan - a.kekuatan)
}

// Menyimpan hasil BMKG supaya laporan lain di hilir bisa memakainya. Diamkan
// kegagalannya: ini pelengkap, bukan syarat laporan bisa terkirim.
export async function saveAreaWeather(kecamatan, rainfallMm, description = null) {
  if (!isSupabaseConfigured) return false
  const area = String(kecamatan || '').trim()
  const rain = Number(rainfallMm)
  if (!area || !Number.isFinite(rain) || rain < 0 || rain > 500) return false

  const { error } = await supabase.from('area_weather').upsert(
    {
      kecamatan: area,
      rainfall_mm: rain,
      weather_desc: description,
      observed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'kecamatan' }
  )
  return !error
}

// Mengambil prakiraan untuk kecamatan hulu yang paling kuat relasinya, lalu
// menyimpannya. Dibatasi dua kecamatan supaya satu pengiriman laporan tidak
// berubah menjadi belasan permintaan ke BMKG.
export async function primeUpstreamWeather(kecamatan) {
  const upstream = (await findUpstreamAreas(kecamatan)).slice(0, 2)
  if (upstream.length === 0) return null

  const results = await Promise.all(
    upstream.map(async (relation) => {
      const forecast = await fetchRainfallMm(relation.kecamatan_hulu, '')
      if (!forecast) return null
      await saveAreaWeather(relation.kecamatan_hulu, forecast.rainfallMm, forecast.description)
      return {
        kecamatan: relation.kecamatan_hulu,
        rainfallMm: forecast.rainfallMm,
        kekuatan: relation.kekuatan,
        contribution: forecast.rainfallMm * (relation.kekuatan / 3),
      }
    })
  )

  const usable = results.filter(Boolean)
  if (usable.length === 0) return null

  // Yang dipakai adalah sumbangan terbesar, sama seperti alirin_rain_context.
  return usable.sort((a, b) => b.contribution - a.contribution)[0]
}

// Membaca konteks hulu yang sudah tersimpan, tanpa memanggil BMKG. Dipakai
// untuk menampilkan, bukan untuk menilai -- penilaian tetap di basis data.
export async function loadUpstreamContext(kecamatan) {
  if (!isSupabaseConfigured) return null

  const upstream = await findUpstreamAreas(kecamatan)
  if (upstream.length === 0) return null

  const { data, error } = await supabase
    .from('area_weather')
    .select('kecamatan, rainfall_mm, observed_at')
  if (error || !data?.length) return null

  const fresh = new Map()
  for (const row of data) {
    if (Date.now() - new Date(row.observed_at).getTime() > WEATHER_FRESH_MS) continue
    fresh.set(normalizeArea(row.kecamatan), row)
  }

  const candidates = upstream
    .map((relation) => {
      const weather = fresh.get(normalizeArea(relation.kecamatan_hulu))
      if (!weather) return null
      return {
        kecamatan: relation.kecamatan_hulu,
        rainfallMm: weather.rainfall_mm,
        kekuatan: relation.kekuatan,
        contribution: weather.rainfall_mm * (relation.kekuatan / 3),
      }
    })
    .filter(Boolean)

  if (candidates.length === 0) return null
  return candidates.sort((a, b) => b.contribution - a.contribution)[0]
}
