const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');

const STARTING_BALANCE = 100000.0;

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashed = hashPassword(password);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [userResult] = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")',
        [name, email, hashed]
      );
      const userId = userResult.insertId;

      await conn.query(
        'INSERT INTO wallet (user_id, initial_balance, available_balance) VALUES (?, ?, ?)',
        [userId, STARTING_BALANCE, STARTING_BALANCE]
      );

      await conn.commit();
      res.status(201).json({ message: 'Registration successful. You can now log in.' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Contact admin.' });
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
