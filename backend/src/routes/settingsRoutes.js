const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getSettings,
  updateBranchSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  changePassword,
} = require('../controllers/settingsController');

router.use(authenticateToken);

router.get('/', getSettings);
router.put('/branch', updateBranchSettings);
router.put('/security', updateSecuritySettings);
router.put('/notifications', updateNotificationSettings);
router.post('/change-password', changePassword);

module.exports = router;
