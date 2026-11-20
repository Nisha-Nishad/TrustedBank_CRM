const prisma = require('../config/db');

async function listActivityLogs(req, res, next) {
  try {
    const { entityType, entityId, userId, action, startDate, endDate, limit, page } = req.query;

    const where = {};
    if (entityType) {
      where.entityType = entityType.toUpperCase();
    }
    if (entityId) {
      where.entityId = entityId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = action.toUpperCase();
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const take = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = page ? (Math.max(1, parseInt(page)) - 1) * take : 0;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return res.json({ logs, total, page: page ? parseInt(page) : 1, limit: take });
  } catch (err) {
    next(err);
  }
}

// Immutability Guard: Prompt 3 requirement - Audit logs cannot be edited or deleted
function rejectModification(req, res) {
  return res.status(403).json({
    error: 'Forbidden: Immutable Audit Trail. Bank regulatory audit logs cannot be edited or deleted.',
  });
}

module.exports = {
  listActivityLogs,
  rejectModification,
};
