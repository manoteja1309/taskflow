import { useState } from 'react';
import './TaskCard.css';

const PRIORITY_COLOR = { low: 'var(--text3)', medium: 'var(--blue)', high: 'var(--yellow)', urgent: 'var(--red)' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function isOverdue(task) {
  return task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
}

export default function TaskCard({ task, compact, onClick, onStatusChange }) {
  const overdue = isOverdue(task);
  const initials = task.assignee_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className={`task-card ${compact ? 'compact' : ''} ${overdue ? 'overdue' : ''}`}
      onClick={onClick} style={onClick ? {cursor:'pointer'} : {}}>
      {/* Color accent by project */}
      <div className="task-accent" style={{background: task.project_color || 'var(--accent)'}} />
      <div className="task-body">
        <div className="task-top">
          <span className="task-title">{task.title}</span>
          {overdue && <span className="overdue-badge">Overdue</span>}
        </div>
        {!compact && task.description && (
          <p className="task-desc">{task.description}</p>
        )}
        <div className="task-meta">
          {task.project_name && (
            <span className="task-project" style={{color: task.project_color || 'var(--accent)'}}>
              {task.project_name}
            </span>
          )}
          <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
          <span className="badge" style={{background: PRIORITY_COLOR[task.priority] + '20', color: PRIORITY_COLOR[task.priority]}}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>
        <div className="task-footer">
          {task.assignee_name ? (
            <div className="task-assignee">
              <div className="mini-avatar" style={{background: task.assignee_avatar || '#6366f1'}}>
                {initials}
              </div>
              <span>{task.assignee_name}</span>
            </div>
          ) : (
            <span style={{color:'var(--text3)',fontSize:'0.8rem'}}>Unassigned</span>
          )}
          {task.due_date && (
            <span className={`task-due ${overdue ? 'overdue-text' : ''}`}>
              {new Date(task.due_date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
