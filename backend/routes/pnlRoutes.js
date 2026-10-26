const express = require('express');
const router = express.Router();
const { getPnl } = require('../controllers/pnlController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getPnl);

module.exports = router;
