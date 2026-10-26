# Virtual Trading Platform

A full-stack **simulation-only** stock trading platform built as a college project.

⚠️ **This is NOT a real trading platform.** No real money, no real stock-market data, no real trades. All stock prices are randomly simulated on the backend.

## Tech Stack

- **Frontend:** React.js (Vite), JavaScript, CSS, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MySQL

No TypeScript, no JWT, no MongoDB, no payment gateways, no cloud services — kept intentionally simple for a localhost college project.

---

## 1. Prerequisites

- Node.js 18+ and npm
- MySQL Server 8+ running locally

---

## 2. Database Setup

```bash
# Log into MySQL and run the schema, then the seed data
mysql -u root -p < database/schema.sql
mysql -u root -p virtual_trading < database/seed.sql
```

This creates the `virtual_trading` database with all 9 tables, 10 demo stocks, and two accounts:

| Role  | Email           | Password |
|-------|-----------------|----------|
| Admin | admin@vtp.com   | admin123 |
| User  | demo@vtp.com    | user123  |

(Credentials are for local development/demo only.)

---

## 3. Backend Setup

```bash
cd backend
cp .env.example .env
# edit .env and set DB_PASSWORD to your MySQL root password
npm install
npm run dev
```

The backend starts on **http://localhost:5000** and immediately:
- Starts the automatic price simulator (updates every 5 seconds by default, ±2% per stock)
- Starts the daily portfolio snapshot job (used for Today's P&L)

## 4. Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173** and proxies all `/api` calls to the backend on port 5000.

Open **http://localhost:5173** in your browser.

---

## 5. How It All Fits Together

```
React (5173) → Express REST API (5000) → MySQL (virtual_trading)
```

- **Price simulation:** `backend/services/priceSimulator.js` is one reusable engine that moves every *active* stock's price by a small random amount on a timer, and logs each change into `stock_prices`. When the admin adds a new stock, it automatically joins this simulation and gets its own price history — no per-stock code needed.
- **Buy/Sell:** `backend/controllers/orderController.js` handles balance checks, average buy price recalculation, portfolio updates, order records, and transaction records inside a single MySQL transaction (so nothing is left half-updated).
- **P&L:** Realized P&L is captured at sell time; unrealized P&L is computed live from current prices; daily snapshots (`portfolio_snapshots` table) let the app compare today's value against yesterday's for "Today's P&L".
- **Auth:** Deliberately simple for a localhost project — no JWT/sessions. After login, the frontend stores `{ id, role }` in `localStorage` and sends it as an `x-user-id` header on every request. The backend middleware (`backend/middleware/auth.js`) looks the user up fresh from the DB on every call.

---

## 6. Project Structure

```
virtual-trading-platform/
  backend/
    config/        MySQL connection pool
    controllers/    Route handlers (business logic)
    middleware/     Auth middleware
    routes/         Express routers
    services/       Price simulator, snapshot job, portfolio math
    server.js
  frontend/
    src/
      components/   Reusable UI (Sidebar, TradeModal, PriceChart, Toast...)
      context/       AuthContext
      layouts/       UserLayout, AdminLayout (sidebar + routing guard)
      pages/         One file per sidebar page
      pages/admin/   Admin panel pages
      services/api.js  Axios client
  database/
    schema.sql
    seed.sql
```

---

## 7. Testing the Full Flow

1. Log in as **admin** → Stocks → Add Stock (e.g. "ABC Ltd", symbol "ABC", price 500).
2. Log out, log in (or register) as a **user**.
3. Go to Stocks — ABC appears immediately, and its price will start moving on its own within a few seconds.
4. Open ABC's details page to see its live chart, then click **Buy**.
5. Check **Portfolio** — your holding, invested value, current value, and P&L all update automatically as the simulated price moves.
6. **Sell** some or all of the shares — check **Orders**, **Transactions**, and **P&L** to see everything recorded.
7. Back in the admin panel, **Admin → Orders** shows this trade across all users.

---

## 8. Notes

- Prices update via simple polling from the frontend (every 6–8 seconds on relevant pages) — no WebSockets, per project scope.
- Deleting a stock (admin) marks it `inactive` rather than hard-deleting, to preserve order/portfolio history and foreign keys.
- All SQL queries use parameterized statements (`mysql2` placeholders) — no string concatenation.
