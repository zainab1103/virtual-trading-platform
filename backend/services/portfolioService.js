// Shared portfolio/P&L calculation helpers. Every number here is derived
// live from the database — nothing is hard-coded.
const pool = require('../config/db');

// Returns { holdings: [...], portfolioValue, investedValue, unrealizedPnl }
async function getPortfolioWithValue(userId) {
  const [rows] = await pool.query(
    `SELECT p.id, p.stock_id, p.quantity, p.average_buy_price,
            s.company_name, s.symbol, s.current_price
     FROM portfolio p
     JOIN stocks s ON s.id = p.stock_id
     WHERE p.user_id = ? AND p.quantity > 0`,
    [userId]
  );

  let portfolioValue = 0;
  let investedValue = 0;

  const holdings = rows.map((r) => {
    const currentValue = r.quantity * Number(r.current_price);
    const investedAmount = r.quantity * Number(r.average_buy_price);
    const pnl = currentValue - investedAmount;
    const pnlPct = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;

    portfolioValue += currentValue;
    investedValue += investedAmount;

    return {
      id: r.id,
      stockId: r.stock_id,
      companyName: r.company_name,
      symbol: r.symbol,
      quantity: r.quantity,
      averageBuyPrice: Number(r.average_buy_price),
      currentPrice: Number(r.current_price),
      investedValue: investedAmount,
      currentValue,
      pnl,
      pnlPct
    };
  });

  return {
    holdings,
    portfolioValue,
    investedValue,
    unrealizedPnl: portfolioValue - investedValue
  };
}

async function getAvailableBalance(userId) {
  const [rows] = await pool.query(
    'SELECT available_balance FROM wallet WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0) return 0;
  return Number(rows[0].available_balance);
}

// Realized P&L = (sell price - average buy price) * quantity, computed once at
// sell time (see orderController.sellStock) and recorded in the SELL
// transaction's description as "Realized P&L: <amount>". Summing that across
// all SELL transactions gives total realized P&L without needing an extra
// column beyond the schema defined for this project.
async function getRealizedPnl(userId) {
  const [rows] = await pool.query(
    `SELECT description FROM transactions WHERE user_id = ? AND transaction_type = 'SELL'`,
    [userId]
  );
  let total = 0;
  for (const row of rows) {
    const match = /Realized P&L: (-?[0-9.]+)/.exec(row.description || '');
    if (match) total += parseFloat(match[1]);
  }
  return total;
}

module.exports = { getPortfolioWithValue, getAvailableBalance, getRealizedPnl };
