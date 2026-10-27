import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardAPI, devicesAPI } from '../services/api';
import { capitalizeBreed } from '../utils/formatters';

const COLORS = ['#FF6B00','#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];

const SummaryCard = ({ icon, label, value, sub, color = 'var(--primary)', bg = 'var(--primary-bg)' }) => (
  <div className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:14 }}>
    <div style={{ width:48, height:48, background:bg, borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, color }}>{icon}</div>
    <div>
      <div style={{ fontSize:26, fontWeight:800, color:'var(--gray-900)' }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:500, color:'var(--gray-600)' }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'var(--gray-400)' }}>{sub}</div>}
    </div>
  </div>
);

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [breedDist, setBreedDist] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, devRes, breedRes] = await Promise.all([
        dashboardAPI.getSummary(),
        devicesAPI.getAll(),
        dashboardAPI.getBreeds()
      ]);
      setSummary(sumRes.data.data);
      setDevices(devRes.data.data.devices);
      
      const dist = breedRes.data.data.distribution || [];
      const total = dist.reduce((s, d) => s + d.count, 0);
      setBreedDist(dist.map(d => ({
        ...d,
        percentage: total > 0 ? ((d.count / total) * 100).toFixed(1) : 0,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 800);
  };

  if (loading || !summary) {
    return <div style={{ padding:40, textAlign:'center' }}><div className="spinner lg" /></div>;
  }

  const totalAnimals = summary.totalAnimals || 0;
  const onlineAnimals = summary.onlineAnimals || 0;
  const gpsFixed = summary.gpsFixedAnimals || 0;
  const totalDetections = summary.totalDetections || 0;

  const onlineDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-subtitle">Livestock management analytics and statistics</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <><span className="spinner white" style={{width:14,height:14}} /> Generating…</> : ' Download Report'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-cols-4" style={{ marginBottom:24 }}>
        <SummaryCard icon="🐃" label="Total Animals" value={totalAnimals} sub="Registered in system" color="var(--success)" bg="var(--success-bg)" />
        <SummaryCard icon="🟢" label="Online Animals" value={onlineAnimals} sub={`${totalAnimals ? ((onlineAnimals/totalAnimals)*100).toFixed(0) : 0}% operational`} color="var(--info)" bg="var(--info-bg)" />
        <SummaryCard icon="📍" label="GPS Fixed" value={gpsFixed} sub="Real-time position" color="#8B5CF6" bg="rgba(139, 92, 246, 0.1)" />
        <SummaryCard icon="🔎" label="Total Detections" value={totalDetections} sub="ML Inferences run" color="var(--warning)" bg="var(--warning-bg)" />
      </div>

      <div className="grid-cols-2" style={{ marginBottom:24, gap:16 }}>
        {/* Breed Stats */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight:600 }}>Breed Distribution</span></div>
          <div className="card-body">
            {breedDist.length === 0 ? (
              <div style={{ padding:30, textAlign:'center', color:'var(--gray-400)' }}>No breed data available</div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <ResponsiveContainer width="40%" height={200}>
                  <PieChart>
                    <Pie data={breedDist} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="breed">
                      {breedDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n, { payload }) => [`${payload.percentage}%`, capitalizeBreed(payload.breed)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1 }}>
                  {breedDist.map((b, i) => (
                    <div key={b.breed} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ width:12, height:12, borderRadius:2, background:COLORS[i%COLORS.length] }} />
                      <span style={{ flex:1, fontSize:12, textTransform:'capitalize' }}>{b.breed}</span>
                      <span style={{ fontSize:12, fontWeight:600 }}>{b.count} ({b.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Device status */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight:600 }}>Device Status Summary</span></div>
          <div style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:800, color:'var(--success)' }}>{onlineDevices}</div>
                <div style={{ fontSize:12, color:'var(--gray-500)' }}>Online</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:800, color:'var(--danger)' }}>{devices.length - onlineDevices}</div>
                <div style={{ fontSize:12, color:'var(--gray-500)' }}>Offline</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:36, fontWeight:800, color:'var(--info)' }}>{devices.length}</div>
                <div style={{ fontSize:12, color:'var(--gray-500)' }}>Total</div>
              </div>
            </div>
            <div className="progress-bar" style={{ height:10, marginBottom:8 }}>
              <div className="progress-fill" style={{ width:`${devices.length ? (onlineDevices/devices.length)*100 : 0}%` }} />
            </div>
            <div style={{ fontSize:12, color:'var(--gray-500)', textAlign:'center' }}>
              {devices.length ? ((onlineDevices/devices.length)*100).toFixed(0) : 0}% operational availability
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
