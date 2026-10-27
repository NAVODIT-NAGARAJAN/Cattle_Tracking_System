import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ConfidenceBadge } from '../components/Badges';
import { detectionsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { capitalizeBreed, formatRelativeTime } from '../utils/formatters';

export default function DetectionsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const prefillAnimalId = searchParams.get('animal') || '';

  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [animalId, setAnimalId] = useState(prefillAnimalId);
  const [rfidUid, setRfidUid] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const [autoResult, setAutoResult] = useState(null);
  const [autoLoading, setAutoLoading] = useState(true);
  const [autoImgError, setAutoImgError] = useState(false);

  const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api$/, '');
  };

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    let mounted = true;
    detectionsAPI.getLatest(1).then(res => {
      if (!mounted) return;
      const latest = res.data.data.detections?.[0];
      if (latest) {
        setAutoResult(latest);
        setAutoImgError(false);
      }
      setAutoLoading(false);
    }).catch(() => {
      if (mounted) setAutoLoading(false);
    });

    const socket = getSocket();
    const onDetection = (det) => {
      setAutoResult(det);
      setAutoImgError(false);
    };
    socket.on('detection:created', onDetection);
    return () => {
      mounted = false;
      socket.off('detection:created', onDetection);
    };
  }, []);

  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      addToast('Please select a valid image file', 'error');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);
    if (animalId) formData.append('animalId', animalId);
    if (rfidUid) formData.append('rfidUid', rfidUid);

    try {
      const res = await detectionsAPI.predict(formData);
      setResult(res.data.data);
      addToast('Detection successful!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Inference failed. Is the model loaded?');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setError('');
    setAnimalId('');
    setRfidUid('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Run AI Detection</div>
          <div className="page-subtitle">Upload buffalo image to classify breed using YOLO11-cls</div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap:24 }}>
        {/* Left: Upload area */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ fontWeight:600, marginBottom:16 }}>1. Select Image</div>
          
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border:'2px dashed var(--gray-300)',
              borderRadius:'var(--radius-lg)',
              padding:32, textAlign:'center',
              background:preview?'#000':'var(--gray-50)',
              cursor:'pointer', position:'relative',
              overflow:'hidden', minHeight:300,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
            }}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }} />
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.9)' }}
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:40, marginBottom:12 }}></div>
                <div style={{ fontWeight:600, color:'var(--gray-700)' }}>Click or drag image here</div>
                <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:4 }}>JPG, PNG up to 10MB</div>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={e => handleFile(e.target.files?.[0])} accept="image/*" style={{ display:'none' }} />
          </div>

          <div style={{ marginTop:24 }}>
            <div style={{ fontWeight:600, marginBottom:12 }}>2. Link Animal (Optional)</div>
            <div className="grid-cols-2" style={{ gap:12 }}>
              <input className="form-input" placeholder="Animal ID (e.g. BUF-1A2B)" value={animalId} onChange={e => setAnimalId(e.target.value)} />
              <input className="form-input" placeholder="RFID UID" value={rfidUid} onChange={e => setRfidUid(e.target.value)} />
            </div>
            <div style={{ fontSize:11, color:'var(--gray-500)', marginTop:6 }}>
              If provided, the detection result will automatically update the animal&apos;s record.
            </div>
          </div>

          <button className="btn btn-primary" style={{ width:'100%', marginTop:24, padding:'12px', fontSize:15 }}
            disabled={!file || loading} onClick={handleUpload}>
            {loading ? <><span className="spinner white" /> Processing with ONNX…</> : 'Run ML Prediction'}
          </button>
        </div>

        {/* Right: Results */}
        <div>
          {error && (
            <div className="card" style={{ padding:24, background:'var(--danger-bg)', border:'1px solid rgba(239, 68, 68, 0.2)', color:'var(--danger)' }}>
              <div style={{ fontWeight:600, marginBottom:8 }}> Inference Error</div>
              <div style={{ fontSize:13 }}>{error}</div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="card" style={{ padding:'60px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--gray-400)' }}>
              <div style={{ fontSize:48, marginBottom:16 }}></div>
              <div style={{ fontWeight:600, color:'var(--gray-600)' }}>Awaiting Image</div>
              <div style={{ fontSize:13 }}>Upload an image and run prediction to see ML results here.</div>
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding:'60px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%' }}>
              <div className="spinner lg" style={{ marginBottom:16 }} />
              <div style={{ fontWeight:600, color:'var(--gray-700)' }}>Running ML Model…</div>
              <div style={{ fontSize:13, color:'var(--gray-500)' }}>Preprocessing image and running ONNX inference</div>
            </div>
          )}

          {result && (
            <div className="card" style={{ padding:24, borderTop:'4px solid var(--primary)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>Predicted Breed</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'var(--gray-900)', textTransform:'capitalize' }}>{result.breed}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <ConfidenceBadge confidence={result.confidence} />
                  <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:4 }}>{result.processingTimeMs}ms processing</div>
                </div>
              </div>

              <div style={{ fontWeight:600, marginBottom:12, fontSize:13, color:'var(--gray-600)' }}>Top Predictions</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                {(result.topPredictions || []).map((p, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:12, width:100, textTransform:'capitalize', fontWeight:i===0?600:400, color:i===0?'var(--gray-900)':'var(--gray-600)' }}>
                      {i+1}. {p.breed}
                    </span>
                    <div className="progress-bar" style={{ flex:1 }}>
                      <div className="progress-fill" style={{ width:`${p.confidence}%`, background:i===0?'var(--primary)':'var(--gray-300)' }} />
                    </div>
                    <span style={{ fontSize:12, width:40, textAlign:'right', fontWeight:600 }}>{p.confidence.toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <div style={{ background:'var(--gray-50)', padding:16, borderRadius:'var(--radius)' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--gray-700)', marginBottom:8 }}>Detection Details</div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'var(--gray-500)' }}>Detection ID</span>
                    <span style={{ fontFamily:'monospace' }}>{result.detection?._id}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'var(--gray-500)' }}>Linked Animal</span>
                    <span style={{ fontFamily:'monospace' }}>{result.detection?.animalId || 'None'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'var(--gray-500)' }}>Model</span>
                    <span>YOLO11-cls (ONNX)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto ESP32 Section */}
      <div className="page-header" style={{ marginTop:40 }}>
        <div>
          <div className="page-title" style={{ fontSize:20 }}>Automatic ESP32-CAM Results</div>
          <div className="page-subtitle">Latest detection captured automatically from the IoT network</div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 40 }}>
        {autoLoading && !autoResult && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            <div className="spinner lg" style={{ marginBottom: 16 }} />
            <div>Loading latest automatic detection…</div>
          </div>
        )}
        {!autoLoading && !autoResult && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
            <div>No automatic detections found from ESP32-CAM.</div>
          </div>
        )}
        {autoResult && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', minHeight: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {autoResult.imageUrl && !autoImgError ? (
                <img 
                  src={`${getBaseUrl()}${autoResult.imageUrl}`} 
                  alt="Captured buffalo" 
                  style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'contain' }} 
                  onError={() => setAutoImgError(true)}
                />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: 'var(--gray-500)' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📵</div>
                  <span>No Image Available</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Predicted Breed</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-900)', textTransform: 'capitalize' }}>{autoResult.breed}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <ConfidenceBadge confidence={autoResult.confidence} />
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                    {autoResult.processingTimeMs ? `${autoResult.processingTimeMs}ms processing` : '—'}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: 16, borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8 }}>Detection Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Linked Animal</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{autoResult.animalId || 'None'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Detection Time</span>
                    <span>{formatRelativeTime(autoResult.timestamp)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Source</span>
                    <span style={{ textTransform: 'uppercase' }}>{autoResult.inferenceSource || 'AUTO'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
