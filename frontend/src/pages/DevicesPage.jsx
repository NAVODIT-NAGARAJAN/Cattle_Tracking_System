import { useState, useEffect, useCallback, useMemo } from 'react';
import { StatusBadge } from '../components/Badges';
import { EmptyState, LoadingState, ErrorState } from '../components/States';
import { devicesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { formatRelativeTime } from '../utils/formatters';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [selectedDev, setSelectedDev] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await devicesAPI.getAll();
      setDevices(res.data.data.devices);
    } catch (err) {
      setError('Failed to load IoT devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    const socket = getSocket();
    const onDevice = (dev) => {
      setDevices(prev => {
        const idx = prev.findIndex(d => d.deviceId === dev.deviceId);
        if (idx === -1) return [dev, ...prev];
        const next = [...prev];
        next[idx] = dev;
        return next;
      });
      if (selectedDev && selectedDev.deviceId === dev.deviceId) {
        setSelectedDev(dev);
      }
    };
    socket.on('device:online', onDevice);
    return () => socket.off('device:online', onDevice);
  }, [selectedDev]);

  const filtered = useMemo(() => {
    if (!search) return devices;
    const q = search.toLowerCase();
    return devices.filter(d => 
      d.deviceId.toLowerCase().includes(q) || 
      (d.name && d.name.toLowerCase().includes(q))
    );
  }, [devices, search]);

  const onlineCount = devices.filter(d => d.status === 'online').length;

  if (loading && devices.length === 0) return <LoadingState message="Loading devices…" />;
  if (error) return <ErrorState message={error} onRetry={fetchDevices} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">IoT Devices</div>
          <div className="page-subtitle">Manage ESP32 trackers and edge nodes</div>
        </div>
        <button className="btn btn-secondary" onClick={fetchDevices}>Refresh Status</button>
      </div>

      <div className="grid-cols-4" style={{ marginBottom:20 }}>
        <div className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, background:'var(--primary-bg)', color:'var(--primary)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>📡</div>
          <div><div style={{ fontSize:24, fontWeight:700 }}>{devices.length}</div><div style={{ fontSize:12, color:'var(--gray-500)' }}>Total Devices</div></div>
        </div>
        <div className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, background:'var(--success-bg)', color:'var(--success)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>✅</div>
          <div><div style={{ fontSize:24, fontWeight:700 }}>{onlineCount}</div><div style={{ fontSize:12, color:'var(--gray-500)' }}>Online Now</div></div>
        </div>
        <div className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, background:'var(--danger-bg)', color:'var(--danger)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>⚠️</div>
          <div><div style={{ fontSize:24, fontWeight:700 }}>{devices.length - onlineCount}</div><div style={{ fontSize:12, color:'var(--gray-500)' }}>Offline / Inactive</div></div>
        </div>
      </div>

      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="card" style={{ padding:'14px 16px', marginBottom:16 }}>
            <div className="filter-bar">
              <div className="search-bar" style={{ flex:1 }}>
                <span className="search-icon"></span>
                <input placeholder="Search by Device ID or Name…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            {filtered.length === 0 ? (
              <EmptyState icon="DEV" title="No devices found" />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Device ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>IP Address</th>
                      <th>Firmware</th>
                      <th>Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.deviceId}
                          style={{ cursor:'pointer', background:selectedDev?.deviceId === d.deviceId ? 'var(--primary-bg)' : 'transparent' }}
                          onClick={() => setSelectedDev(d)}>
                        <td style={{ fontFamily:'monospace', fontWeight:600, color:'var(--primary)' }}>{d.deviceId}</td>
                        <td style={{ fontSize:13 }}>{d.name || '—'}</td>
                        <td><StatusBadge status={d.status} /></td>
                        <td style={{ fontFamily:'monospace', fontSize:12 }}>{d.ipAddress || '—'}</td>
                        <td style={{ fontSize:12 }}>{d.firmwareVersion || '—'}</td>
                        <td style={{ fontSize:12, color:'var(--gray-500)' }}>{formatRelativeTime(d.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ width:320, flexShrink:0 }}>
          {selectedDev ? (
            <div className="card" style={{ position:'sticky', top:16 }}>
              <div className="card-header" style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:600 }}>Device Overview</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDev(null)}>X</button>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                  <div style={{ width:48, height:48, background:'var(--gray-100)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>DEV</div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, fontFamily:'monospace' }}>{selectedDev.deviceId}</div>
                    <div style={{ fontSize:13, color:'var(--gray-500)' }}>{selectedDev.name || 'Unnamed Device'}</div>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:12, borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:12, color:'var(--gray-500)' }}>Status</span>
                    <StatusBadge status={selectedDev.status} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:12, borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:12, color:'var(--gray-500)' }}>Last Seen</span>
                    <span style={{ fontSize:12, fontWeight:500 }}>{formatRelativeTime(selectedDev.lastSeen)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:12, borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:12, color:'var(--gray-500)' }}>Type</span>
                    <span style={{ fontSize:12, fontWeight:500, textTransform:'uppercase' }}>{selectedDev.deviceType || 'ESP32'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:12, borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:12, color:'var(--gray-500)' }}>IP Address</span>
                    <span style={{ fontFamily:'monospace', fontSize:12 }}>{selectedDev.ipAddress || '—'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'var(--gray-500)' }}>Firmware</span>
                    <span style={{ fontSize:12, fontWeight:500 }}>{selectedDev.firmwareVersion || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding:40, textAlign:'center', color:'var(--gray-400)', position:'sticky', top:16 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>DEV</div>
              <div style={{ fontSize:13 }}>Select a device to view full details and configuration.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
