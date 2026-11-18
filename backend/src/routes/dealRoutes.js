const express = require('express');
const {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} = require('../controllers/dealController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.patch('/:id/stage', updateDealStage);
router.delete('/:id', deleteDeal);

module.exports = router;
