const express = require('express');
const router = express.Router();
const { getPortfolio, getPortfolioSummary } = require('../controllers/portfolioController');
const { requireAuth } = require('../middleware/auth');

router.get('/summary', requireAuth, getPortfolioSummary);
router.get('/', requireAuth, getPortfolio);

module.exports = router;
