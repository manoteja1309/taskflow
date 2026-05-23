import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Team.css';

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => api.get('/users').then(d => setUsers(d.users)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, role) => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/users/${id}/role`, { role });
      setUsers(p => p.map(u => u.id === id ? {...u, role} : u));
      setSuccess('Role updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch(err) { setError(err.message); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
    } catch(err) { setError(err.message); }
  };

  if (user.role !== 'admin') {
    return <div className="empty-state" style={{minHeight:'60vh'}}><p>Admin access required</p></div>;
  }

  if (loading) return <div className="loading-screen" style={{minHeight:'60vh'}}><div className="spinner"/></div>;

  const admins = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} members · {admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="team-grid">
        {users.map(u => {
          const initials = u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
          const isSelf = u.id === user.id;
          return (
            <div key={u.id} className={`team-card card ${isSelf ? 'self' : ''}`}>
              <div className="team-avatar" style={{background: u.avatar || '#6366f1'}}>
                {initials}
              </div>
              <div className="team-info">
                <div className="team-name">{u.name}{isSelf && <span className="you-tag">You</span>}</div>
                <div className="team-email">{u.email}</div>
                <div style={{marginTop: 6}}>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                </div>
              </div>
              {!isSelf && (
                <div className="team-actions">
                  <select className="input-field" style={{width:'auto',fontSize:'0.8125rem',padding:'6px 10px'}}
                    value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="role-info card" style={{marginTop:28}}>
        <h2 style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:16,fontSize:'1rem'}}>Role Permissions</h2>
        <div className="roles-table">
          <div className="role-row header">
            <span>Permission</span>
            <span>Admin</span>
            <span>Member</span>
          </div>
          {[
            ['Create projects', true, false],
            ['Delete projects', true, false],
            ['Manage team members', true, false],
            ['Change user roles', true, false],
            ['Create tasks', true, true],
            ['Edit own tasks', true, true],
            ['View project tasks', true, true],
            ['Comment on tasks', true, true],
          ].map(([perm, admin, member]) => (
            <div key={perm} className="role-row">
              <span>{perm}</span>
              <span>{admin ? <Check /> : <Cross />}</span>
              <span>{member ? <Check /> : <Cross />}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Check() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function Cross() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
