const express = require('express');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All user management routes are restricted to ADMIN only
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
