const { z } = require('zod');
const prisma = require('../config/db');

const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
  relatedType: z.enum(['LEAD', 'CUSTOMER', 'DEAL']),
  relatedId: z.string().min(1, 'Related entity ID is required'),
});

async function listNotes(req, res, next) {
  try {
    const { relatedType, relatedId } = req.query;

    const where = {};
    if (relatedType) {
      where.relatedType = relatedType.toUpperCase();
    }
    if (relatedId) {
      where.relatedId = relatedId;
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.json({ notes, total: notes.length });
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const parseResult = createNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const newNote = await prisma.note.create({
      data: {
        ...parseResult.data,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'NOTE',
        entityId: newNote.id,
        details: `Added note on ${newNote.relatedType} (#${newNote.relatedId})`,
      },
    });

    return res.status(201).json({ message: 'Note added successfully', note: newNote });
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    const { id } = req.params;

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Only note creator, Manager, or Admin can delete a note
    if (req.user.role === 'SALES_REP' && note.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own notes' });
    }

    await prisma.note.delete({ where: { id } });

    return res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotes,
  createNote,
  deleteNote,
};
