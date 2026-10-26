const pool = require('../config/db');

// POST /api/orders/buy  { stockId, quantity }
async function buyStock(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { stockId, quantity } = req.body;
    const qty = Number(quantity);

    if (!stockId || !qty || qty <= 0 || !Number.isInteger(qty)) {
      return res.status(400).json({ error: 'Quantity must be a positive whole number.' });
    }

    await conn.beginTransaction();

    const [stockRows] = await conn.query(
      'SELECT * FROM stocks WHERE id = ? FOR UPDATE',
      [stockId]
    );
    if (stockRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Stock not found.' });
    }
    const stock = stockRows[0];
    if (stock.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ error: 'This stock is not active.' });
    }

    const price = Number(stock.current_price);
    const total = Math.round(price * qty * 100) / 100;

    const [walletRows] = await conn.query(
      'SELECT * FROM wallet WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    if (walletRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Wallet not found for user.' });
    }
    const wallet = walletRows[0];
    if (Number(wallet.available_balance) < total) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient balance for this order.' });
    }

    // 1. Deduct balance
    await conn.query(
      'UPDATE wallet SET available_balance = available_balance - ? WHERE user_id = ?',
      [total, userId]
    );

    // 2. Update / create portfolio holding with recalculated average buy price
    const [holdingRows] = await conn.query(
      'SELECT * FROM portfolio WHERE user_id = ? AND stock_id = ? FOR UPDATE',
      [userId, stockId]
    );

    if (holdingRows.length === 0) {
      await conn.query(
        `INSERT INTO portfolio (user_id, stock_id, quantity, average_buy_price)
         VALUES (?, ?, ?, ?)`,
        [userId, stockId, qty, price]
      );
    } else {
      const holding = holdingRows[0];
      const existingQty = holding.quantity;
      const existingAvg = Number(holding.average_buy_price);
      const newQty = existingQty + qty;
      const newAvg =
        (existingQty * existingAvg + qty * price) / newQty;

      await conn.query(
        'UPDATE portfolio SET quantity = ?, average_buy_price = ? WHERE id = ?',
        [newQty, newAvg, holding.id]
      );
    }

    // 3. Create order record
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, stock_id, order_type, quantity, price, total_amount, status)
       VALUES (?, ?, 'BUY', ?, ?, ?, 'COMPLETED')`,
      [userId, stockId, qty, price, total]
    );

    // 4. Create transaction record (negative cash movement)
    await conn.query(
      `INSERT INTO transactions (user_id, stock_id, transaction_type, amount, description)
       VALUES (?, ?, 'BUY', ?, ?)`,
      [userId, stockId, -total, `${stock.symbol} - Bought ${qty} shares @ ₹${price}`]
    );

    await conn.commit();

    res.status(201).json({
      message: `✅ ${stock.symbol} — ${qty} shares bought successfully.`,
      order: { id: orderResult.insertId, stockId, quantity: qty, price, total }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// POST /api/orders/sell  { stockId, quantity }
async function sellStock(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { stockId, quantity } = req.body;
    const qty = Number(quantity);

    if (!stockId || !qty || qty <= 0 || !Number.isInteger(qty)) {
      return res.status(400).json({ error: 'Quantity must be a positive whole number.' });
    }

    await conn.beginTransaction();

    const [stockRows] = await conn.query('SELECT * FROM stocks WHERE id = ? FOR UPDATE', [stockId]);
    if (stockRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Stock not found.' });
    }
    const stock = stockRows[0];
    const price = Number(stock.current_price);

    const [holdingRows] = await conn.query(
      'SELECT * FROM portfolio WHERE user_id = ? AND stock_id = ? FOR UPDATE',
      [userId, stockId]
    );
    if (holdingRows.length === 0 || holdingRows[0].quantity < qty) {
      await conn.rollback();
      return res.status(400).json({ error: 'You do not own enough shares to sell.' });
    }
    const holding = holdingRows[0];
    const avgBuyPrice = Number(holding.average_buy_price);
    const total = Math.round(price * qty * 100) / 100;
    const realizedPnl = Math.round((price - avgBuyPrice) * qty * 100) / 100;

    // 1. Increase available cash
    await conn.query(
      'UPDATE wallet SET available_balance = available_balance + ? WHERE user_id = ?',
      [total, userId]
    );

    // 2. Reduce (or remove) holding
    const newQty = holding.quantity - qty;
    if (newQty === 0) {
      await conn.query('DELETE FROM portfolio WHERE id = ?', [holding.id]);
    } else {
      await conn.query('UPDATE portfolio SET quantity = ? WHERE id = ?', [newQty, holding.id]);
    }

    // 3. Create SELL order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, stock_id, order_type, quantity, price, total_amount, status)
       VALUES (?, ?, 'SELL', ?, ?, ?, 'COMPLETED')`,
      [userId, stockId, qty, price, total]
    );

    // 4. Create transaction (positive cash movement). Realized P&L is embedded
    //    in the description so it can be aggregated later (see portfolioService).
    await conn.query(
      `INSERT INTO transactions (user_id, stock_id, transaction_type, amount, description)
       VALUES (?, ?, 'SELL', ?, ?)`,
      [
        userId,
        stockId,
        total,
        `${stock.symbol} - Sold ${qty} shares @ ₹${price} | Realized P&L: ${realizedPnl}`
      ]
    );

    await conn.commit();

    res.status(201).json({
      message: `✅ ${stock.symbol} — ${qty} shares sold successfully.`,
      order: { id: orderResult.insertId, stockId, quantity: qty, price, total, realizedPnl }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// GET /api/orders
async function listOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT o.id, o.order_type, o.quantity, o.price, o.total_amount, o.status, o.created_at,
              s.company_name, s.symbol
       FROM orders o JOIN stocks s ON s.id = o.stock_id
       WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        orderType: r.order_type,
        quantity: r.quantity,
        price: Number(r.price),
        totalAmount: Number(r.total_amount),
        status: r.status,
        createdAt: r.created_at,
        companyName: r.company_name,
        symbol: r.symbol
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { buyStock, sellStock, listOrders };
