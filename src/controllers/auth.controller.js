const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// CRITICAL: JWT_SECRET must be set in environment (no fallback!)
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required. Set it in .env file.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    // Check duplicates
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role, trust_score, reputation) VALUES (?, ?, ?, "player", 100, 0)',
      [username, email, hashed]
    );

    const token = jwt.sign(
      { id: result.insertId, username, email, role: 'player' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: result.insertId, username, email, role: 'player', trust_score: 100, reputation: 0 }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.sqlMessage || err.message || 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update online status
    await db.execute('UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id, username: user.username, email: user.email,
        role: user.role, trust_score: user.trust_score, reputation: user.reputation,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await db.execute('UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, role, trust_score, reputation, avatar, is_online, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, logout, me };
