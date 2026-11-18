const prisma = require('../config/db');
const { VALID_STAGES } = require('./dealController');

async function getDashboardSummary(req, res, next) {
  try {
    const isRep = req.user.role === 'SALES_REP';
    const repId = req.user.id;

    // Filters based on role
    const customerWhere = isRep ? { createdById: repId } : {};
    const leadWhere = isRep ? { assignedToId: repId } : {};
    const dealWhere = isRep ? { ownerId: repId } : {};
    const taskWhere = isRep ? { assignedToId: repId } : {};

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalLeads,
      totalCustomers,
      deals,
      pendingTodayTasksCount,
      recentActivities,
    ] = await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.customer.count({ where: customerWhere }),
      prisma.deal.findMany({ where: dealWhere, select: { stage: true, amount: true } }),
      prisma.task.count({
        where: {
          ...taskWhere,
          status: 'PENDING',
          dueDate: { lte: endOfToday },
        },
      }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      }),
    ]);

    // Calculate stage breakdown & totals
    const stageBreakdown = {};
    VALID_STAGES.forEach((s) => {
      stageBreakdown[s] = { count: 0, amount: 0 };
    });

    let wonDealsCount = 0;
    let wonDealsValue = 0;
    let totalPipelineValue = 0;

    deals.forEach((d) => {
      totalPipelineValue += d.amount;
      if (stageBreakdown[d.stage]) {
        stageBreakdown[d.stage].count += 1;
        stageBreakdown[d.stage].amount += d.amount;
      }
      if (d.stage === 'WON') {
        wonDealsCount += 1;
        wonDealsValue += d.amount;
      }
    });

    const conversionRate = totalLeads > 0
      ? Number(((wonDealsCount / totalLeads) * 100).toFixed(1))
      : 0;

    return res.json({
      summary: {
        totalLeads,
        totalCustomers,
        wonDealsCount,
        wonDealsValue,
        totalPipelineValue,
        conversionRate,
        pendingTodayTasksCount,
      },
      stageBreakdown,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
};
