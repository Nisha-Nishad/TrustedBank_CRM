const express = require('express');
const { listActivityLogs, rejectModification } = require('../controllers/activityLogController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listActivityLogs);

// Immutable Audit Trail Guards: Any attempt to modify or delete returns 403 Forbidden
router.put('/:id', rejectModification);
router.patch('/:id', rejectModification);
router.delete('/:id', rejectModification);
router.delete('/', rejectModification);

module.exports = router;
