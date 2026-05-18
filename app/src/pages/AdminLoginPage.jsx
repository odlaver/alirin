import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'

export default function AdminLoginPage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, background: '#0b3a5b', fontFamily: 'inherit' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,184,207,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22b8cf' }}>
        <LockKeyhole size={30} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Admin Login</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>Halaman ini sedang dikembangkan.</p>
      </div>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#22b8cf', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>
    </div>
  )
}
