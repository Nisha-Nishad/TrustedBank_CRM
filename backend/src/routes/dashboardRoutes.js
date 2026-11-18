const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', getDashboardSummary);

module.exports = router;
