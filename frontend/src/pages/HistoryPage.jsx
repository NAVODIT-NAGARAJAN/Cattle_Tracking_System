import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ConfidenceBadge } from '../components/Badges';
import { EmptyState, LoadingState, ErrorState } from '../components/States';
import Pagination from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { detectionsAPI } from '../services/api';
import { formatDateTime, capitalizeBreed } from '../utils/formatters';
import { useDebounce } from '../hooks/useLocalStorage';
import { ML_SUPPORTED_BREEDS, OTHER_BREEDS } from '../data/mockData';

const PER_PAGE = 10;

export default function HistoryPage() {
  const { addToast } = useToast();
  const [detections, setDetections] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDet, setSelectedDet] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const fetchDetections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // The API supports: animalId, breed, page, limit
      // We map our free-text search to animalId for now since backend doesn't have a broad text search on detections
      const params = {
        page,
        limit: PER_PAGE,
        breed: filterBreed,
        animalId: debouncedSearch || undefined
      };
      const res = await detectionsAPI.getAll(params);
      setDetections(res.data.data.detections);
      setTotalItems(res.data.data.pagination.total);
    } catch (err) {
      setError('Failed to load detection history');
    } finally {
      setLoading(false);
    }
  }, [page, filterBreed, debouncedSearch]);

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections]);

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const clearFilters = () => { setSearch(''); setFilterBreed(''); setPage(1); };
  const hasFilters = search || filterBreed;

  if (loading && detections.length === 0) return <LoadingState message="Loading detection history…" />;
  if (error) return <ErrorState message={error} onRetry={fetchDetections} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Detection History</div>
          <div className="page-subtitle">Log of all ML inference runs and manual breed updates</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary" onClick={fetchDetections}>Refresh</button>
          <Link to="/detections" className="btn btn-primary">Run Detection</Link>
        </div>
      </div>

      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0 }}>
          {/* Filters */}
          <div className="card" style={{ padding:'14px 16px', marginBottom:16 }}>
            <div className="filter-bar">
              <div className="search-bar" style={{ flex:1, minWidth:200 }}>
                <span className="search-icon"></span>
                <input placeholder="Search by Animal ID…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="form-input" value={filterBreed} onChange={e => { setFilterBreed(e.target.value); setPage(1); }} style={{ width:160 }}>
                <option value="">All Breeds</option>
                <optgroup label="AI Supported">
                  {ML_SUPPORTED_BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
                </optgroup>
                <optgroup label="Other">
                  {OTHER_BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
                </optgroup>
              </select>
              {hasFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card">
            {detections.length === 0 ? (
              <EmptyState icon="" title="No detections found" description="Adjust filters or run a new detection." />
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Breed</th>
                        <th>Confidence</th>
                        <th>Animal ID</th>
                        <th>Source</th>
                        <th>Process Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detections.map(d => (
                        <tr key={d._id}
                            style={{ cursor:'pointer', background:selectedDet?._id === d._id ? 'var(--primary-bg)' : 'transparent' }}
                            onClick={() => setSelectedDet(d)}>
                          <td style={{ fontSize:12 }}>{formatDateTime(d.timestamp)}</td>
                          <td style={{ textTransform:'capitalize', fontWeight:500 }}>{d.breed}</td>
                          <td><ConfidenceBadge confidence={d.confidence} /></td>
                          <td>
                            {d.animalId ? (
                              <Link to={`/animals/${d.animalId}`} style={{ fontFamily:'monospace', fontWeight:600 }} onClick={e => e.stopPropagation()}>
                                {d.animalId}
                              </Link>
                            ) : <span style={{ color:'var(--gray-400)' }}>Unlinked</span>}
                          </td>
                          <td style={{ fontSize:12, textTransform:'uppercase' }}>{d.inferenceSource || 'manual'}</td>
                          <td style={{ fontSize:12, color:'var(--gray-500)' }}>{d.processingTimeMs ? `${d.processingTimeMs}ms` : '—'}</td>
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
        </div>

        {/* Detail Panel */}
        <div style={{ width:320, flexShrink:0 }}>
          {selectedDet ? (
            <div className="card" style={{ position:'sticky', top:16 }}>
              <div className="card-header" style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:600 }}>Detection Details</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDet(null)}>X</button>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ width:'100%', height:160, background:'var(--gray-100)', borderRadius:'var(--radius)', marginBottom:16, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>
                  {selectedDet.imageUrl ? (
                    <img src={`http://localhost:5000${selectedDet.imageUrl}`} alt="Detection" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  ) : ''}
                </div>
                
                <div style={{ fontSize:20, fontWeight:700, textTransform:'capitalize', marginBottom:4 }}>{selectedDet.breed}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <ConfidenceBadge confidence={selectedDet.confidence} />
                  <span style={{ fontSize:11, color:'var(--gray-500)' }}>{formatDateTime(selectedDet.timestamp)}</span>
                </div>

                <div style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)', marginBottom:8 }}>Top Predictions</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                  {(selectedDet.topPredictions || []).map((p, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, width:80, textTransform:'capitalize', color:'var(--gray-700)' }}>{p.breed}</span>
                      <div className="progress-bar" style={{ flex:1, height:6 }}>
                        <div className="progress-fill" style={{ width:`${p.confidence}%`, background:i===0?'var(--primary)':'var(--gray-300)' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, width:36, textAlign:'right' }}>{p.confidence.toFixed(1)}%</span>
                    </div>
                  ))}
                  {(!selectedDet.topPredictions || selectedDet.topPredictions.length === 0) && (
                    <div style={{ fontSize:11, color:'var(--gray-400)' }}>No top predictions data available.</div>
                  )}
                </div>

                <div style={{ background:'var(--gray-50)', padding:12, borderRadius:'var(--radius)', fontSize:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'var(--gray-500)' }}>ID</span>
                    <span style={{ fontFamily:'monospace' }}>{selectedDet._id.slice(-8)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'var(--gray-500)' }}>Animal</span>
                    <span>{selectedDet.animalId || 'None'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'var(--gray-500)' }}>Source</span>
                    <span style={{ textTransform:'uppercase' }}>{selectedDet.inferenceSource || 'manual'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--gray-500)' }}>Model</span>
                    <span>{selectedDet.modelName || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding:40, textAlign:'center', color:'var(--gray-400)', position:'sticky', top:16 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>Select an item above</div>
              <div style={{ fontSize:13 }}>Select a detection record to view full details and images.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
