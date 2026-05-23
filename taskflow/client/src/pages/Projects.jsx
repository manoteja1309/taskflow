import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4'];

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/projects').then(d => setProjects(d.projects)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/projects', form);
      setShowModal(false); setForm({ name: '', description: '', color: '#6366f1' });
      load();
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? All tasks will be removed.')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x.id !== id));
  };

  if (loading) return <div className="loading-screen" style={{minHeight:'60vh'}}><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{minHeight:'50vh'}}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <p>No projects yet</p>
          {user.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create first project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div className="project-card" key={p.id}>
              <div className="project-header" style={{borderBottom: `2px solid ${p.color}`}}>
                <div className="project-color-dot" style={{background: p.color}} />
                <div className="project-info">
                  <Link to={`/projects/${p.id}`} className="project-name">{p.name}</Link>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
                {user.role === 'admin' && (
                  <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(p.id)} title="Delete">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                )}
              </div>
              {p.description && <p className="project-desc">{p.description}</p>}
              <div className="project-stats">
                <div className="proj-stat">
                  <strong>{p.task_count}</strong>
                  <span>Tasks</span>
                </div>
                <div className="proj-stat">
                  <strong style={{color:'var(--green)'}}>{p.done_count}</strong>
                  <span>Done</span>
                </div>
                <div className="proj-stat">
                  <strong style={{color:'var(--accent)'}}>{p.member_count}</strong>
                  <span>Members</span>
                </div>
              </div>
              {p.task_count > 0 && (
                <div className="proj-progress">
                  <div className="progress-track">
                    <div className="progress-fill"
                      style={{width: `${Math.round((p.done_count/p.task_count)*100)}%`, background: p.color}} />
                  </div>
                  <span style={{fontSize:'0.75rem',color:'var(--text3)'}}>
                    {Math.round((p.done_count/p.task_count)*100)}%
                  </span>
                </div>
              )}
              <div className="project-footer">
                <span style={{color:'var(--text3)',fontSize:'0.8rem'}}>
                  by {p.owner_name}
                </span>
                <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">Open →</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-group">
                  <label className="label">Project Name *</label>
                  <input className="input-field" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Website Redesign" required />
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea className="input-field" rows={3} value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="What's this project about?" style={{resize:'vertical'}} />
                </div>
                <div className="form-group">
                  <label className="label">Color</label>
                  <div className="color-picker">
                    {COLORS.map(c => (
                      <button type="button" key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                        style={{background: c}} onClick={() => setForm({...form, color: c})} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
