const express = require('express');
const { db } = require('../database/db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - list projects for current user
router.get('/', authenticate, (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `).all();
  } else {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
  }
  res.json({ projects });
});

// POST /api/projects - create project (admin only)
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create projects' });

  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const result = db.prepare(
    'INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)'
  ).run(name.trim(), description || '', color || '#6366f1', req.user.id);

  // Add owner as admin member
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', authenticate, requireProjectAccess, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, u.role as global_role, pm.role as project_role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json({ project: req.project, members });
});

// PATCH /api/projects/:id
router.patch('/:id', authenticate, requireProjectAccess, (req, res) => {
  const isOwner = req.project.owner_id === req.user.id;
  if (req.user.role !== 'admin' && !isOwner)
    return res.status(403).json({ error: 'Only project admin or owner can edit' });

  const { name, description, status, color } = req.body;
  db.prepare(`
    UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description),
    status = COALESCE(?, status), color = COALESCE(?, color), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, status, color, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ project: updated });
});

// DELETE /api/projects/:id (admin only)
router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', authenticate, requireProjectAccess, (req, res) => {
  const isOwner = req.project.owner_id === req.user.id;
  if (req.user.role !== 'admin' && !isOwner)
    return res.status(403).json({ error: 'Only admin or project owner can add members' });

  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(req.params.id, userId);
  if (existing) return res.status(409).json({ error: 'User already a member' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(req.params.id, userId, role || 'member');

  res.status(201).json({ message: 'Member added' });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, requireProjectAccess, (req, res) => {
  const isOwner = req.project.owner_id === req.user.id;
  if (req.user.role !== 'admin' && !isOwner)
    return res.status(403).json({ error: 'Only admin or project owner can remove members' });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
    .run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
