import { supabase } from './supabaseClient.js'
import { getActiveRole } from './authService.js'
import { uploadReportPhoto } from './storageService.js'
import { createReportCode } from '../domain/reports.js'

const REPORT_SELECT = '*, report_photos(*), risk_breakdowns(*), report_status_history(*)'
// View publik: kolom pribadi pelapor sudah tidak ikut, relasi anak sudah di-agregasi jsonb.
const PUBLIC_REPORT_VIEW = 'public_reports'

function mapPhoto(row, index = 0) {
  return {
    id: row.id,
    url: row.url,
    name: row.name || `foto-${index + 1}.jpg`,
    type: row.type || 'image/jpeg',
    size: Number(row.size) || 0,
  }
}

function mapSupabaseReportRow(row) {
  return {
    id: row.id,
    code: row.code,
    publicTrackingToken: row.public_tracking_token || '',
    category: row.category,
    description: row.description,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    kecamatan: row.kecamatan,
    kelurahan: row.kelurahan,
    status: row.status,
    severity: row.severity,
    riskLevel: row.risk_level,
    riskScore: row.risk_score,
    submissionMode: row.submission_mode || '',
    rainfallMm: Number.isFinite(Number(row.rainfall_mm)) ? Number(row.rainfall_mm) : null,
    reporterName: row.reporter_name,
    reporterContact: row.reporter_contact,
    assignedOfficerId: row.assigned_officer_id,
    assignedOfficerName: row.assigned_officer_name,
    blockedReason: row.blocked_reason || '',
    fieldNotes: Array.isArray(row.field_notes) ? row.field_notes : [],
    completionPhotos: Array.isArray(row.completion_photos) ? row.completion_photos : [],
    archivedAt: row.archived_at || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    photos: (row.report_photos || [])
      .filter((photo) => !photo.kind || photo.kind === 'report')
      .map(mapPhoto),
    riskBreakdown: (row.risk_breakdowns || []).map((item) => ({
      id: item.id,
      label: item.label,
      points: item.points,
      weight: item.weight,
      detail: item.detail,
    })),
    statusHistory: (row.report_status_history || [])
      .map((item) => ({
        status: item.status,
        actor: item.actor,
        note: item.note || '',
        at: item.at,
      }))
      .sort((a, b) => new Date(a.at) - new Date(b.at)),
  }
}

async function isStaffSession() {
  try {
    return Boolean(await getActiveRole())
  } catch {
    return false
  }
}

export async function fetchSupabaseReports() {
  // Warga (anon) tidak punya policy SELECT pada tabel reports, jadi peta publik
  // membaca lewat view public_reports yang bebas data pribadi pelapor.
  const isStaff = await isStaffSession()
  const query = isStaff
    ? supabase.from('reports').select(REPORT_SELECT)
    : supabase.from(PUBLIC_REPORT_VIEW).select('*')

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Gagal mengambil data laporan dari Supabase.', { cause: error })
  }

  return (data ?? []).map(mapSupabaseReportRow)
}

export async function fetchSupabaseReportByTrackingToken(token) {
  const trackingToken = String(token || '').trim()
  if (!trackingToken) return null

  const { data, error } = await supabase.rpc('get_report_by_tracking_token', {
    p_token: trackingToken,
  })

  if (error) {
    throw new Error(error.message || 'Gagal mengambil status laporan dari Supabase.', { cause: error })
  }

  return data ? mapSupabaseReportRow(data) : null
}

async function insertReportPhotos(reportId, photos = []) {
  if (!photos.length) return []

  if (photos.some((photo) => String(photo.url || '').startsWith('data:'))) {
    throw new Error('Foto laporan belum memiliki URL Storage yang valid.')
  }

  const { error } = await supabase.from('report_photos').insert(
    photos.map((photo) => ({
      report_id: reportId,
      url: photo.url,
      name: photo.name,
      type: photo.type,
      size: photo.size,
      kind: 'report',
    }))
  )

  if (error) throw new Error(error.message)
  return photos
}

async function syncInlinePhotos(photos = [], label = 'foto') {
  if (!photos.length) return []

  const uploadedPhotos = await Promise.all(photos.map(async (photo) => {
    if (!photo.url?.startsWith('data:')) return photo
    const publicUrl = await uploadReportPhoto(photo)
    return { ...photo, url: publicUrl }
  }))

  if (uploadedPhotos.some((photo) => String(photo.url || '').startsWith('data:'))) {
    throw new Error(`${label} belum memiliki URL Storage yang valid.`)
  }

  return uploadedPhotos
}

async function insertStatusHistory(reportId, historyItem) {
  if (!historyItem) return

  const { error } = await supabase.from('report_status_history').insert({
    report_id: reportId,
    status: historyItem.status,
    actor: historyItem.actor,
    note: historyItem.note,
    at: historyItem.at,
  })

  if (error) throw new Error(error.message)
}

export async function insertSupabaseReport(report) {
  const reportPhotos = await syncInlinePhotos(report.photos || [], 'foto laporan')
  const completionPhotos = await syncInlinePhotos(report.completionPhotos || [], 'foto penyelesaian')

  let currentReport = { ...report }
  let attempts = 0
  const maxAttempts = 5
  let lastError = null

  while (attempts < maxAttempts) {
    const { error } = await supabase.from('reports').insert({
      id: currentReport.id,
      code: currentReport.code,
      public_tracking_token: currentReport.publicTrackingToken,
      category: currentReport.category,
      description: currentReport.description,
      address: currentReport.address,
      lat: currentReport.lat,
      lng: currentReport.lng,
      kecamatan: currentReport.kecamatan,
      kelurahan: currentReport.kelurahan,
      status: currentReport.status,
      severity: currentReport.severity,
      // risk_level & risk_score dikirim sebagai nilai sementara; trigger
      // alirin_apply_risk di Supabase selalu menimpanya dengan hasil resmi.
      risk_level: currentReport.riskLevel,
      risk_score: currentReport.riskScore,
      submission_mode: currentReport.submissionMode || null,
      rainfall_mm: currentReport.rainfallMm ?? null,
      reporter_name: currentReport.reporterName,
      reporter_contact: currentReport.reporterContact,
      assigned_officer_id: currentReport.assignedOfficerId || null,
      assigned_officer_name: currentReport.assignedOfficerName || null,
      blocked_reason: currentReport.blockedReason || null,
      field_notes: currentReport.fieldNotes || [],
      completion_photos: completionPhotos,
      archived_at: currentReport.archivedAt || null,
      created_at: currentReport.createdAt,
      updated_at: currentReport.updatedAt,
    })

    if (!error) {
      const syncedReport = {
        ...currentReport,
        completionPhotos,
      }
      // risk_breakdowns diisi trigger alirin_write_breakdown, bukan klien.
      syncedReport.photos = await insertReportPhotos(currentReport.id, reportPhotos)
      await insertStatusHistory(currentReport.id, syncedReport.statusHistory?.[0])

      return syncedReport
    }

    lastError = error
    const isCodeConflict = error.code === '23505' || 
                           error.message?.includes('reports_code_key') || 
                           error.message?.includes('duplicate key value')

    if (isCodeConflict && attempts < maxAttempts - 1) {
      attempts++
      try {
        const createdAtDate = new Date(currentReport.createdAt)
        const year = createdAtDate.getFullYear()
        const yearPrefix = `ALR-${year}-`
        
        const { data: latestData, error: latestError } = await supabase
          .from('reports')
          .select('code')
          .like('code', `${yearPrefix}%`)
          .order('code', { ascending: false })
          .limit(1)

        if (!latestError && latestData && latestData.length > 0) {
          const latestCode = latestData[0].code
          currentReport.code = createReportCode([{ code: latestCode }], createdAtDate)
        } else {
          currentReport.code = createReportCode([{ code: currentReport.code }], createdAtDate)
        }
      } catch {
        currentReport.code = createReportCode([{ code: currentReport.code }], new Date(currentReport.createdAt))
      }
    } else {
      break
    }
  }

  throw new Error(lastError?.message || 'Gagal menyimpan laporan ke database.')
}

export async function updateSupabaseReportStatus(reportId, status, historyItem, archivedAt = '') {
  const { error: updateError } = await supabase
    .from('reports')
    .update({
      status,
      archived_at: archivedAt || null,
      updated_at: historyItem?.at || new Date().toISOString(),
    })
    .eq('id', reportId)

  if (updateError) throw new Error(updateError.message)
  await insertStatusHistory(reportId, historyItem)
}

export async function assignSupabaseReportOfficer(reportId, report, historyItem) {
  const { error: updateError } = await supabase
    .from('reports')
    .update({
      status: report.status,
      assigned_officer_id: report.assignedOfficerId,
      assigned_officer_name: report.assignedOfficerName,
      updated_at: report.updatedAt,
    })
    .eq('id', reportId)

  if (updateError) throw new Error(updateError.message)
  await insertStatusHistory(reportId, historyItem)
}

export async function updateSupabaseFieldProgress(reportId, report, historyItem) {
  const completionPhotos = await syncInlinePhotos(report.completionPhotos || [], 'foto penyelesaian')

  const { error: updateError } = await supabase
    .from('reports')
    .update({
      status: report.status,
      blocked_reason: report.blockedReason || null,
      field_notes: report.fieldNotes || [],
      completion_photos: completionPhotos,
      archived_at: report.archivedAt || null,
      updated_at: report.updatedAt,
    })
    .eq('id', reportId)

  if (updateError) throw new Error(updateError.message)
  await insertStatusHistory(reportId, historyItem)

  return {
    ...report,
    completionPhotos,
  }
}

const PUBLIC_REFRESH_INTERVAL = 60000

export function subscribeSupabaseReports(onChange) {
  let syncTimeout = null
  let publicPoll = null
  let closed = false
  const channel = supabase
    .channel('public:reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(onChange, 3000)
    })
    .subscribe()

  // Realtime postgres_changes tunduk pada RLS, jadi anon tidak menerima event apa pun.
  // Peta publik tetap ikut perkembangan lewat polling ringan.
  void isStaffSession().then((isStaff) => {
    if (closed || isStaff) return
    publicPoll = setInterval(onChange, PUBLIC_REFRESH_INTERVAL)
  })

  return () => {
    closed = true
    if (syncTimeout) clearTimeout(syncTimeout)
    if (publicPoll) clearInterval(publicPoll)
    supabase.removeChannel?.(channel)
  }
}
