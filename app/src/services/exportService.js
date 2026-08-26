import {
  getReports,
  isArchivedReport,
} from './reportsStore.js'
import { SEVERITY_LABEL, getReportTitle } from '../domain/reports.js'
import { STATUS_LABEL } from '../domain/status.js'

// P-9 · Ekspor untuk koordinasi lintas instansi.
//
// CSV sudah ada. Yang belum: format yang berguna bagi mitra yang disebut
// Proposal §5.3 -- BPBD, Damkar, Dinas PU, BBWS Mesuji Sekampung.
//   - GeoJSON untuk dibuka di QGIS / Google Earth / peta instansi.
//   - Rekap per kecamatan sebagai halaman siap cetak (PDF lewat "Cetak").
//
// Koordinat di GeoJSON dibulatkan ke 3 desimal (±110 m), sama dengan view
// publik: cukup untuk pemetaan risiko kota, tidak cukup untuk menunjuk rumah.
// Ini menjaga janji privasi Proposal §5.4 tetap konsisten di jalur ekspor.

const COORD_DECIMALS = 3

function roundCoord(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  const factor = 10 ** COORD_DECIMALS
  return Math.round(num * factor) / factor
}

// ---- GeoJSON -------------------------------------------------------------

export function createReportsGeoJson(reports = getReports()) {
  const features = reports
    .map((report) => {
      const lng = roundCoord(report.lng)
      const lat = roundCoord(report.lat)
      if (lng === null || lat === null) return null

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          kode: report.code,
          status: STATUS_LABEL[report.status] ?? report.status,
          prioritas: report.riskLevel,
          skor: report.riskScore,
          kategori: getReportTitle(report),
          keparahan: SEVERITY_LABEL[report.severity] ?? report.severity,
          kecamatan: report.kecamatan || null,
          kelurahan: report.kelurahan || null,
          curah_hujan_mm: report.rainfallMm ?? null,
          hulu_kecamatan: report.upstreamKecamatan || null,
          dibuat: report.createdAt,
          // Sengaja TANPA nama/kontak pelapor: ekspor lintas instansi tidak
          // membawa data pribadi.
        },
      }
    })
    .filter(Boolean)

  return {
    type: 'FeatureCollection',
    metadata: {
      sumber: 'ALIRIN - Peta Risiko Drainase Mikro Kota Bandar Lampung',
      dibuat: new Date().toISOString(),
      jumlah: features.length,
      catatan: `Koordinat dibulatkan ke ${COORD_DECIMALS} desimal untuk privasi pelapor.`,
    },
    features,
  }
}

// ---- Rekap per kecamatan (HTML siap cetak) --------------------------------

function summarizeByKecamatan(reports) {
  const map = new Map()
  for (const report of reports) {
    const key = report.kecamatan || '(tanpa kecamatan)'
    if (!map.has(key)) {
      map.set(key, { kecamatan: key, total: 0, kritis: 0, tinggi: 0, aktif: 0, selesai: 0, skorTotal: 0 })
    }
    const row = map.get(key)
    row.total += 1
    row.skorTotal += Number(report.riskScore) || 0
    if (report.riskLevel === 'Kritis') row.kritis += 1
    if (report.riskLevel === 'Tinggi') row.tinggi += 1
    if (isArchivedReport(report)) row.selesai += 1
    else row.aktif += 1
  }
  return [...map.values()]
    .map((row) => ({ ...row, skorRata: row.total ? Math.round(row.skorTotal / row.total) : 0 }))
    .sort((a, b) => b.kritis - a.kritis || b.skorRata - a.skorRata)
}

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

// Halaman mandiri: seluruh gaya di dalamnya, tidak ada permintaan ke luar.
// Dibuka di tab baru; pengguna menekan Cetak lalu "Simpan sebagai PDF".
export function createRekapHtml(reports = getReports()) {
  const summary = summarizeByKecamatan(reports)
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalKritis = summary.reduce((sum, row) => sum + row.kritis, 0)

  const baris = summary.map((row) => `
      <tr${row.kritis > 0 ? ' class="ada-kritis"' : ''}>
        <td>${escapeHtml(row.kecamatan)}</td>
        <td class="num">${row.total}</td>
        <td class="num">${row.aktif}</td>
        <td class="num">${row.selesai}</td>
        <td class="num strong">${row.kritis}</td>
        <td class="num">${row.tinggi}</td>
        <td class="num">${row.skorRata}</td>
      </tr>`).join('')

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rekap Wilayah ALIRIN - ${escapeHtml(tanggal)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #102a43; margin: 0; padding: 32px; background: #fff; }
  header { border-bottom: 3px solid #0b3a5b; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .sub { color: #486581; font-size: 13px; }
  .ringkas { display: flex; gap: 24px; margin: 20px 0; }
  .ringkas div { background: #eef7fa; border-radius: 10px; padding: 12px 18px; }
  .ringkas strong { display: block; font-size: 24px; }
  .ringkas span { font-size: 12px; color: #486581; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid #d9eaf2; }
  th { background: #0b3a5b; color: #fff; font-weight: 600; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.strong { font-weight: 700; }
  tr.ada-kritis td.strong { color: #e03131; }
  footer { margin-top: 28px; font-size: 11px; color: #829ab1; }
  @media print { body { padding: 0; } .cetak { display: none; } }
  .cetak { margin: 20px 0; padding: 10px 18px; background: #0b3a5b; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
  <header>
    <h1>Rekap Wilayah Drainase Mikro</h1>
    <div class="sub">ALIRIN - Kota Bandar Lampung &middot; ${escapeHtml(tanggal)}</div>
  </header>

  <button class="cetak" onclick="window.print()">Cetak / Simpan PDF</button>

  <div class="ringkas">
    <div><strong>${reports.length}</strong><span>Total laporan</span></div>
    <div><strong>${summary.length}</strong><span>Kecamatan terdampak</span></div>
    <div><strong>${totalKritis}</strong><span>Laporan Kritis</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Kecamatan</th><th>Total</th><th>Aktif</th><th>Selesai</th><th>Kritis</th><th>Tinggi</th><th>Skor rata</th>
      </tr>
    </thead>
    <tbody>${baris}
    </tbody>
  </table>

  <footer>
    Dihasilkan otomatis oleh ALIRIN. Rekap ini untuk koordinasi lintas instansi
    (BPBD, Damkar, Dinas PU, BBWS Mesuji Sekampung) dan tidak memuat data pribadi pelapor.
  </footer>
</body>
</html>`
}
