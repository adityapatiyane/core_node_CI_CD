const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Basic validation helper
function validateUser({ name, email, phone }, partial = false) {
  const errors = [];

  if (!partial || name !== undefined) {
    if (!name || String(name).trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters.');
    }
  }

  if (!partial || email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      errors.push('A valid email is required.');
    }
  }

  if (!partial || phone !== undefined) {
    const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
    if (!phone || !phoneRegex.test(String(phone).trim())) {
      errors.push('Phone is required and must be 7–20 digits/symbols.');
    }
  }

  return errors;
}

// GET /api/users — list all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, created_at, updated_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('List users error:', err.code || '', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/users/:id — get one user
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// POST /api/users — create user
router.post('/', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();

    const errors = validateUser({ name, email, phone });
    if (errors.length) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create user error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT /api/users/:id — update user
router.put('/:id', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();

    const errors = validateUser({ name, email, phone });
    if (errors.length) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    const [result] = await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name, email, phone, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update user error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /api/users/:id — delete user
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
