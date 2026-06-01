import { Droplets, LogOut } from 'lucide-react'
import { NAV_MAIN } from './adminNavigation.js'

export default function AdminSidebar({ nav, setNav, mobileOpen, setMobileOpen, pendingCount, onLogout }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-logo">
          <span className="logo-icon"><Droplets size={18} /></span>
          <div>ALIRIN<small>Admin Panel</small></div>
        </div>
        <nav className="admin-nav">
          <span className="admin-nav-section">Menu Utama</span>
          {NAV_MAIN.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`admin-nav-item ${nav === id ? 'active' : ''}`}
              onClick={() => {
                setNav(id)
                setMobileOpen(false)
              }}
            >
              <Icon size={18} />
              {label}
              {(id === 'laporan' ? pendingCount : badge) > 0 && (
                <span className="admin-nav-badge">{id === 'laporan' ? pendingCount : badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-user-pill admin-user-button" type="button" onClick={onLogout}>
            <div className="admin-avatar">A</div>
            <div className="admin-user-info"><strong>Demo Admin</strong><small>admin@alirin.local</small></div>
            <LogOut size={16} className="logout-icon" />
          </button>
        </div>
      </aside>
    </>
  )
}
