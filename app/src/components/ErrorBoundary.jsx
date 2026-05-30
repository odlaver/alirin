import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#f4fafc', textAlign: 'center', padding: 24, fontFamily: 'system-ui' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e03131', margin: 0 }}>Sistem Mengalami Kendala</h1>
          <p style={{ color: '#486581', fontSize: 14, margin: 0, maxWidth: 400 }}>
            Terjadi kesalahan teknis pada tampilan aplikasi. Jangan khawatir, data Anda aman. Silakan muat ulang halaman.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 12, padding: '10px 20px', background: '#0b3a5b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Muat Ulang Halaman
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
