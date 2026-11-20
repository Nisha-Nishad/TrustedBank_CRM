const express = require('express');
const {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  submitDealForApproval,
  approveDeal,
  rejectDeal,
  deleteDeal,
} = require('../controllers/dealController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.patch('/:id/stage', updateDealStage);

// Phase 2: Maker-Checker approval workflow endpoints
router.patch('/:id/submit-approval', submitDealForApproval);
router.patch('/:id/approve', requireRole('ADMIN', 'MANAGER'), approveDeal);
router.patch('/:id/reject', requireRole('ADMIN', 'MANAGER'), rejectDeal);

router.delete('/:id', deleteDeal);

module.exports = router;
