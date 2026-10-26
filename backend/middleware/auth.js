// Lightweight auth for a localhost demo project (no JWT / sessions).
// After login, the frontend stores { id, role } and sends the user id
// on every request via the 'x-user-id' header. This middleware loads
// the user from the DB and attaches it to req.user.
const pool = require('../config/db');

async function requireAuth(req, res, next) {
  try {
    const userId = req.header('x-user-id');
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    }
    if (rows[0].status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked.' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
