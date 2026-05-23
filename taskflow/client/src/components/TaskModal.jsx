import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './TaskModal.css';

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function TaskModal({ task, members, projectId, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title, description: task.description || '',
    status: task.status, priority: task.priority,
    assignee_id: task.assignee_id || '', due_date: task.due_date || ''
  });
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/tasks/${task.id}/comments`).then(d => setComments(d.comments));
  }, [task.id]);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const data = await api.patch(`/tasks/${task.id}`, {
        ...form,
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
      });
      onUpdate(data.task);
      setEditing(false);
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${task.id}`);
    onDelete(task.id);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const data = await api.post(`/tasks/${task.id}/comments`, { content: comment });
    setComments(p => [...p, data.comment]);
    setComment('');
  };

  const canEdit = user.role === 'admin' || task.creator_id === user.id || task.assignee_id === user.id;
  const canDelete = user.role === 'admin' || task.creator_id === user.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={e => e.stopPropagation()} style={{maxWidth:660}}>
        <div className="modal-header">
          {editing
            ? <input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{fontSize:'1rem',fontWeight:700}} />
            : <h2 style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.1rem'}}>{task.title}</h2>
          }
          <div style={{display:'flex',gap:6}}>
            {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>}
            {canDelete && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body" style={{display:'grid',gridTemplateColumns:'1fr 180px',gap:20}}>
          <div>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label className="label">Description</label>
              {editing
                ? <textarea className="input-field" rows={4} value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})} style={{resize:'vertical'}} />
                : <p style={{fontSize:'0.875rem',color: task.description ? 'var(--text2)' : 'var(--text3)',lineHeight:1.6}}>
                    {task.description || 'No description'}
                  </p>
              }
            </div>

            {/* Comments */}
            <div className="form-group" style={{marginTop:20}}>
              <label className="label">Comments ({comments.length})</label>
              <div className="comments-list">
                {comments.map(c => {
                  const initials = c.user_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                  return (
                    <div key={c.id} className="comment">
                      <div className="mini-avatar" style={{background: c.user_avatar || '#6366f1', width:28, height:28, fontSize:'0.65rem', flexShrink:0}}>
                        {initials}
                      </div>
                      <div>
                        <div style={{fontSize:'0.8rem',fontWeight:600}}>{c.user_name}
                          <span style={{color:'var(--text3)',fontWeight:400,marginLeft:8}}>
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{fontSize:'0.875rem',color:'var(--text2)',marginTop:2}}>{c.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleComment} style={{display:'flex',gap:8,marginTop:10}}>
                <input className="input-field" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..." style={{flex:1}} />
                <button type="submit" className="btn btn-primary btn-sm">Post</button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="task-sidebar">
            <SidebarField label="Status">
              {editing
                ? <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                : <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
              }
            </SidebarField>
            <SidebarField label="Priority">
              {editing
                ? <select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                : <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              }
            </SidebarField>
            <SidebarField label="Assignee">
              {editing
                ? <select className="input-field" value={form.assignee_id} onChange={e => setForm({...form, assignee_id: e.target.value})}>
                    <option value="">Unassigned</option>
                    {(members || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                : <span style={{fontSize:'0.875rem',color:'var(--text2)'}}>{task.assignee_name || 'Unassigned'}</span>
              }
            </SidebarField>
            <SidebarField label="Due Date">
              {editing
                ? <input className="input-field" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                : <span style={{fontSize:'0.875rem',color: task.due_date ? 'var(--text2)' : 'var(--text3)'}}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'No due date'}
                  </span>
              }
            </SidebarField>
            <SidebarField label="Creator">
              <span style={{fontSize:'0.875rem',color:'var(--text2)'}}>{task.creator_name}</span>
            </SidebarField>
          </div>
        </div>

        {editing && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarField({ label, children }) {
  return (
    <div style={{marginBottom:16}}>
      <div className="label" style={{marginBottom:6}}>{label}</div>
      {children}
    </div>
  );
}
