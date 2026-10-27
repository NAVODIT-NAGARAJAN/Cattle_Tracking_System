import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge, ConfidenceBadge, GPSBadge } from '../components/Badges';
import { EmptyState, LoadingState, ErrorState } from '../components/States';
import Pagination from '../components/Pagination';
import { ConfirmationDialog } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { animalsAPI } from '../services/api';
import { BREEDS } from '../data/mockData';
import { formatRelativeTime, capitalizeBreed, formatAge } from '../utils/formatters';
import { useDebounce } from '../hooks/useLocalStorage';
import { getSocket } from '../services/socket';

const PER_PAGE = 8;

export default function AnimalsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [animals, setAnimals] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Backend supports: page, limit, search, breed, status, district
      const params = {
        page,
        limit: PER_PAGE,
        search: debouncedSearch,
        breed: filterBreed,
        status: filterStatus
      };
      const res = await animalsAPI.getAll(params);
      setAnimals(res.data.data.animals);
      setTotalItems(res.data.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load animals');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterBreed, filterStatus]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  // Socket updates
  useEffect(() => {
    const socket = getSocket();
    const onAnimal = () => fetchAnimals();
    socket.on('animal:updated', onAnimal);
    return () => socket.off('animal:updated', onAnimal);
  }, [fetchAnimals]);

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const handleDelete = async (animalId) => {
    try {
      await animalsAPI.delete(animalId);
      addToast(`Animal ${animalId} removed.`, 'success');
      setDeleteTarget(null);
      if (animals.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchAnimals();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete animal', 'error');
    }
  };

  const clearFilters = () => { setSearch(''); setFilterBreed(''); setFilterStatus(''); setPage(1); };
  const hasFilters = search || filterBreed || filterStatus;

  if (loading && animals.length === 0) return <LoadingState message="Loading animals…" />;
  if (error) return <ErrorState message={error} onRetry={fetchAnimals} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Animals</div>
          <div className="page-subtitle">{totalItems} registered buffalo animals</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary" onClick={fetchAnimals}>Refresh</button>
          <Link to="/animals/add" className="btn btn-primary">+ Add Animal</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:'14px 16px', marginBottom:16 }}>
        <div className="filter-bar">
          <div className="search-bar" style={{ flex:1, minWidth:200 }}>
            <span className="search-icon"></span>
            <input placeholder="Search by ID, RFID, breed, owner…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-input" value={filterBreed} onChange={e => { setFilterBreed(e.target.value); setPage(1); }} style={{ width:160 }}>
            <option value="">All Breeds</option>
            {BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
          </select>
          <select className="form-input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ width:130 }}>
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {animals.length === 0 ? (
          <EmptyState icon="" title="No animals found" description="Try adjusting your search or filters."
            action={hasFilters ? <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button> : null}
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Animal Details</th>
                    <th>Breed Info</th>
                    <th>Owner & Location</th>
                    <th>Status & GPS</th>
                    <th>Last Update</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {animals.map(a => (
                    <tr key={a.animalId} style={{ cursor:'pointer' }} onClick={() => navigate(`/animals/${a.animalId}`)}>
                      <td>
                        {a.latestImage ? (
                           <img src={`http://localhost:5000${a.latestImage}`} alt="Buffalo" style={{ width:44, height:44, borderRadius:'var(--radius-sm)', objectFit:'cover' }} />
                        ) : (
                           <div style={{ width:44, height:44, background:'var(--gray-100)', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--gray-500)', textAlign:'center', lineHeight:1.2 }}>No<br/>Image</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'var(--primary)' }}>{a.animalId || 'Not available'}</div>
                        <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--gray-500)', marginTop:2 }}>RFID: {a.rfidUid || 'Not available'}</div>
                        <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2, textTransform:'capitalize' }}>{a.sex || 'Not available'} • {a.age ? formatAge(a.age) : 'Not available'}</div>
                      </td>
                      <td>
                        <div style={{ textTransform:'capitalize', fontWeight:600, fontSize:13 }}>{a.breed || 'Not available'}</div>
                        <div style={{ marginTop:4 }}><ConfidenceBadge confidence={a.breedConfidence} /></div>
                      </td>
                      <td>
                        <div style={{ fontSize:13, fontWeight:500 }}>{a.ownerName || 'Not available'}</div>
                        <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2 }}>{[a.village, a.district, a.state].filter(Boolean).join(', ') || 'Not available'}</div>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                          <StatusBadge status={a.status} />
                          <GPSBadge gpsFix={a.gpsFix} satellites={a.satellites} />
                        </div>
                        <div style={{ fontSize:11, color:'var(--gray-500)' }}>
                          {a.gpsFix ? `${a.latitude?.toFixed(4)}, ${a.longitude?.toFixed(4)}` : 'Coords Not available'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize:12, color:'var(--gray-600)' }}>Detected: {a.lastDetectionTime ? formatRelativeTime(a.lastDetectionTime) : 'Not available'}</div>
                        <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2 }}>Updated: {a.updatedAt ? formatRelativeTime(a.updatedAt) : 'Not available'}</div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:4 }}>
                          <Link to={`/animals/${a.animalId}`} className="btn btn-secondary btn-sm">View</Link>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(a)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'0 16px' }}>
              <Pagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={PER_PAGE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?.animalId)}
        title="Remove Animal"
        message={`Are you sure you want to remove ${deleteTarget?.animalId}? This action cannot be undone.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
