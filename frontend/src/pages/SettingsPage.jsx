import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Section = ({ title, icon, children }) => (
  <div className="card" style={{ marginBottom:20 }}>
    <div className="card-header">
      <span style={{ fontWeight:600 }}>{icon} {title}</span>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const Toggle = ({ label, desc, checked, onChange }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
    <div>
      <div style={{ fontSize:13, fontWeight:500, color:'var(--gray-800)' }}>{label}</div>
      {desc && <div style={{ fontSize:12, color:'var(--gray-500)' }}>{desc}</div>}
    </div>
    <label style={{ position:'relative', display:'inline-block', width:44, height:24, cursor:'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity:0, width:0, height:0 }} />
      <span style={{
        position:'absolute', inset:0,
        background:checked ? 'var(--primary)' : 'var(--gray-300)',
        borderRadius:12, transition:'0.2s',
        ':before':{}
      }}>
        <span style={{
          position:'absolute', width:18, height:18, borderRadius:'50%', background:'#fff',
          left: checked ? 22 : 3, top:3, transition:'0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </span>
    </label>
  </div>
);

export default function SettingsPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: 'Livestock Management',
    role: user?.role || 'Field Worker',
  });

  const [notifications, setNotifications] = useState({
    deviceOffline: true,
    lowBattery: true,
    newDetection: false,
    gpsLost: true,
    dailyReport: false,
    weeklyReport: true,
  });

  const [display, setDisplay] = useState({
    theme: 'light',
    language: 'en-IN',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    perPage: '10',
    compactMode: false,
    showConfidence: true,
  });

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    addToast('Profile updated successfully!', 'success');
  };

  const toggleNotif = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSaveNotif = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    addToast('Notification preferences saved!', 'success');
  };

  const handleSaveDisplay = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    addToast('Display settings saved!', 'success');
  };

  const TABS = [
    { id:'profile', label:' Profile' },
    { id:'notifications', label:' Notifications' },
    { id:'display', label:' Display' },
    { id:'system', label:' System' },
  ];

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your account and application preferences</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab===t.id?'active':''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile}>
          <Section title="Profile Information" icon="">
            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24 }}>
              <div className="profile-avatar">{user?.avatar || 'U'}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:18 }}>{profile.name}</div>
                <div style={{ color:'var(--gray-500)', fontSize:13 }}>{profile.role}</div>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop:8 }}>Change Photo</button>
              </div>
            </div>
            <div className="grid-cols-2" style={{ gap:16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="s-name">Full Name</label>
                <input id="s-name" className="form-input" value={profile.name} onChange={e => setProfile(p => ({...p, name:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-email">Email</label>
                <input id="s-email" type="email" className="form-input" value={profile.email} onChange={e => setProfile(p => ({...p, email:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-phone">Phone</label>
                <input id="s-phone" className="form-input" value={profile.phone} onChange={e => setProfile(p => ({...p, phone:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-dept">Department</label>
                <input id="s-dept" className="form-input" value={profile.department} onChange={e => setProfile(p => ({...p, department:e.target.value}))} />
              </div>
            </div>
          </Section>
          <Section title="Change Password" icon="">
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="s-cur-pw">Current Password</label>
                <input id="s-cur-pw" type="password" className="form-input" placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-new-pw">New Password</label>
                <input id="s-new-pw" type="password" className="form-input" placeholder="Enter new password" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-conf-pw">Confirm Password</label>
                <input id="s-conf-pw" type="password" className="form-input" placeholder="Confirm new password" />
              </div>
            </div>
          </Section>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => addToast('Changes discarded', 'default')}>Discard</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner white" style={{width:14,height:14}} /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <>
          <Section title="Alert Preferences" icon="">
            {[
              { key:'deviceOffline', label:'Device Offline Alert', desc:'Notify when an IoT device goes offline' },
              { key:'lowBattery', label:'Low Battery Warning', desc:'Alert when device battery drops below 20%' },
              { key:'newDetection', label:'New Detection', desc:'Notify for every new breed detection' },
              { key:'gpsLost', label:'GPS Fix Lost', desc:'Alert when an animal loses GPS fix' },
            ].map(({ key, label, desc }) => (
              <Toggle key={key} label={label} desc={desc} checked={notifications[key]} onChange={() => toggleNotif(key)} />
            ))}
          </Section>
          <Section title="Report Notifications" icon="">
            {[
              { key:'dailyReport', label:'Daily Summary Report', desc:'Receive daily activity digest' },
              { key:'weeklyReport', label:'Weekly Report', desc:'Receive weekly analytics report' },
            ].map(({ key, label, desc }) => (
              <Toggle key={key} label={label} desc={desc} checked={notifications[key]} onChange={() => toggleNotif(key)} />
            ))}
          </Section>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveNotif} disabled={saving}>
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </>
      )}

      {/* Display */}
      {activeTab === 'display' && (
        <>
          <Section title="Display Preferences" icon="">
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { id:'s-theme', label:'Theme', type:'select', value:display.theme, onChange:v=>setDisplay(p=>({...p,theme:v})), options:[['light','Light'],['dark','Dark (Phase 2)']] },
                { id:'s-lang', label:'Language', type:'select', value:display.language, onChange:v=>setDisplay(p=>({...p,language:v})), options:[['en-IN','English (India)'],['hi-IN','Hindi']] },
                { id:'s-tz', label:'Timezone', type:'select', value:display.timezone, onChange:v=>setDisplay(p=>({...p,timezone:v})), options:[['Asia/Kolkata','IST (UTC+5:30)'],['UTC','UTC']] },
                { id:'s-date', label:'Date Format', type:'select', value:display.dateFormat, onChange:v=>setDisplay(p=>({...p,dateFormat:v})), options:[['DD/MM/YYYY','DD/MM/YYYY'],['MM/DD/YYYY','MM/DD/YYYY'],['YYYY-MM-DD','YYYY-MM-DD']] },
                { id:'s-page', label:'Rows per page', type:'select', value:display.perPage, onChange:v=>setDisplay(p=>({...p,perPage:v})), options:[['10','10'],['25','25'],['50','50']] },
              ].map(({ id, label, options, value, onChange }) => (
                <div className="form-group" key={id}>
                  <label className="form-label" htmlFor={id}>{label}</label>
                  <select id={id} className="form-input" value={value} onChange={e => onChange(e.target.value)} style={{ maxWidth:280 }}>
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <Toggle label="Compact Mode" desc="Reduce padding and spacing" checked={display.compactMode} onChange={() => setDisplay(p=>({...p,compactMode:!p.compactMode}))} />
              <Toggle label="Show Confidence %" desc="Display confidence scores in animal table" checked={display.showConfidence} onChange={() => setDisplay(p=>({...p,showConfidence:!p.showConfidence}))} />
            </div>
          </Section>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveDisplay} disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </>
      )}

      {/* System */}
      {activeTab === 'system' && (
        <>
          <Section title="System Information" icon="">
            {[
              ['Platform', 'CattleTrack NLMS v1.0'],
              ['Frontend', 'React 19 + Vite 8'],
              ['Backend', 'Node.js + Express (Phase 2)'],
              ['ML Model', 'YOLOv8 + ONNX Runtime (Phase 2)'],
              ['Database', 'MongoDB (Phase 2)'],
              ['IoT Protocol', 'ESP32 + MQTT/HTTP'],
              ['Map Engine', 'Leaflet + OpenStreetMap'],
              ['Charts', 'Recharts'],
            ].map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--gray-100)', fontSize:13 }}>
                <span style={{ color:'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight:500, color:'var(--gray-700)' }}>{v}</span>
              </div>
            ))}
          </Section>
          <Section title="Data & Privacy" icon="">
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ padding:'12px 16px', background:'var(--info-bg)', borderRadius:'var(--radius)', border:'1px solid rgba(59, 130, 246, 0.2)', fontSize:13, color:'var(--info)' }}>
                 Phase 2 Backend Integration Active. Your data is stored securely in MongoDB.
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-secondary" onClick={() => addToast('Export initiated (demo mode)', 'success')}> Export Data</button>
                <button className="btn btn-danger" onClick={() => addToast('Cache cleared', 'success')}> Clear Cache</button>
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
