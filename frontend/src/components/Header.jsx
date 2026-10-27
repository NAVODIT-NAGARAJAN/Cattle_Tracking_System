import { useClock } from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import { mockAlerts } from '../data/mockData';

export default function Header({ onMenuToggle, title, subtitle }) {
  const now = useClock();
  const { user } = useAuth();
  const unreadAlerts = mockAlerts.filter(a => !a.read).length;

  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Mobile hamburger */}
        <button className="btn btn-ghost btn-icon" onClick={onMenuToggle} aria-label="Toggle menu"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
          ☰
        </button>
        <div>
          <div className="header-title">{title || 'Dashboard'}</div>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="header-right">
        <div className="header-time" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>{timeStr}</span>
          <span style={{ fontSize:11, color:'var(--gray-400)' }}>{dateStr}</span>
        </div>

        {/* Notifications */}
        <button className="btn btn-ghost btn-icon notification-btn" aria-label={`${unreadAlerts} unread notifications`}>
          <span style={{ fontSize:18 }}></span>
          {unreadAlerts > 0 && <span className="notification-dot" />}
        </button>

        {/* User */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="avatar" title={user?.name}>{user?.avatar || 'U'}</div>
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.2 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--gray-800)' }}>{user?.name}</span>
            <span style={{ fontSize:11, color:'var(--gray-500)' }}>{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
