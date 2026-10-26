// MySQL connection pool. Every query in this app goes through this pool
// using parameterized queries (never raw string concatenation).
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'virtual_trading',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true // return DECIMAL columns as JS numbers, not strings
});

module.exports = pool;
