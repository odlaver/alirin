import { Sparkles } from 'lucide-react'
import './AiAssessment.css'

// P-1 · Penilaian AI ditampilkan BERDAMPINGAN dengan baseline, bukan
// menggantikannya.
//
// Proposal 4.3.4 menjanjikan AI "dibandingkan dengan baseline serta verifikasi
// lapangan". Menampilkan satu angka saja akan menghapus perbandingan itu, dan
// pengguna tidak lagi bisa tahu mana yang berasal dari aturan yang bisa dilacak
// dan mana yang berasal dari model. Selisihnya justru bagian yang menarik: ia
// menjadi bahan evaluasi akurasi yang dijanjikan Proposal 4.4.
//
// Urutan penanganan tetap memakai skor baseline.

export default function AiAssessment({ report }) {
  const aiScore = report?.aiRiskScore
  if (!Number.isFinite(Number(aiScore))) return null

  const baseline = Number(report.riskScore)
  const selisih = Number(aiScore) - baseline
  const arah = selisih > 0 ? 'lebih tinggi' : selisih < 0 ? 'lebih rendah' : 'sama'

  return (
    <div className="ai-assessment">
      <div className="ai-assessment-head">
        <small><Sparkles size={12} /> Pembanding AI</small>
        {report.aiModel && <span className="ai-assessment-model">{report.aiModel}</span>}
      </div>

      <div className="ai-assessment-scores">
        <div className="ai-score-cell">
          <strong>{baseline}</strong>
          <small>Baseline (dipakai)</small>
        </div>
        <div className="ai-score-cell ai-score-cell-ai">
          <strong>{aiScore}</strong>
          <small>AI ({arah}{selisih !== 0 ? ` ${Math.abs(selisih)}` : ''})</small>
        </div>
      </div>

      {report.aiRiskReason && <p className="ai-assessment-reason">{report.aiRiskReason}</p>}

      {report.aiRecommendations?.length > 0 && (
        <ul className="ai-assessment-actions">
          {report.aiRecommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <small className="ai-assessment-note">
        Urutan penanganan memakai skor baseline. Angka AI ditampilkan untuk
        dibandingkan, bukan untuk menggantikan.
      </small>
    </div>
  )
}
