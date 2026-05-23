import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input-field" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input-field" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary btn-lg" style={{width:'100%', justifyContent:'center'}}
            type="submit" disabled={loading}>
            {loading ? <span className="spin" style={{width:16,height:16,borderWidth:2,display:'inline-block',borderStyle:'solid',borderColor:'rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%'}} /> : 'Sign in'}
          </button>
        </form>

        <div className="auth-demo">
          <p style={{color:'var(--text3)',fontSize:'0.8rem',textAlign:'center'}}>Demo: signup first, first user gets admin role</p>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
