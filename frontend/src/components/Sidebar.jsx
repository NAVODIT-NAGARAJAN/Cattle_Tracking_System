import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to:'/dashboard', icon:'DB', label:'Dashboard' },
  { to:'/animals', icon:'AN', label:'Animals' },
  { to:'/tracking', icon:'LT', label:'Live Tracking' },
  { to:'/detections', icon:'BD', label:'Breed Detection' },
  { to:'/history', icon:'DH', label:'Detection History' },
  { to:'/devices', icon:'DV', label:'Devices' },
  { to:'/reports', icon:'RP', label:'Reports' },
  { to:'/settings', icon:'ST', label:'Settings' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">CT</div>
          {!collapsed && (
            <div>
              <div className="brand-text">CattleTrack</div>
              <div className="brand-sub">NLMS Platform</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          {!collapsed && <div className="nav-section-label">Main Menu</div>}
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={onMobileClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && user && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:8 }}>
              <div className="avatar" style={{ width:28, height:28, fontSize:12 }}>{user.avatar}</div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{user.role}</div>
              </div>
            </div>
          )}
          <button className="nav-item" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
            <span className="nav-icon">X</span>
            {!collapsed && <span>Logout</span>}
          </button>
          <button className="nav-item" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'} style={{ marginTop:2 }}>
            <span className="nav-icon">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
