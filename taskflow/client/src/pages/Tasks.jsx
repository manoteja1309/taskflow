import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import './Tasks.css';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', project_id: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () =>
    Promise.all([
      api.get('/tasks'),
      api.get('/projects'),
      api.get('/users'),
    ]).then(([t, p, u]) => {
      setTasks(t.tasks); setProjects(p.projects); setAllUsers(u.users);
    }).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.project_id && t.project_id !== parseInt(filters.project_id)) return false;
    return true;
  });

  if (loading) return <div className="loading-screen" style={{minHeight:'60vh'}}><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="input-field filter-select" value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select className="input-field filter-select" value={filters.priority}
          onChange={e => setFilters({...filters, priority: e.target.value})}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select className="input-field filter-select" value={filters.project_id}
          onChange={e => setFilters({...filters, project_id: e.target.value})}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filters.status || filters.priority || filters.project_id) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({status:'',priority:'',project_id:''})}>
            Clear filters
          </button>
        )}
      </div>

      {/* Task Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{minHeight:'40vh'}}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask}
          members={allUsers}
          projectId={selectedTask.project_id}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTask(updated);
          }}
          onDelete={(tid) => { setTasks(p => p.filter(t => t.id !== tid)); setSelectedTask(null); }}
        />
      )}

      {showCreate && (
        <CreateTaskModal projects={projects} allUsers={allUsers}
          onClose={() => setShowCreate(false)}
          onCreated={(t) => { setTasks(p => [t, ...p]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({ projects, allUsers, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
    project_id: '', assignee_id: '', due_date: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Get members for selected project
  const [projMembers, setProjMembers] = useState([]);
  useEffect(() => {
    if (form.project_id) {
      api.get(`/projects/${form.project_id}`).then(d => setProjMembers(d.members || []));
    } else {
      setProjMembers(allUsers);
    }
  }, [form.project_id]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const data = await api.post('/tasks', {
        ...form,
        project_id: parseInt(form.project_id),
        assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
      });
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
                onChange={e => setForm({...form, description: e.target.value})} style={{resize:'vertical'}} />
            </div>
            <div className="form-group">
              <label className="label">Project *</label>
              <select className="input-field" value={form.project_id}
                onChange={e => setForm({...form, project_id: e.target.value})} required>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
                  {projMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
