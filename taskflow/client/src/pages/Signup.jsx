import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="8" height="8" rx="2" fill="var(--accent)" />
              <rect x="11" y="1" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.5" />
              <rect x="1" y="11" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.5" />
              <rect x="11" y="11" width="8" height="8" rx="2" fill="var(--accent)" />
            </svg>
          </div>
          <span>TaskFlow</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join your team workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input-field" type="text" placeholder="Jane Smith"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input-field" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input-field" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{background:'var(--bg3)',borderRadius:'var(--radius)',padding:'10px 14px',marginBottom:16,fontSize:'0.8125rem',color:'var(--text2)'}}>
            💡 The <strong>first user</strong> to sign up automatically becomes <strong>Admin</strong>
          </div>
          <button className="btn btn-primary btn-lg" style={{width:'100%', justifyContent:'center'}}
            type="submit" disabled={loading}>
            {loading ? <span className="spin" style={{width:16,height:16,borderWidth:2,display:'inline-block',borderStyle:'solid',borderColor:'rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%'}} /> : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
