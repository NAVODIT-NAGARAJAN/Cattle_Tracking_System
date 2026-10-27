import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorage('sidebar_collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // While restoring token from localStorage, show nothing
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gray-50)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner lg" style={{ margin:'0 auto 16px' }} />
        <div style={{ fontSize:14, color:'var(--gray-500)' }}>Loading CattleTrack…</div>
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="app-content">
        <Header onMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="page-main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
