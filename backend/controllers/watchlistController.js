const pool = require('../config/db');

// GET /api/watchlist
async function getWatchlist(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT w.id AS watchlist_id, s.id AS stock_id, s.company_name, s.symbol,
              s.current_price, s.previous_close
       FROM watchlist w JOIN stocks s ON s.id = w.stock_id
       WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(
      rows.map((r) => {
        const change = Number(r.current_price) - Number(r.previous_close || r.current_price);
        const changePct = r.previous_close ? (change / Number(r.previous_close)) * 100 : 0;
        return {
          watchlistId: r.watchlist_id,
          stockId: r.stock_id,
          companyName: r.company_name,
          symbol: r.symbol,
          currentPrice: Number(r.current_price),
          change,
          changePct
        };
      })
    );
  } catch (err) {
    next(err);
  }
}

// POST /api/watchlist  { stockId }
async function addToWatchlist(req, res, next) {
  try {
    const { stockId } = req.body;
    if (!stockId) return res.status(400).json({ error: 'stockId is required.' });

    const [existing] = await pool.query(
      'SELECT id FROM watchlist WHERE user_id = ? AND stock_id = ?',
      [req.user.id, stockId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Stock is already in your watchlist.' });
    }

    await pool.query('INSERT INTO watchlist (user_id, stock_id) VALUES (?, ?)', [
      req.user.id,
      stockId
    ]);
    res.status(201).json({ message: 'Added to watchlist.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/watchlist/:stockId
async function removeFromWatchlist(req, res, next) {
  try {
    const { stockId } = req.params;
    await pool.query('DELETE FROM watchlist WHERE user_id = ? AND stock_id = ?', [
      req.user.id,
      stockId
    ]);
    res.json({ message: 'Removed from watchlist.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
