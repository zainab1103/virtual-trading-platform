// Maintains one portfolio_snapshots row per user per day so Today's P&L
// can be computed as (today's total value - yesterday's total value).
const pool = require('../config/db');
const { getPortfolioWithValue, getAvailableBalance } = require('./portfolioService');

async function recordSnapshotForUser(userId) {
  const { portfolioValue } = await getPortfolioWithValue(userId);
  const availableBalance = await getAvailableBalance(userId);
  const totalAccountValue = portfolioValue + availableBalance;

  // MySQL "INSERT ... ON DUPLICATE KEY UPDATE" avoids duplicate snapshots
  // for the same user + date, relying on the uniq_user_date constraint.
  await pool.query(
    `INSERT INTO portfolio_snapshots
       (user_id, available_balance, portfolio_value, total_account_value, snapshot_date)
     VALUES (?, ?, ?, ?, CURDATE())
     ON DUPLICATE KEY UPDATE
       available_balance = VALUES(available_balance),
       portfolio_value = VALUES(portfolio_value),
       total_account_value = VALUES(total_account_value)`,
    [userId, availableBalance, portfolioValue, totalAccountValue]
  );
}

async function recordSnapshotsForAllUsers() {
  const [users] = await pool.query("SELECT id FROM users WHERE role = 'user'");
  for (const u of users) {
    await recordSnapshotForUser(u.id);
  }
}

// Returns the most recent snapshot BEFORE today, for comparison.
async function getPreviousSnapshot(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM portfolio_snapshots
     WHERE user_id = ? AND snapshot_date < CURDATE()
     ORDER BY snapshot_date DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

function startDailySnapshotJob() {
  // Take a snapshot immediately on server start (captures "yesterday" baseline
  // the first time it runs), then once every 24 hours while the server is up.
  recordSnapshotsForAllUsers().catch((err) =>
    console.error('[snapshotService] initial snapshot error:', err.message)
  );
  return setInterval(() => {
    recordSnapshotsForAllUsers().catch((err) =>
      console.error('[snapshotService] snapshot error:', err.message)
    );
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  recordSnapshotForUser,
  recordSnapshotsForAllUsers,
  getPreviousSnapshot,
  startDailySnapshotJob
};
