import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate network
    const res = await register({ name, email, password });
    setLoading(false);
    if (res.success) {
      // Pass state to login page for success message
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div style={{ maxWidth:480, textAlign:'center' }}>
          <div style={{ fontSize:72, marginBottom:24 }}></div>
          <h1 style={{ color:'#fff', fontSize:32, fontWeight:700, marginBottom:12, lineHeight:1.2 }}>
            CattleTrack
          </h1>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:16, lineHeight:1.6, marginBottom:32 }}>
            Join the National Livestock Management System today.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, textAlign:'center' }}>
            {[
              { icon:'LT', label:'GPS Tracking', desc:'Real-time location' },
              { icon:'BD', label:'AI Detection', desc:'17 breed classes' },
              { icon:'DV', label:'IoT Devices', desc:'ESP32 network' },
            ].map(f => (
              <div key={f.label} style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:16 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{f.icon}</div>
                <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{f.label}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-card" style={{ maxWidth: 440 }}>
          <div style={{ marginBottom:24, textAlign:'center' }}>
            <h2 style={{ fontSize:24, fontWeight:700, color:'var(--gray-900)', marginBottom:4 }}>Create Account</h2>
            <p style={{ color:'var(--gray-500)', fontSize:14 }}>Register for a new field worker account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div style={{ background:'var(--danger-bg)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'var(--danger)', fontSize:13 }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name <span className="required">*</span></label>
                <input
                  id="name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
                  value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p, name:''})); }}
                  placeholder="John Doe"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address <span className="required">*</span></label>
                <input
                  id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                  value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})); }}
                  placeholder="name@example.com" autoComplete="email"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password <span className="required">*</span></label>
                <div style={{ position:'relative' }}>
                  <input
                    id="password" type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password:''})); }}
                    placeholder="At least 6 characters" autoComplete="new-password"
                    style={{ paddingRight:44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--gray-400)', cursor:'pointer', fontSize:13, padding:4 }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                <div style={{ position:'relative' }}>
                  <input
                    id="confirmPassword" type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({...p, confirmPassword:''})); }}
                    placeholder="Confirm your password" autoComplete="new-password"
                    style={{ paddingRight:44 }}
                  />
                </div>
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                style={{ justifyContent:'center', marginTop:8 }}>
                {loading ? <><span className="spinner white" style={{width:16,height:16}} /> Creating Account…</> : 'Sign Up'}
              </button>
            </div>
          </form>

          <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:'var(--gray-500)' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
