import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Droplets, LockKeyhole, LogIn } from 'lucide-react'
import { signInWithEmail } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { isDemoAuthEnabled } from '../services/runtimeConfig.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [demoUsers, setDemoUsers] = useState(null)

  const { role, loading } = useAuth()

  useEffect(() => {
    if (import.meta.env.PROD || !isDemoAuthEnabled) return undefined
    let active = true
    void import('../data/demoUsers.js').then(({ DEMO_USERS }) => {
      if (!active) return
      setDemoUsers(DEMO_USERS)
      setEmail((current) => current || DEMO_USERS.admin.email)
      setPassword((current) => current || DEMO_USERS.admin.password)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (role === 'admin') {
      navigate(location.state?.from || '/admin/dashboard', { replace: true })
      return
    }
    if (role === 'petugas') {
      navigate('/petugas/tugas', { replace: true })
    }
  }, [role, loading, location.state, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const result = await signInWithEmail(email.trim(), password)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.session.role !== 'admin') {
      navigate('/petugas/tugas', { replace: true })
      return
    }
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: 20,
      background: 'linear-gradient(135deg, #082f49 0%, #0b7285 100%)',
      color: '#fff',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 'min(100%, 420px)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 22,
        background: 'rgba(255,255,255,0.1)',
        boxShadow: '0 30px 80px rgba(2, 6, 23, 0.32)',
        backdropFilter: 'blur(18px)',
        padding: '28px',
      }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'rgba(255,255,255,0.78)',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 28,
        }}>
          <ArrowLeft size={16} /> Beranda
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            display: 'grid',
            placeItems: 'center',
            width: 54,
            height: 54,
            borderRadius: 16,
            background: 'rgba(34,184,207,0.2)',
            color: '#7ee4f2',
          }}>
            <LockKeyhole size={26} />
          </div>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#a5f3fc',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              <Droplets size={13} /> {isDemoAuthEnabled ? 'Demo Admin' : 'Admin'}
            </span>
            <h1 style={{ margin: '5px 0 0', fontSize: 28, lineHeight: 1.05 }}>Masuk dashboard</h1>
          </div>
        </div>

        <p style={{ margin: '0 0 22px', color: 'rgba(255,255,255,0.74)', lineHeight: 1.6 }}>
          {isDemoAuthEnabled
            ? 'Mode demo aktif untuk pengujian lokal. Jangan gunakan data sensitif.'
            : 'Masuk dengan akun admin yang terdaftar di Supabase Auth.'}
        </p>

        <label style={labelStyle} htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
          autoComplete="username"
        />

        <label style={{ ...labelStyle, marginTop: 14 }} htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={inputStyle}
          autoComplete="current-password"
        />

        {error && (
          <div style={{
            marginTop: 14,
            padding: '11px 12px',
            borderRadius: 12,
            background: 'rgba(248, 113, 113, 0.18)',
            color: '#fecaca',
            fontSize: 13,
            fontWeight: 700,
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', marginTop: 22 }}>
          <LogIn size={18} />
          Masuk Dashboard
        </button>

        {isDemoAuthEnabled && demoUsers && (
          <div style={{
            marginTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: 16,
            color: 'rgba(255,255,255,0.62)',
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#fff' }}>Credential demo:</strong><br />
            Admin: {demoUsers.admin.email} / {demoUsers.admin.password}<br />
            Petugas: {demoUsers.petugas.email} / {demoUsers.petugas.password}
          </div>
        )}
      </form>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  marginBottom: 7,
  color: 'rgba(255,255,255,0.86)',
  fontSize: 13,
  fontWeight: 800,
}

const inputStyle = {
  width: '100%',
  height: 48,
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 13,
  background: 'rgba(255,255,255,0.94)',
  color: '#0f172a',
  padding: '0 14px',
  fontSize: 15,
  outline: 'none',
}
