import { getConfidenceColor } from '../utils/formatters';

export function StatusBadge({ status }) {
  const map = {
    online: { cls:'badge-success', label:'Online' },
    offline: { cls:'badge-gray', label:'Offline' },
    healthy: { cls:'badge-success', label:'Healthy' },
    monitoring: { cls:'badge-warning', label:'Monitoring' },
    warning: { cls:'badge-warning', label:'Warning' },
    critical: { cls:'badge-danger', label:'Critical' },
  };
  const { cls, label } = map[status] || { cls:'badge-gray', label:status };
  return (
    <span className={`badge ${cls}`}>
      <span className={`status-dot ${status === 'online' || status === 'healthy' ? 'online' : status === 'monitoring' ? 'warning' : 'offline'}`} />
      {label}
    </span>
  );
}

export function ConfidenceBadge({ confidence }) {
  if (!confidence) return <span className="badge badge-gray">—</span>;
  const color = getConfidenceColor(confidence);
  const cls = confidence >= 90 ? 'badge-success' : confidence >= 75 ? 'badge-info' : confidence >= 60 ? 'badge-warning' : 'badge-danger';
  return <span className={`badge ${cls}`}>{confidence.toFixed(1)}%</span>;
}

export function GPSBadge({ gpsFix, satellites }) {
  if (gpsFix) return <span className="badge badge-success"> Fix ({satellites})</span>;
  return <span className="badge badge-gray"> No Fix</span>;
}

export function DeviceTypeBadge({ type }) {
  const cls = type === 'Gateway' ? 'badge-info' : type?.includes('CAM') ? 'badge-warning' : 'badge-primary';
  return <span className={`badge ${cls}`}>{type}</span>;
}
