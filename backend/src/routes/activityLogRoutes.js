const express = require('express');
const { listActivityLogs } = require('../controllers/activityLogController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listActivityLogs);

module.exports = router;
