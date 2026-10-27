import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--gray-50)', fontFamily:'var(--font)', padding:24
    }}>
      <div style={{ textAlign:'center', maxWidth:480 }}>
        <div style={{ fontSize:80, marginBottom:16 }}></div>
        <div style={{ fontSize:80, fontWeight:900, color:'var(--gray-200)', lineHeight:1, marginBottom:8 }}>404</div>
        <h1 style={{ fontSize:28, fontWeight:700, color:'var(--gray-900)', marginBottom:12 }}>Page Not Found</h1>
        <p style={{ color:'var(--gray-500)', fontSize:15, marginBottom:32, lineHeight:1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to the dashboard.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary btn-lg">← Back to Dashboard</Link>
          <Link to="/animals" className="btn btn-secondary btn-lg">View Animals</Link>
        </div>
        <div style={{ marginTop:40, padding:'16px 24px', background:'var(--bg-panel)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border-color)', fontSize:13, color:'var(--gray-500)' }}>
          CattleTrack — National Livestock Management System
        </div>
      </div>
    </div>
  );
}
