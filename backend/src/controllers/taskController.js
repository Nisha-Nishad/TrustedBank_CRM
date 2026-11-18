const { z } = require('zod');
const prisma = require('../config/db');

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title must have at least 2 characters'),
  type: z.enum(['CALL', 'MEETING', 'EMAIL', 'FOLLOW_UP']).default('FOLLOW_UP'),
  dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  status: z.enum(['PENDING', 'COMPLETED']).default('PENDING'),
  relatedType: z.enum(['LEAD', 'CUSTOMER', 'DEAL']),
  relatedId: z.string().min(1, 'Related entity ID is required'),
  assignedToId: z.string().optional().nullable(),
});

const updateTaskSchema = createTaskSchema.partial();

async function listTasks(req, res, next) {
  try {
    const { tab, status, type, relatedType, relatedId, assignedToId } = req.query;

    const where = {};

    // Role-based data access rule:
    // Sales Rep sees only own tasks. Manager & Admin see all.
    if (req.user.role === 'SALES_REP') {
      where.assignedToId = req.user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (type) {
      where.type = type.toUpperCase();
    }
    if (relatedType) {
      where.relatedType = relatedType.toUpperCase();
    }
    if (relatedId) {
      where.relatedId = relatedId;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (tab === 'today') {
      where.dueDate = { gte: startOfToday, lte: endOfToday };
      where.status = 'PENDING';
    } else if (tab === 'upcoming') {
      where.dueDate = { gt: endOfToday };
      where.status = 'PENDING';
    } else if (tab === 'overdue') {
      where.dueDate = { lt: startOfToday };
      where.status = 'PENDING';
    } else if (tab === 'completed') {
      where.status = 'COMPLETED';
    } else if (status) {
      where.status = status.toUpperCase();
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.json({ tasks, total: tasks.length });
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role === 'SALES_REP' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own assigned tasks' });
    }

    return res.json({ task });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Convert string date to Date object
    data.dueDate = new Date(data.dueDate);

    // Default assignedToId to self for Sales Rep
    if (req.user.role === 'SALES_REP' || !data.assignedToId) {
      data.assignedToId = req.user.id;
    }

    const newTask = await prisma.task.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'TASK',
        entityId: newTask.id,
        details: `Created task "${newTask.title}" (${newTask.type})`,
      },
    });

    return res.status(201).json({ message: 'Task created successfully', task: newTask });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role === 'SALES_REP' && existingTask.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own tasks' });
    }

    const updateData = { ...parseResult.data };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: id,
        details: `Updated task "${updatedTask.title}"`,
      },
    });

    return res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (err) {
    next(err);
  }
}

async function toggleTaskComplete(req, res, next) {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role === 'SALES_REP' && existingTask.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own tasks' });
    }

    const targetStatus = req.body.status
      ? req.body.status.toUpperCase()
      : existingTask.status === 'COMPLETED'
      ? 'PENDING'
      : 'COMPLETED';

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: id,
        details: `Marked task "${updatedTask.title}" as ${targetStatus}`,
      },
    });

    return res.json({
      message: `Task marked as ${targetStatus}`,
      task: updatedTask,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role === 'SALES_REP' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own tasks' });
    }

    await prisma.task.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'TASK',
        entityId: id,
        details: `Deleted task "${task.title}"`,
      },
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskComplete,
  deleteTask,
};
