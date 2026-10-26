const express = require('express');
const router = express.Router();
const { buyStock, sellStock, listOrders } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

router.post('/buy', requireAuth, buyStock);
router.post('/sell', requireAuth, sellStock);
router.get('/', requireAuth, listOrders);

module.exports = router;
