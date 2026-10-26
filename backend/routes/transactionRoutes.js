const express = require('express');
const router = express.Router();
const { listTransactions } = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listTransactions);

module.exports = router;
