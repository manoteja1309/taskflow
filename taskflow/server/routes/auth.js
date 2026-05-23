const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Invalid email format' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = bcrypt.hashSync(password, 10);

  // First user becomes admin automatically
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
  const assignedRole = count.c === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'member');

  const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  const avatar = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const result = db.prepare(
    'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), email.toLowerCase(), hashedPassword, assignedRole, avatar);

  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
  const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, (req, res) => {
  const { name, avatar } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?')
    .run(name.trim(), avatar || req.user.avatar, req.user.id);

  const updated = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});

module.exports = router;
