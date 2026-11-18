const express = require('express');
const {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
} = require('../controllers/leadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.post('/:id/convert', convertLead);
router.delete('/:id', deleteLead);

module.exports = router;
