import { supabase } from './supabaseClient.js'
import { uploadReportPhoto } from './storageService.js'

const REPORT_SELECT = '*, report_photos(*), risk_breakdowns(*), report_status_history(*)'

function mapPhoto(row, index = 0) {
  return {
    id: row.id,
    url: row.url,
    name: row.name || `foto-${index + 1}.jpg`,
    type: row.type || 'image/jpeg',
    size: Number(row.size) || 0,
  }
}

export function mapSupabaseReportRow(row) {
  return {
    id: row.id,
    code: row.code,
    publicTrackingToken: row.public_tracking_token || row.id,
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

export async function fetchSupabaseReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Gagal mengambil data laporan dari Supabase.', { cause: error })
  }

  return (data ?? []).map(mapSupabaseReportRow)
}

async function syncReportPhotos(reportId, photos = []) {
  if (!photos.length) return []

  const uploadedPhotos = await Promise.all(photos.map(async (photo) => {
    if (!photo.url?.startsWith('data:')) return photo
    const publicUrl = await uploadReportPhoto(photo.url)
    return publicUrl ? { ...photo, url: publicUrl } : photo
  }))

  const { error } = await supabase.from('report_photos').insert(
    uploadedPhotos.map((photo) => ({
      report_id: reportId,
      url: photo.url,
      name: photo.name,
      type: photo.type,
      size: photo.size,
      kind: 'report',
    }))
  )

  if (error) throw new Error(error.message)
  return uploadedPhotos
}

async function syncRiskBreakdown(reportId, riskBreakdown = []) {
  if (!riskBreakdown.length) return

  const { error } = await supabase.from('risk_breakdowns').insert(
    riskBreakdown.map((item) => ({
      report_id: reportId,
      label: item.label,
      points: item.points,
      weight: item.weight,
      detail: item.detail,
    }))
  )

  if (error) throw new Error(error.message)
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
  const { data: inserted, error } = await supabase.from('reports').insert({
    code: report.code,
    category: report.category,
    description: report.description,
    address: report.address,
    lat: report.lat,
    lng: report.lng,
    kecamatan: report.kecamatan,
    kelurahan: report.kelurahan,
    status: report.status,
    severity: report.severity,
    risk_level: report.riskLevel,
    risk_score: report.riskScore,
    reporter_name: report.reporterName,
    reporter_contact: report.reporterContact,
    assigned_officer_id: report.assignedOfficerId || null,
    assigned_officer_name: report.assignedOfficerName || null,
    blocked_reason: report.blockedReason || null,
    field_notes: report.fieldNotes || [],
    completion_photos: report.completionPhotos || [],
    archived_at: report.archivedAt || null,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  }).select().single()

  if (error) throw new Error(error.message)
  if (!inserted) return report

  const syncedReport = {
    ...report,
    id: inserted.id,
    publicTrackingToken: inserted.public_tracking_token || inserted.id || report.publicTrackingToken,
  }
  syncedReport.photos = await syncReportPhotos(inserted.id, syncedReport.photos)
  await syncRiskBreakdown(inserted.id, syncedReport.riskBreakdown)
  await insertStatusHistory(inserted.id, syncedReport.statusHistory?.[0])

  return syncedReport
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

export function subscribeSupabaseReports(onChange) {
  let syncTimeout = null
  const channel = supabase
    .channel('public:reports')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(onChange, 3000)
    })
    .subscribe()

  return () => {
    if (syncTimeout) clearTimeout(syncTimeout)
    supabase.removeChannel?.(channel)
  }
}
