const pool = require('../config/db');

// GET /api/stocks?search=&sort=
async function listStocks(req, res, next) {
  try {
    const { search, sort } = req.query;
    let sql = `SELECT id, company_name, symbol, current_price, previous_close,
                      open_price, day_high, day_low, volume, status
               FROM stocks WHERE status = 'active'`;
    const params = [];

    if (search) {
      sql += ' AND (company_name LIKE ? OR symbol LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'price_asc') sql += ' ORDER BY current_price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY current_price DESC';
    else sql += ' ORDER BY company_name ASC';

    const [rows] = await pool.query(sql, params);

    const stocks = rows.map((s) => {
      const change = Number(s.current_price) - Number(s.previous_close || s.current_price);
      const changePct = s.previous_close
        ? (change / Number(s.previous_close)) * 100
        : 0;
      return {
        id: s.id,
        companyName: s.company_name,
        symbol: s.symbol,
        currentPrice: Number(s.current_price),
        change,
        changePct
      };
    });

    res.json(stocks);
  } catch (err) {
    next(err);
  }
}

// GET /api/stocks/:id
async function getStockDetails(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM stocks WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found.' });
    }
    const s = rows[0];
    const change = Number(s.current_price) - Number(s.previous_close || s.current_price);
    const changePct = s.previous_close ? (change / Number(s.previous_close)) * 100 : 0;

    res.json({
      id: s.id,
      companyName: s.company_name,
      symbol: s.symbol,
      currentPrice: Number(s.current_price),
      previousClose: Number(s.previous_close),
      openPrice: Number(s.open_price),
      dayHigh: Number(s.day_high),
      dayLow: Number(s.day_low),
      volume: s.volume,
      description: s.description,
      status: s.status,
      change,
      changePct
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/stocks/:id/prices  -> history for the chart
async function getStockPriceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const [rows] = await pool.query(
      `SELECT price, recorded_at FROM stock_prices
       WHERE stock_id = ? ORDER BY recorded_at DESC LIMIT ?`,
      [id, limit]
    );
    // return oldest -> newest for charting
    res.json(
      rows.reverse().map((r) => ({ price: Number(r.price), recordedAt: r.recorded_at }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { listStocks, getStockDetails, getStockPriceHistory };
