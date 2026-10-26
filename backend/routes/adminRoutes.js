const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  listUsers,
  listAllStocks,
  addStock,
  editStock,
  deleteStock,
  listAllOrders
} = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/users', listUsers);
router.get('/stocks', listAllStocks);
router.post('/stocks', addStock);
router.put('/stocks/:id', editStock);
router.delete('/stocks/:id', deleteStock);
router.get('/orders', listAllOrders);

module.exports = router;
