const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const ticketController = require('../controllers/ticketController');

router.use(authenticateToken);

router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', ticketController.createTicket);
router.put('/:id', ticketController.updateTicket);
router.patch('/:id/status', ticketController.updateTicketStatus);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), ticketController.deleteTicket);

module.exports = router;
