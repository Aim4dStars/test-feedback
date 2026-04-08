const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    // Validate username: 3-30 chars, alphanumeric/underscore
    if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, underscores only).' });
    }

    // Validate password: min 6 chars
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if username already exists
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, display_name, subscription_type) VALUES (?, ?, ?, ?)'
    ).run(username, passwordHash, displayName || '', 'free');

    const user = {
      id: result.lastInsertRowid,
      username,
      displayName: displayName || '',
      subscriptionType: 'free',
      subscriptionExpiresAt: null,
    };

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, subscription_type: 'free' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const row = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username);
    if (!row) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      subscriptionType: row.subscription_type,
      subscriptionExpiresAt: row.subscription_expires_at,
    };

    const token = jwt.sign(
      { id: row.id, username: row.username, subscription_type: row.subscription_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /me
router.get('/me', authenticateToken, (req, res) => {
  const row = db.prepare('SELECT id, username, display_name, subscription_type, subscription_expires_at, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!row) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    subscriptionType: row.subscription_type,
    subscriptionExpiresAt: row.subscription_expires_at,
    createdAt: row.created_at,
  });
});

// PUT /subscription
router.put('/subscription', authenticateToken, (req, res) => {
  const { subscriptionType } = req.body;

  if (!['free', 'basic', 'premium'].includes(subscriptionType)) {
    return res.status(400).json({ error: 'Invalid subscription type. Must be free, basic, or premium.' });
  }

  let expiresAt = null;
  if (subscriptionType === 'basic') {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (subscriptionType === 'premium') {
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  db.prepare('UPDATE users SET subscription_type = ?, subscription_expires_at = ? WHERE id = ?')
    .run(subscriptionType, expiresAt, req.user.id);

  const row = db.prepare('SELECT id, username, display_name, subscription_type, subscription_expires_at FROM users WHERE id = ?').get(req.user.id);

  const token = jwt.sign(
    { id: row.id, username: row.username, subscription_type: row.subscription_type },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      subscriptionType: row.subscription_type,
      subscriptionExpiresAt: row.subscription_expires_at,
    },
  });
});

module.exports = router;
