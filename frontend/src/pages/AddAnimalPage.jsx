import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Breadcrumb from '../components/Breadcrumb';
import { ML_SUPPORTED_BREEDS, OTHER_BREEDS, DISTRICTS, STATES } from '../data/mockData';
import { capitalizeBreed } from '../utils/formatters';
import { animalsAPI } from '../services/api';

const INITIAL = { rfidUid:'', breed:'', sex:'', age:'', ownerName:'', village:'', district:'', state:'Maharashtra', weight:'', breedConfidence:'' };

export default function AddAnimalPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdAnimal, setCreatedAnimal] = useState(null);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.rfidUid) e.rfidUid = 'RFID UID is required.';
    else if (!/^([0-9A-Fa-f]{2}:){3}[0-9A-Fa-f]{2}$/.test(form.rfidUid)) e.rfidUid = 'Format: XX:XX:XX:XX (hex)';
    if (form.age && (isNaN(form.age) || form.age < 0)) e.age = 'Age must be a positive number.';
    if (form.weight && (isNaN(form.weight) || form.weight < 0)) e.weight = 'Weight must be a positive number.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    
    try {
      setSubmitting(true);
      const res = await animalsAPI.create({
        rfidUid: form.rfidUid,
        breed: form.breed || undefined,
        sex: form.sex || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        ownerName: form.ownerName || undefined,
        village: form.village || undefined,
        district: form.district || undefined,
        state: form.state || undefined,
        weight: form.weight ? parseInt(form.weight) : undefined,
        breedConfidence: form.breedConfidence ? parseFloat(form.breedConfidence) : undefined,
      });
      setCreatedAnimal(res.data.data.animal);
      setSuccess(true);
      addToast(`Animal ${res.data.data.animal.animalId} registered successfully!`, 'success');
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Failed to create animal' });
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ id, label, required, children, error, hint }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}{required && <span className="required">*</span>}
      </label>
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );

  if (success && createdAnimal) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', gap:16 }}>
        <div style={{ fontSize:64 }}></div>
        <div style={{ fontSize:22, fontWeight:700, color:'var(--gray-900)' }}>Animal Registered!</div>
        <div style={{ color:'var(--gray-500)', fontSize:14 }}>{createdAnimal.animalId} has been added to the system.</div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/animals')}>View Animals</button>
          <button className="btn btn-secondary" onClick={() => { setForm(INITIAL); setSuccess(false); setCreatedAnimal(null); }}>Add Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <Breadcrumb items={[{ to:'/animals', label:'Animals' }, { label:'Add Animal' }]} />

      <div className="page-header">
        <div>
          <div className="page-title">Add New Animal</div>
          <div className="page-subtitle">Register a new buffalo with RFID identification</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {errors.api && (
          <div style={{ background:'var(--danger-bg)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'var(--danger)', fontSize:13 }}>
            {errors.api}
          </div>
        )}

        {/* Identity */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span style={{ fontWeight:600 }}> Animal Identity</span></div>
          <div className="card-body">
            <div className="grid-cols-2" style={{ gap:16 }}>
              <Field id="rfidUid" label="RFID UID" required error={errors.rfidUid} hint="Format: XX:XX:XX:XX (e.g., 21:39:05:6E)">
                <input id="rfidUid" className={`form-input ${errors.rfidUid?'error':''}`}
                  value={form.rfidUid} onChange={set('rfidUid')} placeholder="21:39:05:6E"
                  style={{ textTransform:'uppercase' }} maxLength={11} />
              </Field>

              <Field id="breed" label="Breed">
                <select id="breed" className="form-input" value={form.breed} onChange={set('breed')}>
                  <option value="">Select breed (optional)</option>
                  <optgroup label="Supported by AI Model">
                    {ML_SUPPORTED_BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
                  </optgroup>
                  <optgroup label="Other Breeds (Not supported by model)">
                    {OTHER_BREEDS.map(b => <option key={b} value={b}>{capitalizeBreed(b)}</option>)}
                  </optgroup>
                </select>
              </Field>

              <Field id="sex" label="Sex">
                <select id="sex" className="form-input" value={form.sex} onChange={set('sex')}>
                  <option value="">Select sex</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </Field>

              <Field id="age" label="Age (months)" error={errors.age}>
                <input id="age" type="number" className={`form-input ${errors.age?'error':''}`}
                  value={form.age} onChange={set('age')} placeholder="e.g., 36" min="0" max="240" />
              </Field>

              <Field id="weight" label="Weight (kg)" error={errors.weight}>
                <input id="weight" type="number" className={`form-input ${errors.weight?'error':''}`}
                  value={form.weight} onChange={set('weight')} placeholder="e.g., 420" min="0" />
              </Field>
            </div>
          </div>
        </div>

        {/* Ownership */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header"><span style={{ fontWeight:600 }}> Ownership Details</span></div>
          <div className="card-body">
            <div className="grid-cols-2" style={{ gap:16 }}>
              <Field id="ownerName" label="Owner Name">
                <input id="ownerName" className="form-input" value={form.ownerName} onChange={set('ownerName')} placeholder="Full name" />
              </Field>
              <Field id="village" label="Village">
                <input id="village" className="form-input" value={form.village} onChange={set('village')} placeholder="Village name" />
              </Field>
              <Field id="district" label="District">
                <select id="district" className="form-input" value={form.district} onChange={set('district')}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field id="state" label="State">
                <select id="state" className="form-input" value={form.state} onChange={set('state')}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/animals')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><span className="spinner white" style={{width:14,height:14}} /> Registering…</> : '+ Register Animal'}
          </button>
        </div>
      </form>
    </div>
  );
}
