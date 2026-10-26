const pool = require('../config/db');

// GET /api/transactions
async function listTransactions(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.transaction_type, t.amount, t.description, t.created_at,
              s.symbol, s.company_name
       FROM transactions t
       LEFT JOIN stocks s ON s.id = t.stock_id
       WHERE t.user_id = ? ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        type: r.transaction_type,
        amount: Number(r.amount),
        description: r.description,
        symbol: r.symbol,
        companyName: r.company_name,
        createdAt: r.created_at
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { listTransactions };
