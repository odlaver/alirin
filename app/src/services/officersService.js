import { supabase, isSupabaseConfigured } from './supabaseClient.js'
import { DEMO_OFFICERS } from '../data/officers.js'

// Daftar petugas dibaca dari tabel public.officers, bukan dari konstanta di
// kode. Sebelumnya keduanya hidup terpisah, sehingga menambah petugas berarti
// menyunting tiga tempat dan reports.assigned_officer_id tidak punya rujukan.
let cache = null
let inflight = null

function mapOfficerRow(row) {
  return {
    id: row.id,
    name: row.name,
    area: row.area || '',
    phone: row.phone || '',
    active: row.active !== false,
  }
}

export async function loadOfficers({ force = false } = {}) {
  if (cache && !force) return cache
  if (!isSupabaseConfigured) {
    cache = DEMO_OFFICERS
    return cache
  }
  if (inflight && !force) return inflight

  inflight = (async () => {
    const { data, error } = await supabase
      .from('officers')
      .select('id, name, area, phone, active')
      .order('name')

    if (error || !data?.length) {
      // Tanpa sesi staff, RLS menutup tabel officers. Daftar bawaan dipakai
      // supaya layar penugasan tetap terisi.
      cache = DEMO_OFFICERS
      return cache
    }

    cache = data.map(mapOfficerRow).filter((officer) => officer.active)
    return cache
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function getCachedOfficers() {
  return cache ?? DEMO_OFFICERS
}

export function findOfficerById(officerId) {
  return getCachedOfficers().find((officer) => officer.id === officerId) ?? null
}
