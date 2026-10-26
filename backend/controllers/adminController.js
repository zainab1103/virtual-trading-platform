const pool = require('../config/db');

// GET /api/admin/dashboard
async function getAdminDashboard(req, res, next) {
  try {
    const [[{ totalUsers }]] = await pool.query(
      "SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'"
    );
    const [[{ totalStocks }]] = await pool.query(
      "SELECT COUNT(*) AS totalStocks FROM stocks WHERE status = 'active'"
    );
    const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalVolume }]] = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) AS totalVolume FROM orders'
    );

    const [recentOrders] = await pool.query(
      `SELECT o.id, o.order_type, o.quantity, o.total_amount, o.created_at,
              u.name AS user_name, s.symbol
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN stocks s ON s.id = o.stock_id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    res.json({
      totalUsers,
      totalStocks,
      totalOrders,
      totalVolume: Number(totalVolume),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderType: o.order_type,
        quantity: o.quantity,
        totalAmount: Number(o.total_amount),
        createdAt: o.created_at,
        userName: o.user_name,
        symbol: o.symbol
      }))
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users
async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, status, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC`
    );
    res.json(rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      status: r.status,
      registeredAt: r.created_at
    })));
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stocks
async function listAllStocks(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM stocks ORDER BY created_at DESC');
    res.json(
      rows.map((s) => ({
        id: s.id,
        companyName: s.company_name,
        symbol: s.symbol,
        currentPrice: Number(s.current_price),
        description: s.description,
        status: s.status,
        createdAt: s.created_at
      }))
    );
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/stocks  { companyName, symbol, initialPrice, description }
async function addStock(req, res, next) {
  try {
    const { companyName, symbol, initialPrice, description } = req.body;
    const price = Number(initialPrice);

    if (!companyName || !symbol || !price || price <= 0) {
      return res.status(400).json({ error: 'Company name, symbol and a positive initial price are required.' });
    }

    const [existing] = await pool.query('SELECT id FROM stocks WHERE symbol = ?', [
      symbol.toUpperCase()
    ]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A stock with this symbol already exists.' });
    }

    const [result] = await pool.query(
      `INSERT INTO stocks
        (company_name, symbol, current_price, previous_close, open_price, day_high, day_low, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [companyName, symbol.toUpperCase(), price, price, price, price, price, description || null]
    );

    // Seed the first price history point — the shared price simulator will
    // automatically pick this stock up on its very next tick, no extra code needed.
    await pool.query('INSERT INTO stock_prices (stock_id, price) VALUES (?, ?)', [
      result.insertId,
      price
    ]);

    res.status(201).json({ message: 'Stock added successfully.', stockId: result.insertId });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/stocks/:id
async function editStock(req, res, next) {
  try {
    const { id } = req.params;
    const { companyName, description, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM stocks WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Stock not found.' });

    await pool.query(
      `UPDATE stocks SET
        company_name = COALESCE(?, company_name),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [companyName || null, description || null, status || null, id]
    );

    res.json({ message: 'Stock updated successfully.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/stocks/:id — soft delete (mark inactive) to preserve history/FKs
async function deleteStock(req, res, next) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM stocks WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Stock not found.' });

    await pool.query("UPDATE stocks SET status = 'inactive' WHERE id = ?", [id]);
    res.json({ message: 'Stock deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/orders
async function listAllOrders(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.order_type, o.quantity, o.price, o.total_amount, o.status, o.created_at,
              u.name AS user_name, s.symbol
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN stocks s ON s.id = o.stock_id
       ORDER BY o.created_at DESC`
    );
    res.json(
      rows.map((o) => ({
        id: o.id,
        userName: o.user_name,
        symbol: o.symbol,
        orderType: o.order_type,
        quantity: o.quantity,
        price: Number(o.price),
        totalAmount: Number(o.total_amount),
        status: o.status,
        createdAt: o.created_at
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminDashboard,
  listUsers,
  listAllStocks,
  addStock,
  editStock,
  deleteStock,
  listAllOrders
};
