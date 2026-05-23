import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/stats'),
      api.get('/tasks/my'),
      api.get('/tasks?status=in_progress'),
    ]).then(([s, m, r]) => {
      setStats(s);
      setMyTasks(m.tasks.slice(0, 5));
      setRecentTasks(r.tasks.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{minHeight:'60vh'}}><div className="spinner"/></div>;

  const statCards = [
    { label: 'Total Tasks', value: stats?.total || 0, color: 'var(--accent)', icon: <IconAll /> },
    { label: 'In Progress', value: stats?.in_progress || 0, color: 'var(--blue)', icon: <IconProgress /> },
    { label: 'Under Review', value: stats?.review || 0, color: 'var(--yellow)', icon: <IconReview /> },
    { label: 'Completed', value: stats?.done || 0, color: 'var(--green)', icon: <IconDone /> },
    { label: 'Overdue', value: stats?.overdue || 0, color: 'var(--red)', icon: <IconOverdue /> },
    { label: 'Assigned to Me', value: stats?.assigned_to_me || 0, color: 'var(--pink)', icon: <IconUser /> },
  ];

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's what's happening today</p>
        </div>
        <Link to="/tasks" className="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{background: s.color + '20', color: s.color}}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{color: s.color}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* My Tasks */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>My Tasks</h2>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {myTasks.length === 0
            ? <div className="empty-state"><IconEmpty /><p>No tasks assigned to you</p></div>
            : <div className="task-list">{myTasks.map(t => <TaskCard key={t.id} task={t} compact />)}</div>
          }
        </div>

        {/* In Progress */}
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>In Progress</h2>
            <Link to="/tasks?status=in_progress" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {recentTasks.length === 0
            ? <div className="empty-state"><IconEmpty /><p>No tasks in progress</p></div>
            : <div className="task-list">{recentTasks.map(t => <TaskCard key={t.id} task={t} compact />)}</div>
          }
        </div>
      </div>

      {/* Progress Overview */}
      {stats && (
        <div className="progress-card card" style={{marginTop: 24}}>
          <h2 style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:16}}>Overall Progress</h2>
          <div className="progress-bar-row">
            {[
              { label: 'To Do', count: stats.todo, color: 'var(--text3)' },
              { label: 'In Progress', count: stats.in_progress, color: 'var(--blue)' },
              { label: 'Review', count: stats.review, color: 'var(--yellow)' },
              { label: 'Done', count: stats.done, color: 'var(--green)' },
            ].map(s => {
              const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
              return (
                <div key={s.label} className="progress-item">
                  <div className="progress-meta">
                    <span style={{color: s.color}}>{s.label}</span>
                    <span style={{color:'var(--text2)'}}>{s.count}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{width: `${pct}%`, background: s.color}} />
                  </div>
                  <span className="progress-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function IconAll() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function IconProgress() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>; }
function IconReview() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconDone() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconOverdue() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconUser() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconEmpty() { return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="12" y2="13"/></svg>; }
