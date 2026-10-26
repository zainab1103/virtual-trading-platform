const express = require('express');
const router = express.Router();
const { listStocks, getStockDetails, getStockPriceHistory } = require('../controllers/stockController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listStocks);
router.get('/:id', requireAuth, getStockDetails);
router.get('/:id/prices', requireAuth, getStockPriceHistory);

module.exports = router;
