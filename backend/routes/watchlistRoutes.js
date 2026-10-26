const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getWatchlist);
router.post('/', requireAuth, addToWatchlist);
router.delete('/:stockId', requireAuth, removeFromWatchlist);

module.exports = router;
