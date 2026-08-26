// Klien Groq bersama untuk seluruh Edge Function ALIRIN.
//
// Kuncinya hanya ada di sini, sebagai secret milik project. Sebelumnya kunci
// ditanam ke APK lewat BuildConfig dan bisa diekstrak siapa pun yang mengunduh
// aplikasinya (temuan D-4 laporan audit). Memindahkannya ke sisi server adalah
// setengah dari alasan P-1 dikerjakan; setengah lainnya adalah supaya web ikut
// mendapat AI yang selama ini hanya ada di mobile.

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

// Model yang disebut proposal, llama-3.1-8b-instant, sudah dimatikan Groq pada
// 16 Agustus 2026. Penggantinya dipasang sebagai bawaan dan tetap bisa diubah
// lewat secret tanpa menyentuh kode.
const DEFAULT_MODEL = 'openai/gpt-oss-20b'

// Model gpt-oss memancarkan bidang "reasoning" yang ikut memakan anggaran token
// sebelum JSON-nya selesai ditulis. Dengan effort "low" pemakaian turun dari
// sekitar 1050 ke 240 token dan jawabannya tetap lengkap.
const DEFAULT_EFFORT = 'low'
const MAX_TOKENS = 1024
const TIMEOUT_MS = 20_000

export class GroqUnavailable extends Error {}

export function groqConfigured(): boolean {
  return Boolean(Deno.env.get('GROQ_API_KEY'))
}

export function groqModel(): string {
  return Deno.env.get('GROQ_MODEL') || DEFAULT_MODEL
}

export async function askGroqJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const key = Deno.env.get('GROQ_API_KEY')
  if (!key) throw new GroqUnavailable('GROQ_API_KEY belum dipasang')

  const effort = Deno.env.get('GROQ_REASONING_EFFORT') ?? DEFAULT_EFFORT
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: groqModel(),
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' },
        ...(effort ? { reasoning_effort: effort } : {}),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      // Alasannya dicetak apa adanya. Sebelumnya semua kegagalan ditelan
      // runCatching, sehingga kunci salah, model yang sudah dimatikan, dan
      // "memang belum dikonfigurasi" tidak bisa dibedakan.
      throw new Error(`Groq HTTP ${response.status}: ${body.slice(0, 300)}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error(`Groq menjawab tanpa isi (finish_reason=${payload?.choices?.[0]?.finish_reason})`)
    }

    return JSON.parse(content) as T
  } finally {
    clearTimeout(timeout)
  }
}
