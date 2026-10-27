import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge, ConfidenceBadge, GPSBadge } from '../components/Badges';
import Breadcrumb from '../components/Breadcrumb';
import { LoadingState, ErrorState } from '../components/States';
import { formatDateTime, formatRelativeTime, formatAge, formatCoord, getConfidenceColor } from '../utils/formatters';
import { animalsAPI, detectionsAPI, trackingAPI } from '../services/api';
import { getSocket } from '../services/socket';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function AnimalDetailPage() {
  const { animalId } = useParams();
  const navigate = useNavigate();
  
  const [animal, setAnimal] = useState(null);
  const [detections, setDetections] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await animalsAPI.getById(animalId);
      setAnimal(res.data.data.animal);
      
      const [detRes, trackRes] = await Promise.all([
        detectionsAPI.getByAnimal(animalId),
        trackingAPI.getByAnimal(animalId, 50)
      ]);
      setDetections(detRes.data.data.detections || []);
      setTracking(trackRes.data.data.records || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('NOT_FOUND');
      } else {
        setError(err.response?.data?.message || 'Failed to load animal data');
      }
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Socket updates
  useEffect(() => {
    const socket = getSocket();
    
    const onAnimal = (updatedAnimal) => {
      if (updatedAnimal.animalId === animalId) setAnimal(updatedAnimal);
    };
    const onDetection = (det) => {
      if (det.animalId === animalId) {
        setDetections(prev => [det, ...prev]);
        animalsAPI.getById(animalId).then(res => setAnimal(res.data.data.animal)).catch(()=>{});
      }
    };
    const onTracking = (track) => {
      if (track.animalId === animalId && track.gpsFix) {
        setTracking(prev => [track, ...prev]);
        setAnimal(prev => prev ? { 
          ...prev, 
          gpsFix: track.gpsFix, 
          latitude: track.latitude, 
          longitude: track.longitude, 
          satellites: track.satellites,
          lastGpsUpdate: track.timestamp
        } : null);
      }
    };

    socket.on('animal:updated', onAnimal);
    socket.on('detection:created', onDetection);
    socket.on('tracking:updated', onTracking);

    return () => {
      socket.off('animal:updated', onAnimal);
      socket.off('detection:created', onDetection);
      socket.off('tracking:updated', onTracking);
    };
  }, [animalId]);


  if (loading && !animal) return <LoadingState message="Loading animal details…" />;
  
  if (error === 'NOT_FOUND') {
    return (
      <div className="state-container">
        <div className="state-icon"></div>
        <div className="state-title">Animal Not Found</div>
        <div className="state-desc">No animal found with ID: {animalId}</div>
        <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/animals')}>← Back to Animals</button>
      </div>
    );
  }
  
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!animal) return null;

  const TABS = ['overview','location','detections','history'];
  const confidenceColor = getConfidenceColor(animal.breedConfidence);
  const mapCenter = animal.gpsFix ? [animal.latitude, animal.longitude] : [20.5937, 78.9629];
  const trackPath = tracking.filter(t => t.gpsFix).map(t => [t.latitude, t.longitude]);

  return (
    <div>
      <Breadcrumb items={[{ to:'/animals', label:'Animals' }, { label:animal.animalId }]} />

      {/* Header */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>
          <div style={{ width:72, height:72, background:'var(--primary-bg)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, flexShrink:0 }}>
            {animal.latestImage ? <img src={`http://localhost:5000${animal.latestImage}`} alt="Buffalo" style={{width:'100%', height:'100%', borderRadius:'var(--radius-lg)', objectFit:'cover'}} /> : ''}
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
              <h1 style={{ fontSize:20, fontWeight:700, color:'var(--gray-900)', margin:0 }}>{animal.animalId}</h1>
              <StatusBadge status={animal.status} />
              {animal.gpsFix && <span className="badge badge-success"> GPS</span>}
            </div>
            <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--gray-500)', marginBottom:10 }}>RFID: {animal.rfidUid}</div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:13 }}>
              <div><span style={{ color:'var(--gray-500)' }}>Breed:</span> <strong style={{ textTransform:'capitalize' }}>{animal.breed || 'Not available'}</strong></div>
              <div><span style={{ color:'var(--gray-500)' }}>Confidence:</span> <strong style={{ color:confidenceColor }}>{animal.breedConfidence ? `${animal.breedConfidence.toFixed(1)}%` : 'Not available'}</strong></div>
              <div><span style={{ color:'var(--gray-500)' }}>Sex:</span> <strong style={{ textTransform:'capitalize' }}>{animal.sex || 'Not available'}</strong></div>
              <div><span style={{ color:'var(--gray-500)' }}>Age:</span> <strong>{animal.age ? formatAge(animal.age) : 'Not available'}</strong></div>
              <div><span style={{ color:'var(--gray-500)' }}>Owner:</span> <strong>{animal.ownerName || 'Not available'}</strong></div>
              <div><span style={{ color:'var(--gray-500)' }}>Location:</span> <strong>{[animal.village, animal.district, animal.state].filter(Boolean).join(', ') || 'Not available'}</strong></div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to={`/detections?animal=${animal.animalId}`} className="btn btn-primary btn-sm"> Run Detection</Link>
            <Link to="/tracking" className="btn btn-secondary btn-sm"> Track</Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:0 }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {{ overview:'Overview', location:'Location & GPS', detections:'Detections', history:'Tracking History' }[tab]}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid-cols-2" style={{ gap:16 }}>
            {/* Identity */}
            <div className="card">
              <div className="card-header"><span style={{ fontWeight:600 }}>🪪 Identity</span></div>
              <div className="card-body">
                {[
                  ['Animal ID', animal.animalId || 'Not available', { fontFamily:'monospace', fontWeight:600, color:'var(--primary)' }],
                  ['RFID UID', animal.rfidUid || 'Not available', { fontFamily:'monospace', fontSize:12 }],
                  ['Breed', <span style={{ textTransform:'capitalize' }}>{animal.breed || 'Not available'}</span>],
                  ['Breed Confidence', <ConfidenceBadge confidence={animal.breedConfidence} />],
                  ['Sex', <span style={{ textTransform:'capitalize' }}>{animal.sex || 'Not available'}</span>],
                  ['Age', animal.age ? formatAge(animal.age) : 'Not available'],
                  ['Status', <StatusBadge status={animal.status} />],
                ].map(([k, v, s]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:13, color:'var(--gray-500)' }}>{k}</span>
                    <span style={{ fontSize:13, fontWeight:500, ...s }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ownership */}
            <div className="card">
              <div className="card-header"><span style={{ fontWeight:600 }}> Ownership</span></div>
              <div className="card-body">
                {[
                  ['Owner Name', animal.ownerName || 'Not available'],
                  ['Village', animal.village || 'Not available'],
                  ['District', animal.district || 'Not available'],
                  ['State', animal.state || 'Not available'],
                  ['Last Detection', animal.lastDetectionTime ? formatRelativeTime(animal.lastDetectionTime) : 'Not available'],
                  ['Last Record Update', animal.updatedAt ? formatRelativeTime(animal.updatedAt) : 'Not available'],
                  ['Last GPS Update', animal.lastGpsUpdate ? formatDateTime(animal.lastGpsUpdate) : 'Not available'],
                ].map(([k, v, s]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:13, color:'var(--gray-500)' }}>{k}</span>
                    <span style={{ fontSize:13, fontWeight:500, ...s }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest detection */}
            {detections.length > 0 && (
              <div className="card" style={{ gridColumn:'span 2' }}>
                <div className="card-header"><span style={{ fontWeight:600 }}> Latest AI Detection</span></div>
                <div className="card-body">
                  <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                      <div style={{ width:120, height:120, background:'var(--gray-100)', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, overflow:'hidden' }}>
                        {detections[0].imageUrl ? (
                          <img src={`http://localhost:5000${detections[0].imageUrl}`} alt="Detection" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        ) : ''}
                      </div>
                      <span style={{ fontSize:11, color:'var(--gray-400)' }}>Latest image</span>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontSize:18, fontWeight:700, color:'var(--gray-900)', textTransform:'capitalize', marginBottom:4 }}>{detections[0].breed}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                        <ConfidenceBadge confidence={detections[0].confidence} />
                        <span style={{ fontSize:12, color:'var(--gray-500)' }}>{formatDateTime(detections[0].timestamp)}</span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--gray-700)', marginBottom:8 }}>Top Predictions</div>
                      {(detections[0].topPredictions || []).map((p, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                          <span style={{ fontSize:12, width:100, textTransform:'capitalize', color:'var(--gray-700)' }}>{i+1}. {p.breed}</span>
                          <div className="progress-bar" style={{ flex:1 }}>
                            <div className="progress-fill" style={{ width:`${p.confidence}%`, background:i===0?'var(--primary)':'var(--gray-300)' }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)', width:40, textAlign:'right' }}>{p.confidence.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        {activeTab === 'location' && (
          <div className="grid-cols-2" style={{ gap:16 }}>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight:600 }}> GPS Data</span></div>
              <div className="card-body">
                {[
                  ['GPS Fix', <GPSBadge gpsFix={animal.gpsFix} satellites={animal.satellites} />],
                  ['Satellites', animal.satellites || 0],
                  ['Latitude', formatCoord(animal.latitude)],
                  ['Longitude', formatCoord(animal.longitude)],
                  ['Last GPS Update', formatDateTime(animal.lastGpsUpdate)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:13, color:'var(--gray-500)' }}>{k}</span>
                    <span style={{ fontSize:13, fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ overflow:'hidden' }}>
              <div className="card-header"><span style={{ fontWeight:600 }}>🗺 Current Location</span></div>
              <div style={{ height:300 }}>
                {animal.gpsFix ? (
                  <MapContainer center={mapCenter} zoom={13} style={{ height:'100%', width:'100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                    <Marker position={[animal.latitude, animal.longitude]}>
                      <Popup>{animal.animalId}<br />{animal.breed}</Popup>
                    </Marker>
                    {trackPath.length > 1 && <Polyline positions={trackPath} color="var(--primary)" weight={3} opacity={0.7} />}
                  </MapContainer>
                ) : (
                  <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gray-100)', color:'var(--gray-500)' }}>
                    No GPS coordinates available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detections */}
        {activeTab === 'detections' && (
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight:600 }}>Detection History</span>
              <span className="badge badge-primary">{detections.length} records</span>
            </div>
            {detections.length === 0 ? (
              <div style={{ padding:'40px 0' }}><div className="state-container"><div className="state-icon"></div><div className="state-title">No detections yet</div></div></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Breed</th><th>Confidence</th><th>Source</th><th>Location</th><th>Processing</th><th>Date/Time</th></tr>
                  </thead>
                  <tbody>
                    {detections.map(d => (
                      <tr key={d._id}>
                        <td style={{ textTransform:'capitalize', fontWeight:600 }}>{d.breed}</td>
                        <td><ConfidenceBadge confidence={d.confidence} /></td>
                        <td style={{ fontSize:12 }}>{d.inferenceSource || 'manual'}</td>
                        <td style={{ fontSize:12 }}>{d.location || '—'}</td>
                        <td style={{ fontSize:12, color:'var(--gray-500)' }}>{d.processingTimeMs ? `${d.processingTimeMs}ms` : '—'}</td>
                        <td style={{ fontSize:12, color:'var(--gray-500)' }}>{formatDateTime(d.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight:600 }}>Tracking History (Last 50)</span>
              <span className="badge badge-primary">{tracking.length} records</span>
            </div>
            {tracking.length === 0 ? (
              <div style={{ padding:'40px 0' }}><div className="state-container"><div className="state-icon"></div><div className="state-title">No tracking history</div></div></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Timestamp</th><th>Latitude</th><th>Longitude</th><th>GPS Fix</th><th>Satellites</th></tr>
                  </thead>
                  <tbody>
                    {tracking.map(t => (
                      <tr key={t._id}>
                        <td style={{ fontSize:12 }}>{formatDateTime(t.timestamp)}</td>
                        <td style={{ fontFamily:'monospace', fontSize:12 }}>{formatCoord(t.latitude)}</td>
                        <td style={{ fontFamily:'monospace', fontSize:12 }}>{formatCoord(t.longitude)}</td>
                        <td><GPSBadge gpsFix={t.gpsFix} satellites={t.satellites} /></td>
                        <td>{t.satellites || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
