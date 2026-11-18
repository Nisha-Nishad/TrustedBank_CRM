const prisma = require('../config/db');

async function listActivityLogs(req, res, next) {
  try {
    const { entityType, entityId, userId, limit } = req.query;

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

    const take = Math.max(1, Math.min(100, parseInt(limit) || 20));

    const logs = await prisma.activityLog.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.json({ logs, total: logs.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listActivityLogs,
};
