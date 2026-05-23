const express = require('express');
const { db } = require('../database/db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks - all tasks for user (dashboard)
router.get('/', authenticate, (req, res) => {
  const { status, priority, overdue } = req.query;
  let query, params;

  const baseSelect = `
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar as assignee_avatar,
      c.name as creator_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
  `;

  if (req.user.role === 'admin') {
    query = baseSelect + ' WHERE 1=1';
    params = [];
  } else {
    query = baseSelect + `
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ?
    `;
    params = [req.user.id];
  }

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (overdue === 'true') { query += " AND t.due_date < date('now') AND t.status != 'done'"; }

  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// GET /api/tasks/stats - dashboard stats
router.get('/stats', authenticate, (req, res) => {
  let projectFilter = req.user.role === 'admin'
    ? '' : `JOIN project_members pm ON t.project_id = pm.project_id WHERE pm.user_id = ${req.user.id}`;

  const getCount = (extra) => {
    const q = req.user.role === 'admin'
      ? `SELECT COUNT(*) as c FROM tasks t WHERE ${extra}`
      : `SELECT COUNT(*) as c FROM tasks t JOIN project_members pm ON t.project_id = pm.project_id WHERE pm.user_id = ${req.user.id} AND ${extra}`;
    return db.prepare(q).get().c;
  };

  const assignedToMe = db.prepare(
    `SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ?`
  ).get(req.user.id).c;

  res.json({
    total: getCount('1=1'),
    todo: getCount("t.status = 'todo'"),
    in_progress: getCount("t.status = 'in_progress'"),
    review: getCount("t.status = 'review'"),
    done: getCount("t.status = 'done'"),
    overdue: getCount(`t.due_date < date('now') AND t.status != 'done'`),
    high_priority: getCount("t.priority IN ('high', 'urgent')"),
    assigned_to_me: assignedToMe,
  });
});

// GET /api/tasks/my - tasks assigned to me
router.get('/my', authenticate, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar as assignee_avatar,
      c.name as creator_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    WHERE t.assignee_id = ?
    ORDER BY t.due_date ASC, t.priority DESC
  `).all(req.user.id);
  res.json({ tasks });
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', authenticate, requireProjectAccess, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.projectId);
  res.json({ tasks });
});

// POST /api/tasks - create task
router.post('/', authenticate, (req, res) => {
  const { title, description, status, priority, project_id, assignee_id, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });
  if (!project_id) return res.status(400).json({ error: 'Project ID is required' });

  // Check project access
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin') {
    const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(project_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, creator_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(), description || '', status || 'todo',
    priority || 'medium', project_id, assignee_id || null,
    req.user.id, due_date || null
  );

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

// PATCH /api/tasks/:id
router.patch('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Check access
  if (req.user.role !== 'admin') {
    const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(task.project_id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, status, priority, assignee_id, due_date } = req.body;
  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      assignee_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
      due_date = CASE WHEN ? IS NOT NULL THEN ? ELSE due_date END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, status, priority, assignee_id, assignee_id, due_date, due_date, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.creator_id = c.id
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const canDelete = req.user.role === 'admin' || task.creator_id === req.user.id;
  if (!canDelete) return res.status(403).json({ error: 'Only task creator or admin can delete' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/:id/comments
router.get('/:id/comments', authenticate, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar as user_avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json({ comments });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' });

  const result = db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar as user_avatar
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
});

module.exports = router;
