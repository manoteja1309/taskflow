import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [pd, td, ud] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
      api.get('/users'),
    ]);
    setProject(pd.project); setMembers(pd.members);
    setTasks(td.tasks); setAllUsers(ud.users);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  const handleAddMember = async () => {
    if (!addMemberId) return;
    setError('');
    try {
      await api.post(`/projects/${id}/members`, { userId: parseInt(addMemberId) });
      setShowAddMember(false); setAddMemberId('');
      load();
    } catch(err) { setError(err.message); }
  };

  const handleRemoveMember = async (uid) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${uid}`);
    load();
  };

  const handleStatusChange = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}`, { status });
    setTasks(prev => prev.map(t => t.id === taskId ? {...t, status} : t));
  };

  const isAdmin = user.role === 'admin' || project?.owner_id === user.id;
  const memberIds = members.map(m => m.id);
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id));

  const columns = [
    { key: 'todo', label: 'To Do', color: 'var(--text3)' },
    { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
    { key: 'review', label: 'Review', color: 'var(--yellow)' },
    { key: 'done', label: 'Done', color: 'var(--green)' },
  ];

  if (loading) return <div className="loading-screen" style={{minHeight:'60vh'}}><div className="spinner"/></div>;
  if (!project) return <div className="empty-state"><p>Project not found</p></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Link to="/projects" className="btn btn-ghost btn-sm" style={{padding:'6px 8px'}}>← Back</Link>
          <div className="project-color-badge" style={{background: project.color}} />
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTaskModal(true)}>
            + Add Task
          </button>
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
              + Member
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['board', 'list', 'members'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Board View */}
      {tab === 'board' && (
        <div className="kanban-board">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <div className="dot" style={{background: col.color}} />
                  <span style={{fontWeight:600,fontSize:'0.9rem'}}>{col.label}</span>
                  <span className="col-count">{colTasks.length}</span>
                </div>
                <div className="kanban-tasks">
                  {colTasks.map(t => (
                    <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="col-empty">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {tab === 'list' && (
        <div className="task-list-view">
          {tasks.length === 0 ? (
            <div className="empty-state"><p>No tasks yet</p></div>
          ) : tasks.map(t => (
            <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
          ))}
        </div>
      )}

      {/* Members View */}
      {tab === 'members' && (
        <div className="members-list">
          {members.map(m => {
            const initials = m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
            return (
              <div key={m.id} className="member-row card">
                <div className="mini-avatar" style={{background: m.avatar || '#6366f1', width:36, height:36, fontSize:'0.8rem'}}>
                  {initials}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{m.name}</div>
                  <div style={{fontSize:'0.8rem',color:'var(--text3)'}}>{m.email}</div>
                </div>
                <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
                {isAdmin && m.id !== user.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal task={selectedTask} members={members} projectId={id}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTask(updated);
          }}
          onDelete={(tid) => { setTasks(p => p.filter(t => t.id !== tid)); setSelectedTask(null); }}
        />
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <NewTaskModal projectId={id} members={members}
          onClose={() => setShowTaskModal(false)}
          onCreated={(t) => { setTasks(p => [t, ...p]); setShowTaskModal(false); }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddMember(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-msg">{error}</div>}
              {nonMembers.length === 0
                ? <p style={{color:'var(--text2)'}}>All users are already members</p>
                : (
                  <div className="form-group">
                    <label className="label">Select User</label>
                    <select className="input-field" value={addMemberId} onChange={e => setAddMemberId(e.target.value)}>
                      <option value="">— choose user —</option>
                      {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                )
              }
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddMember} disabled={!addMemberId}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewTaskModal({ projectId, members, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    assignee_id: '', due_date: '', status: 'todo'
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const data = await api.post('/tasks', { ...form, project_id: parseInt(projectId),
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null });
      onCreated(data.task);
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label className="label">Title *</label>
              <input className="input-field" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})} required placeholder="Task title" />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input-field" rows={2} value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Details..." style={{resize:'vertical'}} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label className="label">Assignee</label>
                <select className="input-field" value={form.assignee_id} onChange={e => setForm({...form, assignee_id: e.target.value})}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input className="input-field" type="date" value={form.due_date}
                  onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
