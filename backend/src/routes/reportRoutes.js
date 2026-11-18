const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getReportsSummary, exportPipelineCSV } = require('../controllers/reportController');

router.use(authenticateToken);

router.get('/summary', getReportsSummary);
router.get('/export', exportPipelineCSV);

module.exports = router;
