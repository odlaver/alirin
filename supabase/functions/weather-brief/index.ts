import { GroqUnavailable, askGroqJson, groqConfigured, groqModel } from '../_shared/groq.ts'
import { jsonResponse, preflight, readJson } from '../_shared/http.ts'
import { describeRainfall, estimateDischarge, fetchForecast } from '../_shared/rainfall.ts'

// P-1 · Kartu prakiraan yang dulunya hanya ada di mobile.
//
// Dua hal sekaligus: kunci Groq tidak lagi ikut tertanam di APK, dan web
// akhirnya punya konteks cuaca yang sama dengan yang dilihat warga di mobile.
// Sebelumnya admin di web tidak melihat cuaca sama sekali.
//
// Baseline berbasis aturan tetap dihitung dan dikembalikan bila Groq tidak
// tersedia, sesuai Proposal 4.3.4. Yang tidak boleh terjadi: kartu berlabel
// "Analisis AI" yang isinya sebenarnya if-else.

interface Payload {
  adm4?: string
  kelurahan?: string
}

interface Brief {
  kondisi_udara: string
  suhu_celsius: number
  curah_hujan_mm: number
  debit_air_ms: number
  ringkasan: string
  rekomendasi: string[]
}

const SYSTEM_PROMPT = `Kamu asisten prediksi cuaca + risiko banjir untuk aplikasi drainase kota Bandar Lampung.
Output WAJIB JSON valid persis dengan kunci:
kondisi_udara (string ringkas), suhu_celsius (number), curah_hujan_mm (number, 3 jam ke depan),
debit_air_ms (number - perkiraan debit air drainase mikro dalam m3/s berdasarkan curah hujan),
ringkasan (string <= 140 char, Bahasa Indonesia, jelas + actionable),
rekomendasi (array 2-4 string, masing-masing <= 60 char, tindakan konkret untuk warga/petugas).
Estimasi debit pakai rumus sederhana: debit_air_ms = curah_hujan_mm * 0.0015 * faktor_area.
Jika curah_hujan_mm >= 5, ringkasan harus mengandung peringatan genangan dan rekomendasi
harus berisi langkah mitigasi genangan.`

function baselineBrief(slot: { rainfallMm: number; temperature: number; description: string }, area: string): Brief {
  const label = describeRainfall(slot.rainfallMm)
  const waspada = slot.rainfallMm >= 5

  return {
    kondisi_udara: slot.description,
    suhu_celsius: Number(slot.temperature.toFixed(1)),
    curah_hujan_mm: Number(slot.rainfallMm.toFixed(1)),
    debit_air_ms: estimateDischarge(slot.rainfallMm),
    ringkasan: waspada
      ? `${label} di ${area}, ${slot.rainfallMm.toFixed(1)} mm dalam 3 jam. Waspada genangan di saluran yang tersumbat.`
      : `${label} di ${area}, ${slot.rainfallMm.toFixed(1)} mm dalam 3 jam. Risiko genangan rendah.`,
    rekomendasi: waspada
      ? ['Bersihkan sampah di mulut got', 'Periksa saluran yang mudah tersumbat', 'Laporkan genangan yang mulai naik']
      : ['Periksa saluran sebelum hujan berikutnya', 'Laporkan sumbatan yang terlihat'],
  }
}

Deno.serve(async (request) => {
  const early = preflight(request)
  if (early) return early

  const body = await readJson<Payload>(request)
  const adm4 = String(body?.adm4 ?? '').trim()
  if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(adm4)) {
    return jsonResponse({ error: 'adm4 wajib diisi dengan format 18.71.XX.YYYY.' }, 400)
  }

  const slot = await fetchForecast(adm4)
  if (!slot) return jsonResponse({ error: 'BMKG tidak terjangkau.' }, 502)

  const area = String(body?.kelurahan ?? '').trim() || 'wilayah ini'
  const baseline = baselineBrief(slot, area)

  if (!groqConfigured()) {
    return jsonResponse({ source: 'baseline', ...baseline })
  }

  const userPrompt = `Wilayah: ${area}, Bandar Lampung.
3 jam ke depan dari BMKG:
- cuaca: ${slot.description}
- suhu: ${slot.temperature.toFixed(1)} derajat C
- kelembaban: ${slot.humidity.toFixed(0)} %
- curah hujan kumulatif: ${slot.rainfallMm.toFixed(1)} mm
Tugas: kembalikan prediksi JSON sesuai schema.`

  try {
    const ai = await askGroqJson<Brief>(SYSTEM_PROMPT, userPrompt)
    return jsonResponse({
      source: 'ai',
      model: groqModel(),
      kondisi_udara: String(ai.kondisi_udara ?? slot.description),
      suhu_celsius: Number(ai.suhu_celsius ?? slot.temperature),
      // Angka BMKG yang dipakai, bukan angka yang ditulis ulang model.
      curah_hujan_mm: Number(slot.rainfallMm.toFixed(1)),
      debit_air_ms: Number(ai.debit_air_ms ?? baseline.debit_air_ms),
      ringkasan: String(ai.ringkasan ?? baseline.ringkasan).slice(0, 200),
      rekomendasi: Array.isArray(ai.rekomendasi)
        ? ai.rekomendasi.map((item) => String(item).slice(0, 90)).slice(0, 4)
        : baseline.rekomendasi,
    })
  } catch (err) {
    if (!(err instanceof GroqUnavailable)) {
      console.error(`weather-brief gagal (model=${groqModel()}):`, err)
    }
    return jsonResponse({ source: 'baseline', ...baseline })
  }
})
