import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { StatusBadge, ConfidenceBadge, GPSBadge } from '../components/Badges';
import { ErrorState, LoadingState } from '../components/States';
import { ML_SUPPORTED_BREEDS, OTHER_BREEDS } from '../data/mockData';
import { formatRelativeTime, capitalizeBreed } from '../utils/formatters';
import { animalsAPI } from '../services/api';
import { getSocket } from '../services/socket';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid var(--bg-panel);box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize:[28,28], iconAnchor:[14,28], popupAnchor:[0,-28]
});

const onlineIcon = createIcon('var(--success)');
const offlineIcon = createIcon('var(--gray-500)');

function FitBounds({ animals }) {
  const map = useMap();
  const fixed = animals.filter(a => a.gpsFix);
  useEffect(() => {
    if (fixed.length === 0) return;
    const bounds = L.latLngBounds(fixed.map(a => [a.latitude, a.longitude]));
    map.fitBounds(bounds.pad(0.2));
  }, [fixed, map]);
  return null;
}

export default function TrackingPage() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchAnimals = async () => {
    try {
      setError('');
      // Fetch all animals for the map (or up to a high limit)
      const res = await animalsAPI.getAll({ limit: 1000 });
      setAnimals(res.data.data.animals);
    } catch (err) {
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onTracking = (track) => {
      setAnimals(prev => prev.map(a => {
        if (a.animalId === track.animalId) {
          return {
            ...a,
            gpsFix: track.gpsFix,
            latitude: track.gpsFix ? track.latitude : a.latitude,
            longitude: track.gpsFix ? track.longitude : a.longitude,
            satellites: track.satellites,
            status: 'online',
            lastGpsUpdate: track.timestamp
          };
        }
        return a;
      }));
    };
    const onAnimal = (updatedAnimal) => {
      setAnimals(prev => prev.map(a => a.animalId === updatedAnimal.animalId ? updatedAnimal : a));
    };
    socket.on('tracking:updated', onTracking);
    socket.on('animal:updated', onAnimal);
    return () => {
      socket.off('tracking:updated', onTracking);
      socket.off('animal:updated', onAnimal);
    };
  }, []);

  const filtered = useMemo(() => {
    let data = animals; // all animals
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(a => a.animalId.toLowerCase().includes(q) || (a.rfidUid && a.rfidUid.toLowerCase().includes(q)));
    }
    if (filterBreed) data = data.filter(a => a.breed === filterBreed);
    if (filterStatus) data = data.filter(a => a.status === filterStatus);
    return data;
  }, [animals, search, filterBreed, filterStatus]);

  const gpsAnimals = filtered.filter(a => a.gpsFix && a.latitude != null && a.longitude != null);
  const selectedAnimal = selected ? animals.find(a => a.animalId === selected) : null;

  if (loading) return <LoadingState message="Loading map data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAnimals} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Live Tracking</div>
          <div className="page-subtitle">{gpsAnimals.length} animals with GPS fix</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:16, height:'calc(100vh - 220px)', minHeight:500 }}>
        {/* Sidebar */}
        <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
          {/* Filters */}
          <div className="card" style={{ padding:14, display:'flex', flexDirection:'column', gap:8 }}>
            <div className="search-bar">
              <span className="search-icon"></span>
              <input placeholder="Search animal ID or RFID…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-input" value={filterBreed} onChange={e => setFilterBreed(e.target.value)}>
              <option value="">All Breeds</option>
              <optgroup label="AI Supported">
                {ML_SUPPORTED_BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
              </optgroup>
              <optgroup label="Other">
                {OTHER_BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
              </optgroup>
            </select>
            <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Animal list */}
          <div className="card" style={{ flex:1, overflow:'auto' }}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--gray-100)', fontSize:12, fontWeight:600, color:'var(--gray-500)' }}>
              {filtered.length} animals
            </div>
            {filtered.map(a => (
              <div key={a.animalId}
                onClick={() => setSelected(a.animalId)}
                style={{ padding:'10px 14px', borderBottom:'1px solid var(--gray-100)', cursor:'pointer', background:selected===a.animalId?'var(--primary-bg)':'transparent', transition:'background 0.15s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:a.status==='online'?'var(--success)':'var(--gray-500)', flexShrink:0 }} />
                  <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'var(--primary)', flex:1 }}>{a.animalId}</span>
                  {a.gpsFix ? <span style={{ fontSize:10, color:'var(--success)' }}></span> : <span style={{ fontSize:10, color:'var(--gray-400)' }}>GPS</span>}
                </div>
                <div style={{ fontSize:12, textTransform:'capitalize', color:'var(--gray-600)' }}>{a.breed || 'Unknown'}</div>
                <div style={{ fontSize:11, color:'var(--gray-400)' }}>{formatRelativeTime(a.lastGpsUpdate || a.updatedAt)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ flex:1, borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--gray-200)', position:'relative' }}>
            <MapContainer center={[22.5, 78.9]} zoom={5} style={{ height:'100%', width:'100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
              {gpsAnimals.length > 0 && <FitBounds animals={gpsAnimals} />}
              {gpsAnimals.map(a => (
                <Marker key={a.animalId} position={[a.latitude, a.longitude]}
                  icon={a.status === 'online' ? onlineIcon : offlineIcon}
                  eventHandlers={{ click: () => setSelected(a.animalId) }}>
                  <Popup>
                    <div style={{ minWidth:180, fontFamily:'var(--font)' }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'var(--primary)', marginBottom:4 }}>{a.animalId}</div>
                      <div style={{ fontSize:12 }}><strong>RFID:</strong> {a.rfidUid}</div>
                      <div style={{ fontSize:12, textTransform:'capitalize' }}><strong>Breed:</strong> {a.breed || 'Unknown'}</div>
                      <div style={{ fontSize:12 }}><strong>Owner:</strong> {a.ownerName || '—'}</div>
                      <div style={{ fontSize:12 }}><strong>GPS:</strong> {a.latitude?.toFixed(4)}, {a.longitude?.toFixed(4)}</div>
                      <div style={{ fontSize:12 }}><strong>Satellites:</strong> {a.satellites || 0}</div>
                      <Link to={`/animals/${a.animalId}`} style={{ fontSize:12, color:'var(--primary)', display:'block', marginTop:6 }}>View details →</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Selected animal details */}
          {selectedAnimal && (
            <div className="card" style={{ padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--gray-900)' }}>{selectedAnimal.animalId}</div>
                  <div style={{ fontSize:12, color:'var(--gray-500)' }}>{selectedAnimal.rfidUid}</div>
                </div>
                <StatusBadge status={selectedAnimal.status} />
                <GPSBadge gpsFix={selectedAnimal.gpsFix} satellites={selectedAnimal.satellites} />
                <ConfidenceBadge confidence={selectedAnimal.breedConfidence} />
                <div style={{ fontSize:12, color:'var(--gray-500)' }}>
                  {selectedAnimal.gpsFix ? ` ${selectedAnimal.latitude?.toFixed(4)}, ${selectedAnimal.longitude?.toFixed(4)}` : 'No GPS Fix'}
                </div>
                <div style={{ fontSize:12, color:'var(--gray-500)', textTransform:'capitalize' }}> {selectedAnimal.breed || 'Unknown'}</div>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <Link to={`/animals/${selectedAnimal.animalId}`} className="btn btn-primary btn-sm">View Details</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>X</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
