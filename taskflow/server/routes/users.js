const express = require('express');
const { db } = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list all users (admin) or all users for member selection
router.get('/', authenticate, (req, res) => {
  const users = db.prepare(
    'SELECT id, name, email, role, avatar, created_at FROM users ORDER BY name ASC'
  ).all();
  res.json({ users });
});

// PATCH /api/users/:id/role - change user role (admin only)
router.patch('/:id/role', authenticate, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role))
    return res.status(400).json({ error: 'Role must be admin or member' });

  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot change your own role' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete your own account' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
