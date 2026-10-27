export default function StatCard({ icon, label, value, change, changeType = 'up', color = 'var(--primary)', bgColor = 'var(--primary-bg)' }) {
  return (
    <div className="card stat-card">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div className="stat-icon" style={{ background:bgColor, color }}>
          {icon}
        </div>
        {change != null && (
          <div className={`stat-change ${changeType}`}>
            {changeType === 'up' ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
