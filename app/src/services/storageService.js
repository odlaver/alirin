import { supabase } from './supabaseClient.js'

export const REPORT_PHOTO_BUCKET = 'reports'

const MIME_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function getPhotoMimeType(photo) {
  const fromType = String(photo?.type || '').trim().toLowerCase()
  if (fromType.startsWith('image/')) return fromType
  const match = String(photo?.url || photo || '').match(/^data:([^;,]+)[;,]/)
  return match?.[1]?.toLowerCase() || 'image/jpeg'
}

function getPhotoExtension(photo, mimeType) {
  const fromName = String(photo?.name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  if (['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName
  return MIME_EXTENSION[mimeType] || 'jpg'
}

function createPhotoPath(photo, mimeType) {
  const extension = getPhotoExtension(photo, mimeType)
  const randomPart = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
  return `report-photos/${Date.now()}-${randomPart}.${extension}`
}

function buildUploadError(error) {
  const message = error?.message || String(error || 'Unknown error')
  return new Error(
    `${message} Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY valid, bucket Storage "${REPORT_PHOTO_BUCKET}" sudah ada, dan policy upload publik untuk folder report-photos aktif.`
  )
}

export async function uploadReportPhoto(photo) {
  const dataUrl = typeof photo === 'string' ? photo : photo?.url
  if (!String(dataUrl || '').startsWith('data:image/')) {
    throw new Error('Foto laporan harus berupa data URL gambar sebelum diunggah.')
  }

  try {
    const mimeType = getPhotoMimeType(photo)
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const filePath = createPhotoPath(photo, mimeType)
    const bucket = supabase.storage.from(REPORT_PHOTO_BUCKET)
    const { error: uploadError } = await bucket.upload(filePath, blob, {
      contentType: blob.type || mimeType,
      upsert: false,
    })

    if (uploadError) throw uploadError

    const { data } = bucket.getPublicUrl(filePath)
    if (!data?.publicUrl) throw new Error('Supabase tidak mengembalikan public URL foto.')
    return data.publicUrl
  } catch (error) {
    throw buildUploadError(error)
  }
}
