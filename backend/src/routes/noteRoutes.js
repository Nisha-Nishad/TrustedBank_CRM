const express = require('express');
const { listNotes, createNote, deleteNote } = require('../controllers/noteController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', listNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

module.exports = router;
