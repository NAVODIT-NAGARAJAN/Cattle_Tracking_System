import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');

  useEffect(() => {
    // Clear message from history so it doesn't persist on refresh
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 4) e.password = 'Password must be at least 4 characters.';
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
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  const fillDemo = () => {
    setEmail('admin@nlms.gov.in');
    setPassword('admin123');
    setErrors({});
    setError('');
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
            National Livestock Management System — Powered by IoT and AI breed recognition.
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
        <div className="login-form-card">
          <div style={{ marginBottom:32, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:8 }}></div>
            <h2 style={{ fontSize:24, fontWeight:700, color:'var(--gray-900)', marginBottom:4 }}>Welcome back</h2>
            <p style={{ color:'var(--gray-500)', fontSize:14 }}>Sign in to your NLMS account</p>
          </div>

          {/* Demo banner */}
          <div style={{ background:'var(--primary-bg)', border:'1px solid var(--primary-border)', borderRadius:8, padding:'10px 14px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--primary)' }}>Demo Access</div>
              <div style={{ fontSize:11, color:'var(--gray-600)' }}>admin@nlms.gov.in / admin123</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={fillDemo}>Fill</button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div style={{ background:'var(--danger-bg)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'var(--danger)', fontSize:13 }}>
                {error}
              </div>
            )}
            
            {successMsg && (
              <div style={{ background:'var(--success-bg)', border:'1px solid rgba(16, 185, 129, 0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'var(--success)', fontSize:13 }}>
                {successMsg}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address <span className="required">*</span></label>
                <input
                  id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                  value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})); }}
                  placeholder="admin@nlms.gov.in" autoComplete="email"
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
                    placeholder="Enter your password" autoComplete="current-password"
                    style={{ paddingRight:44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--gray-400)', cursor:'pointer', fontSize:16, padding:4 }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" style={{ background:'none', border:'none', color:'var(--primary)', fontSize:13, cursor:'pointer', fontWeight:500 }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                style={{ justifyContent:'center', marginTop:4 }}>
                {loading ? <><span className="spinner white" style={{width:16,height:16}} /> Signing in…</> : 'Sign In'}
              </button>
            </div>
          </form>

          <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:'var(--gray-500)' }}>
            Don't have an account? <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Sign up</Link>
          </div>

          <div style={{ marginTop:24, textAlign:'center', fontSize:12, color:'var(--gray-400)' }}>
            National Livestock Management System v1.0<br/>
            © 2026 Department of Animal Husbandry
          </div>
        </div>
      </div>
    </div>
  );
}
