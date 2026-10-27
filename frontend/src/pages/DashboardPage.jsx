import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import StatCard from '../components/StatCard';
import { StatusBadge, ConfidenceBadge } from '../components/Badges';
import { LoadingState, ErrorState } from '../components/States';
import { dashboardAPI, animalsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { formatRelativeTime, capitalizeBreed } from '../utils/formatters';
import { mockWeeklyActivity, mockMonthlyStats, mockAlerts } from '../data/mockData';

const CHART_COLORS = ['#FF6B00','#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recentDetections, setRecentDetections] = useState([]);
  const [liveAnimals, setLiveAnimals] = useState([]);
  const [breedDist, setBreedDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      const [summaryRes, recentRes, liveRes, breedsRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getRecent(5),
        dashboardAPI.getLive(),
        dashboardAPI.getBreeds(),
      ]);
      setSummary(summaryRes.data.data);
      setRecentDetections(recentRes.data.data.detections || []);
      setLiveAnimals(liveRes.data.data.animals?.slice(0, 6) || []);

      const dist = breedsRes.data.data.distribution || [];
      const total = dist.reduce((s, d) => s + d.count, 0);
      setBreedDist(dist.map(d => ({
        ...d,
        percentage: total > 0 ? ((d.count / total) * 100).toFixed(1) : 0,
      })));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Socket.IO real-time updates
    const socket = getSocket();
    const onDetection = () => {
      dashboardAPI.getSummary().then(r => setSummary(r.data.data)).catch(() => {});
      dashboardAPI.getRecent(5).then(r => setRecentDetections(r.data.data.detections || [])).catch(() => {});
    };
    const onAnimal = () => {
      dashboardAPI.getLive().then(r => setLiveAnimals(r.data.data.animals?.slice(0, 6) || [])).catch(() => {});
    };
    socket.on('detection:created', onDetection);
    socket.on('animal:updated', onAnimal);
    return () => {
      socket.off('detection:created', onDetection);
      socket.off('animal:updated', onAnimal);
    };
  }, [fetchAll]);

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={fetchAll} />;

  const stats = summary || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">National Livestock Management System — Live Overview</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to="/animals/add" className="btn btn-primary">+ Add Animal</Link>
          <Link to="/detections" className="btn btn-secondary">Run Detection</Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-cols-6" style={{ marginBottom:24 }}>
        <StatCard icon="🐃" label="Total Animals" value={stats.totalAnimals ?? 0} color="var(--primary)" bgColor="var(--primary-bg)" />
        <StatCard icon="🟢" label="Online Animals" value={stats.onlineAnimals ?? 0} color="var(--info)" bgColor="var(--info-bg)" />
        <StatCard icon="📍" label="GPS Fixed" value={stats.gpsFixedAnimals ?? 0} color="#8B5CF6" bgColor="rgba(139, 92, 246, 0.1)" />
        <StatCard icon="📸" label="Today's Detections" value={stats.todayDetections ?? 0} color="#06B6D4" bgColor="rgba(6, 182, 212, 0.1)" />
        <StatCard icon="🔎" label="Total Detections" value={stats.totalDetections ?? 0} color="var(--warning)" bgColor="var(--warning-bg)" />
        <StatCard icon="📵" label="Offline Animals" value={stats.offlineAnimals ?? 0} color="var(--danger)" bgColor="var(--danger-bg)" />
      </div>

      {/* Charts row */}
      <div className="grid-cols-2" style={{ marginBottom:24 }}>
        <div className="card chart-card">
          <div className="chart-title">Weekly Detection Activity</div>
          <div className="chart-subtitle">Detections and active animals per day (demo)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockWeeklyActivity} margin={{ top:4, right:8, left:-16, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="detections" fill="var(--primary)" name="Detections" radius={[3,3,0,0]} />
              <Bar dataKey="animals" fill="var(--info)" name="Active Animals" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <div className="chart-title">Breed Distribution</div>
          <div className="chart-subtitle">{breedDist.length > 0 ? 'Live from database' : 'No breed data yet'}</div>
          {breedDist.length > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={breedDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="count" nameKey="breed">
                    {breedDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n, { payload }) => [`${payload.percentage}%`, capitalizeBreed(payload.breed)]}
                    contentStyle={{ fontSize:12, borderRadius:8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                {breedDist.slice(0,7).map((b, i) => (
                  <div key={b.breed} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:10, height:10, borderRadius:2, background:CHART_COLORS[i%CHART_COLORS.length], flexShrink:0 }} />
                    <span style={{ fontSize:11, flex:1, color:'var(--gray-600)', textTransform:'capitalize' }}>{b.breed}</span>
                    <span style={{ fontSize:11, fontWeight:600 }}>{b.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)', fontSize:13 }}>
              Register animals with breeds to see distribution
            </div>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="card chart-card" style={{ marginBottom:24 }}>
        <div className="chart-title">Monthly Trend (Sample Data)</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={mockMonthlyStats} margin={{ top:4, right:8, left:-16, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} />
            <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Line type="monotone" dataKey="detections" stroke="var(--primary)" strokeWidth={2} dot={{ r:3 }} name="Detections" />
            <Line type="monotone" dataKey="newAnimals" stroke="var(--info)" strokeWidth={2} dot={{ r:3 }} name="New Animals" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom panels */}
      <div className="grid-cols-2" style={{ marginBottom:24 }}>
        {/* Recent detections */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize:14, fontWeight:600 }}>Recent Detections</span>
            <Link to="/history" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {recentDetections.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>
              No detections yet. Upload an image to run breed detection.
            </div>
          ) : (
            recentDetections.map(d => (
              <div key={d._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px', borderBottom:'1px solid var(--gray-100)' }}>
                {d.imageUrl ? (
                  <img src={`http://localhost:5000${d.imageUrl}`} alt="Detection" style={{ width:36, height:36, borderRadius:'var(--radius-sm)', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:36, height:36, background:'var(--gray-100)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}></div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, textTransform:'capitalize' }}>{d.breed}</div>
                  <div style={{ fontSize:11, color:'var(--gray-500)' }}>{d.animalId || '—'} · {formatRelativeTime(d.timestamp)}</div>
                </div>
                <ConfidenceBadge confidence={d.confidence} />
              </div>
            ))
          )}
        </div>

        {/* System alerts (static for now) */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize:14, fontWeight:600 }}>System Alerts</span>
            <span className="badge badge-danger">{mockAlerts.filter(a=>!a.read).length} new</span>
          </div>
          {mockAlerts.map(alert => (
            <div key={alert.id} style={{ padding:'12px 20px', borderBottom:'1px solid var(--gray-100)', display:'flex', gap:10 }}>
              <span style={{ fontSize:16 }}>{alert.type==='warning'?'':alert.type==='danger'?'🚨':''}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, display:'flex', justifyContent:'space-between' }}>
                  {alert.title}
                  {!alert.read && <span className="badge badge-danger" style={{ marginLeft:8 }}>New</span>}
                </div>
                <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2 }}>{alert.message}</div>
                <div style={{ fontSize:10, color:'var(--gray-400)', marginTop:4 }}>{formatRelativeTime(alert.time)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live animal table */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize:14, fontWeight:600 }}>Live Animal Status</span>
          <Link to="/animals" className="btn btn-ghost btn-sm">View all animals →</Link>
        </div>
        {liveAnimals.length === 0 ? (
          <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>
            No animals currently online. Add animals and receive ESP32 device data to see live status.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Animal ID</th><th>Breed</th><th>Status</th><th>GPS</th><th>Owner</th><th>Last Seen</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveAnimals.map(a => (
                  <tr key={a.animalId || a._id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12 }}>{a.animalId}</span></td>
                    <td style={{ textTransform:'capitalize' }}>{a.breed || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{a.gpsFix ? <span className="badge badge-success"> Fixed</span> : <span className="badge badge-gray">No Fix</span>}</td>
                    <td style={{ fontSize:12 }}>{a.ownerName || '—'}</td>
                    <td style={{ fontSize:12, color:'var(--gray-500)' }}>{formatRelativeTime(a.lastGpsUpdate || a.updatedAt)}</td>
                    <td><Link to={`/animals/${a.animalId}`} className="btn btn-secondary btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
