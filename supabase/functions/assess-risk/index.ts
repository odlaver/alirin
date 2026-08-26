import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GroqUnavailable, askGroqJson, groqConfigured, groqModel } from '../_shared/groq.ts'
import { jsonResponse, preflight, readJson } from '../_shared/http.ts'
import { describeRainfall } from '../_shared/rainfall.ts'

// P-1 · AI sebagai penilai risiko, berdampingan dengan baseline.
//
// Proposal 4.3.4 menjanjikan AI membaca pola dari faktor yang sama lalu
// dibandingkan dengan baseline dan verifikasi lapangan. Kunci pertahanannya ada
// pada kata "dibandingkan": skor baseline TIDAK disentuh sama sekali di sini.
// Trigger alirin_apply_risk tetap satu-satunya yang menulis risk_score, dan
// urutan penanganan tetap memakai angka itu. Yang ditulis fungsi ini hanya
// kolom ai_*, sehingga keduanya bisa disandingkan dan diaudit -- termasuk saat
// AI keliru.
//
// Kalau suatu saat ai_risk_score dipakai untuk mengurutkan penanganan, sistem
// kehilangan kemampuan menjawab "kenapa skornya segini" dengan pasti. Jangan.

interface Payload {
  report_id?: string
}

interface Assessment {
  skor_risiko: number
  alasan: string
  rekomendasi: string[]
}

// Penilaian ulang dibatasi supaya satu laporan tidak bisa dipakai menguras
// kuota Groq dengan panggilan berulang.
const COOLDOWN_MS = 10 * 60 * 1000

const SYSTEM_PROMPT = `Kamu penilai risiko drainase mikro untuk Kota Bandar Lampung.
Kamu menerima satu laporan warga beserta konteksnya, lalu menilai risikonya.

Output WAJIB JSON valid persis dengan kunci:
  skor_risiko (number 0-100, makin tinggi makin mendesak ditangani),
  alasan (string <= 220 char, Bahasa Indonesia, sebutkan faktor yang paling menentukan),
  rekomendasi (array 2-4 string, masing-masing <= 70 char, tindakan konkret untuk petugas lapangan).

Pedoman penilaian:
- Keparahan laporan dan dampak ke fasilitas publik adalah pertimbangan terbesar.
- Titik yang berulang bermasalah lebih mendesak daripada kejadian pertama.
- Hujan di wilayah hulu ikut menaikkan risiko walau di lokasi laporan sedang cerah.
- Laporan tanpa foto dan tanpa deskripsi jelas belum tentu ringan, tetapi
  keyakinannya lebih rendah; sebutkan itu di alasan bila relevan.
Jangan mengarang fakta yang tidak ada di konteks.`

const url = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (request) => {
  const early = preflight(request)
  if (early) return early

  const body = await readJson<Payload>(request)
  const reportId = String(body?.report_id ?? '').trim()
  if (!reportId) return jsonResponse({ error: 'report_id wajib diisi.' }, 400)

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: report, error } = await supabase
    .from('reports')
    .select('id, code, category, severity, description, kecamatan, kelurahan, lat, lng, ' +
      'risk_score, risk_level, rainfall_mm, upstream_kecamatan, upstream_rainfall_mm, ' +
      'ai_risk_score, ai_risk_reason, ai_recommendations, ai_model, ai_assessed_at, created_at')
    .eq('id', reportId)
    .maybeSingle()

  if (error) return jsonResponse({ error: error.message }, 500)
  if (!report) return jsonResponse({ error: 'Laporan tidak ditemukan.' }, 404)

  const assessedAt = report.ai_assessed_at ? Date.parse(report.ai_assessed_at) : 0
  if (assessedAt && Date.now() - assessedAt < COOLDOWN_MS) {
    return jsonResponse({
      source: 'cache',
      baseline_score: report.risk_score,
      ai_risk_score: report.ai_risk_score,
      alasan: report.ai_risk_reason,
      rekomendasi: report.ai_recommendations ?? [],
      model: report.ai_model,
    })
  }

  if (!groqConfigured()) {
    // Bukan kegagalan: baseline berbasis aturan memang jalur resmi selama
    // kunci belum dipasang (Proposal 4.3.4).
    return jsonResponse({
      source: 'baseline',
      baseline_score: report.risk_score,
      alasan: 'GROQ_API_KEY belum dipasang di project. Penilaian memakai baseline berbasis aturan.',
    })
  }

  // Faktor yang sama dengan yang dibaca baseline. AI tidak boleh menilai dari
  // masukan yang berbeda -- kalau berbeda, perbandingan keduanya tidak berarti.
  const { data: breakdown } = await supabase
    .from('risk_breakdowns')
    .select('factor, label, points, weight, detail')
    .eq('report_id', reportId)

  const { count: historyCount } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('kelurahan', report.kelurahan)
    .neq('id', reportId)
    .neq('status', 'ditolak')
    .gte('created_at', new Date(Date.parse(report.created_at) - 180 * 86_400_000).toISOString())
    .lte('created_at', report.created_at)

  const hujanLokal = report.rainfall_mm === null ? 'tidak diketahui' : `${report.rainfall_mm} mm`
  const hujanHulu = report.upstream_kecamatan
    ? `${report.upstream_rainfall_mm} mm di ${report.upstream_kecamatan} (${describeRainfall(report.upstream_rainfall_mm)})`
    : 'tidak ada kiriman dari hulu yang tercatat'

  const faktor = (breakdown ?? [])
    .map((item) => `- ${item.label}: ${item.points}/${item.weight} - ${item.detail}`)
    .join('\n')

  const userPrompt = `Laporan ${report.code}
- kategori: ${report.category}
- keparahan menurut pelapor: ${report.severity}
- deskripsi: ${report.description || '(kosong)'}
- lokasi: ${report.kelurahan}, ${report.kecamatan}
- laporan lain di kelurahan yang sama dalam 180 hari: ${historyCount ?? 0}
- curah hujan 3 jam di lokasi: ${hujanLokal}
- curah hujan di wilayah hulu: ${hujanHulu}

Rincian skor baseline (total ${report.risk_score}, kelas ${report.risk_level}):
${faktor || '(rincian belum tersedia)'}

Tugas: kembalikan penilaian JSON sesuai schema.`

  let assessment: Assessment
  try {
    assessment = await askGroqJson<Assessment>(SYSTEM_PROMPT, userPrompt)
  } catch (err) {
    if (err instanceof GroqUnavailable) {
      return jsonResponse({ source: 'baseline', baseline_score: report.risk_score, alasan: err.message })
    }
    // Kegagalan tidak menghalangi apa pun: baseline sudah tersimpan dan tetap
    // yang dipakai mengurutkan penanganan.
    console.error(`assess-risk gagal untuk ${report.code} (model=${groqModel()}):`, err)
    return jsonResponse({
      source: 'baseline',
      baseline_score: report.risk_score,
      error: String(err instanceof Error ? err.message : err),
    }, 200)
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(assessment.skor_risiko))))
  const rekomendasi = Array.isArray(assessment.rekomendasi)
    ? assessment.rekomendasi.map((item) => String(item).slice(0, 120)).slice(0, 4)
    : []

  const { error: writeError } = await supabase
    .from('reports')
    .update({
      ai_risk_score: Number.isFinite(score) ? score : null,
      ai_risk_reason: String(assessment.alasan ?? '').slice(0, 400),
      ai_recommendations: rekomendasi,
      ai_model: groqModel(),
      ai_assessed_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (writeError) return jsonResponse({ error: writeError.message }, 500)

  return jsonResponse({
    source: 'ai',
    baseline_score: report.risk_score,
    ai_risk_score: score,
    selisih: score - Number(report.risk_score),
    alasan: assessment.alasan,
    rekomendasi,
    model: groqModel(),
  })
})
