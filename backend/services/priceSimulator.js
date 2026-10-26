// Automatic stock price simulation.
// One reusable engine that runs periodically and moves EVERY active
// stock's price by a small random percentage (-2% to +2%). Any stock
// added by the admin automatically participates — nothing stock-specific
// is ever hard-coded here.
const pool = require('../config/db');

const MIN_MOVE_PCT = -0.02;
const MAX_MOVE_PCT = 0.02;

function randomMovementPct() {
  return MIN_MOVE_PCT + Math.random() * (MAX_MOVE_PCT - MIN_MOVE_PCT);
}

async function tickAllStocks() {
  const [stocks] = await pool.query(
    'SELECT id, current_price, day_high, day_low, volume FROM stocks WHERE status = "active"'
  );

  for (const stock of stocks) {
    const movementPct = randomMovementPct();
    let newPrice = Number(stock.current_price) * (1 + movementPct);

    // Guarantee price never becomes zero or negative
    if (newPrice < 1) newPrice = 1;
    newPrice = Math.round(newPrice * 100) / 100;

    const newHigh = Math.max(Number(stock.day_high) || newPrice, newPrice);
    const newLow = Math.min(Number(stock.day_low) || newPrice, newPrice);
    const volumeBump = Math.floor(Math.random() * 5000);

    await pool.query(
      `UPDATE stocks
       SET current_price = ?, day_high = ?, day_low = ?, volume = volume + ?
       WHERE id = ?`,
      [newPrice, newHigh, newLow, volumeBump, stock.id]
    );

    await pool.query(
      'INSERT INTO stock_prices (stock_id, price) VALUES (?, ?)',
      [stock.id, newPrice]
    );
  }
}

function startPriceSimulator(intervalMs = 5000) {
  console.log(`[priceSimulator] started — updating all active stocks every ${intervalMs}ms`);
  // Run once immediately, then on an interval.
  tickAllStocks().catch((err) => console.error('[priceSimulator] tick error:', err.message));
  return setInterval(() => {
    tickAllStocks().catch((err) => console.error('[priceSimulator] tick error:', err.message));
  }, intervalMs);
}

module.exports = { startPriceSimulator, tickAllStocks };
