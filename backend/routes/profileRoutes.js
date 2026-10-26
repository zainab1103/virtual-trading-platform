const express = require('express');
const router = express.Router();
const { getProfile, getDashboard } = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');

router.get('/profile', requireAuth, getProfile);
router.get('/dashboard', requireAuth, getDashboard);

module.exports = router;
