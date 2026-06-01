import { supabase } from './supabaseClient.js'

export async function uploadReportPhoto(base64Url) {
  try {
    const res = await fetch(base64Url)
    const blob = await res.blob()
    const fileName = `laporan-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const { error: uploadErr } = await supabase.storage.from('reports').upload(fileName, blob)
    if (uploadErr) throw uploadErr
    const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName)
    return publicUrl
  } catch (err) {
    console.warn('Gagal unggah foto ke Supabase Storage, fallback ke URL asal:', err)
    return null
  }
}
