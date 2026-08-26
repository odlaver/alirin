import './RiskBreakdown.css'

// P-2 · Rincian skor yang bisa dibaca warga, petugas, dan admin.
//
// Sumbernya tabel risk_breakdowns yang diisi trigger basis data, bukan hitungan
// ulang di klien. Poin tiap faktor dijamin berjumlah sama dengan skor akhir
// (lihat alirin_apportion), jadi barisan angka di sini boleh dijumlahkan
// pengguna tanpa menemukan selisih.

const FILL_COLOR = (percentage) => {
  if (percentage >= 70) return 'var(--color-danger)'
  if (percentage >= 40) return 'var(--color-warning)'
  return 'var(--color-secondary)'
}

export default function RiskBreakdown({ items = [], title = 'Faktor Risiko' }) {
  const rows = Array.isArray(items) ? items : []
  if (rows.length === 0) {
    return (
      <div className="risk-breakdown risk-breakdown-empty">
        <small>Rincian faktor belum tersedia untuk laporan ini.</small>
      </div>
    )
  }

  const weighted = rows.filter((item) => Number(item.weight) > 0)
  const unweighted = rows.filter((item) => !(Number(item.weight) > 0))
  const total = weighted.reduce((sum, item) => sum + Number(item.points || 0), 0)

  return (
    <div className="risk-breakdown">
      <div className="risk-breakdown-head">
        <small>{title}</small>
        {/* Angkanya dijumlahkan dari baris di bawah, bukan disalin dari
            risk_score, supaya selisih apa pun langsung terlihat. */}
        <span className="risk-breakdown-total">{total} / 100</span>
      </div>

      {weighted.map((item) => {
        const points = Number(item.points || 0)
        const weight = Number(item.weight || 0)
        const fill = weight > 0 ? Math.min(Math.round((points / weight) * 100), 100) : 0
        return (
          <div className="risk-breakdown-row" key={item.id}>
            <div className="risk-breakdown-row-head">
              <span>{item.label}</span>
              <strong>
                {points}
                <em>/{weight}</em>
              </strong>
            </div>
            <div className="risk-breakdown-track">
              <div className="risk-breakdown-fill" style={{ width: `${fill}%`, background: FILL_COLOR(fill) }} />
            </div>
            <small className="risk-breakdown-detail">{item.detail}</small>
          </div>
        )
      })}

      {unweighted.length > 0 && (
        <div className="risk-breakdown-pending">
          <small>Dicatat, belum dibobot</small>
          {unweighted.map((item) => (
            <div className="risk-breakdown-pending-row" key={item.id}>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
