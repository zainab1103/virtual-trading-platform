-- Seed data for Virtual Trading Platform
-- Run AFTER schema.sql: mysql -u root -p virtual_trading < seed.sql
-- NOTE: passwords below are salt:hash pairs (Node crypto.scrypt) of "admin123" and "user123"
-- Admin login:  admin@vtp.com / admin123
-- User login:   demo@vtp.com  / user123

USE virtual_trading;

INSERT INTO users (name, email, password, role, status) VALUES
('Admin', 'admin@vtp.com', '1ca7cbdd55ee8821f0ed56d7b8d36eb1:31684a1538ba90af96c90c686705e0fa391afd107aaebe755abbc78eeccfca94ebc82a5310628362fb88efc428cc1c2acd551d3bbd7c76a0e95b95a9d5dfc976', 'admin', 'active'),
('Demo User', 'demo@vtp.com', 'ec4c23a4dbf2a3b4f3278aaa4560c5ba:1045ffbb19c14bace81d29fac6a6354a908f0393d2ed913c430ae75a7e5f8aa0aac2d7d1917ecd3b43f44a23e427e2d0ffcd7f3306d733048dbe0348cbce2d7c', 'user', 'active');

INSERT INTO wallet (user_id, initial_balance, available_balance)
SELECT id, 100000.00, 100000.00 FROM users WHERE role = 'user';

INSERT INTO stocks (company_name, symbol, current_price, previous_close, open_price, day_high, day_low, volume, description, status) VALUES
('Reliance Industries', 'RELIANCE', 1420.50, 1403.30, 1405.00, 1430.00, 1398.00, 1200000, 'India\'s largest private sector conglomerate (simulated).', 'active'),
('Tata Consultancy Services', 'TCS', 3180.20, 3192.90, 3190.00, 3210.00, 3170.00, 850000, 'Leading global IT services and consulting company (simulated).', 'active'),
('Infosys', 'INFY', 1650.80, 1638.60, 1640.00, 1662.00, 1630.00, 950000, 'Global IT consulting and outsourcing company (simulated).', 'active'),
('HDFC Bank', 'HDFCBANK', 1540.00, 1535.20, 1536.00, 1550.00, 1528.00, 700000, 'Private sector bank (simulated).', 'active'),
('ICICI Bank', 'ICICIBANK', 1120.40, 1112.80, 1115.00, 1128.00, 1108.00, 640000, 'Private sector bank (simulated).', 'active'),
('ITC Limited', 'ITC', 435.60, 432.10, 433.00, 438.00, 430.00, 1100000, 'Diversified FMCG conglomerate (simulated).', 'active'),
('State Bank of India', 'SBIN', 815.30, 810.00, 811.00, 820.00, 806.00, 900000, 'Largest public sector bank (simulated).', 'active'),
('Larsen & Toubro', 'LT', 3550.00, 3565.40, 3560.00, 3580.00, 3540.00, 300000, 'Engineering and construction conglomerate (simulated).', 'active'),
('Wipro', 'WIPRO', 480.20, 478.50, 479.00, 486.00, 475.00, 500000, 'IT services company (simulated).', 'active'),
('Hindustan Unilever', 'HINDUNILVR', 2480.90, 2470.30, 2472.00, 2495.00, 2465.00, 420000, 'FMCG company (simulated).', 'active');

-- seed initial price history point for each stock (matches current_price)
INSERT INTO stock_prices (stock_id, price)
SELECT id, current_price FROM stocks;
