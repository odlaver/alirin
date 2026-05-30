export const MAX_REPORT_PHOTOS = 3
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Gagal membaca gambar.'))
    image.src = dataUrl
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsDataURL(file)
  })
}

function createPhotoId() {
  if (globalThis.crypto?.randomUUID) {
    return `photo-${globalThis.crypto.randomUUID()}`
  }
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getDataUrlMimeType(dataUrl, fallback = 'image/jpeg') {
  const match = String(dataUrl).match(/^data:([^;,]+)[;,]/)
  return match?.[1] ?? fallback
}

export async function compressImageFile(file, maxWidth = 900, quality = 0.72) {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const scale = Math.min(1, maxWidth / image.width)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Browser tidak mendukung kompresi gambar.')
  context.drawImage(image, 0, 0, width, height)

  const mimeType = file.type === 'image/png' ? 'image/jpeg' : 'image/webp'
  return canvas.toDataURL(mimeType, quality)
}

export async function prepareReportPhoto(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} bukan file gambar.`)
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error(`${file.name} lebih besar dari 5 MB.`)
  }

  const url = await compressImageFile(file)
  return {
    id: createPhotoId(),
    name: file.name,
    type: getDataUrlMimeType(url, file.type),
    size: file.size,
    url,
  }
}
