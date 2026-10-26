const pool = require('../config/db');
const {
  getPortfolioWithValue,
  getAvailableBalance,
  getRealizedPnl
} = require('../services/portfolioService');
const { getPreviousSnapshot } = require('../services/snapshotService');

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.status, u.created_at, w.initial_balance
       FROM users u JOIN wallet w ON w.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found.' });
    const p = rows[0];
    res.json({
      id: p.id,
      name: p.name,
      email: p.email,
      status: p.status,
      startingBalance: Number(p.initial_balance),
      registeredAt: p.created_at
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard -> summary for the dashboard cards + recent orders
async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const { portfolioValue, investedValue, unrealizedPnl } = await getPortfolioWithValue(userId);
    const availableBalance = await getAvailableBalance(userId);
    const realizedPnl = await getRealizedPnl(userId);
    const overallPnl = realizedPnl + unrealizedPnl;

    const totalAccountValue = portfolioValue + availableBalance;
    const previousSnapshot = await getPreviousSnapshot(userId);
    const todaysPnl = previousSnapshot
      ? totalAccountValue - Number(previousSnapshot.total_account_value)
      : 0;

    const [recentOrders] = await pool.query(
      `SELECT o.order_type, o.quantity, o.total_amount, o.created_at, s.symbol
       FROM orders o JOIN stocks s ON s.id = o.stock_id
       WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 5`,
      [userId]
    );

    const [chartRows] = await pool.query(
      `SELECT total_account_value, snapshot_date
       FROM portfolio_snapshots WHERE user_id = ? ORDER BY snapshot_date ASC LIMIT 30`,
      [userId]
    );

    res.json({
      availableBalance,
      investedValue,
      portfolioValue,
      todaysPnl,
      overallPnl,
      recentOrders: recentOrders.map((o) => ({
        symbol: o.symbol,
        orderType: o.order_type,
        quantity: o.quantity,
        totalAmount: Number(o.total_amount),
        createdAt: o.created_at
      })),
      chart: chartRows.map((c) => ({
        date: c.snapshot_date,
        totalValue: Number(c.total_account_value)
      }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getDashboard };
