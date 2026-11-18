const { z } = require('zod');
const prisma = require('../config/db');

const VALID_STAGES = [
  'NEW',
  'CONTACTED',
  'DOCUMENTS',
  'VERIFICATION',
  'APPROVED',
  'WON',
  'LOST',
];

const createDealSchema = z.object({
  title: z.string().min(2, 'Deal title must have at least 2 characters'),
  amount: z.number().positive('Deal amount must be a positive number'),
  stage: z.enum(VALID_STAGES).default('NEW'),
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
});

const updateDealSchema = createDealSchema.partial();

const stageChangeSchema = z.object({
  stage: z.enum(VALID_STAGES, {
    errorMap: () => ({ message: `Stage must be one of: ${VALID_STAGES.join(', ')}` }),
  }),
});

async function listDeals(req, res, next) {
  try {
    const { stage, ownerId, customerId, leadId, groupBy } = req.query;

    const where = {};

    // Role-based data access rule:
    // Sales Rep sees only own deals. Manager & Admin see all.
    if (req.user.role === 'SALES_REP') {
      where.ownerId = req.user.id;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (stage) {
      where.stage = stage.toUpperCase();
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (leadId) {
      where.leadId = leadId;
    }

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        lead: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    // If Kanban grouping is requested
    if (groupBy === 'stage') {
      const grouped = {};
      VALID_STAGES.forEach((s) => {
        grouped[s] = {
          stage: s,
          count: 0,
          totalAmount: 0,
          deals: [],
        };
      });

      deals.forEach((deal) => {
        if (grouped[deal.stage]) {
          grouped[deal.stage].deals.push(deal);
          grouped[deal.stage].count += 1;
          grouped[deal.stage].totalAmount += deal.amount;
        }
      });

      return res.json({ grouped, totalDeals: deals.length });
    }

    return res.json({ deals, total: deals.length });
  } catch (err) {
    next(err);
  }
}

async function getDealById(req, res, next) {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        customer: true,
        lead: true,
      },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && deal.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own deals' });
    }

    return res.json({ deal });
  } catch (err) {
    next(err);
  }
}

async function createDeal(req, res, next) {
  try {
    const parseResult = createDealSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Default owner to self for Sales Rep
    if (req.user.role === 'SALES_REP' || !data.ownerId) {
      data.ownerId = req.user.id;
    }

    const newDeal = await prisma.deal.create({
      data,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'DEAL',
        entityId: newDeal.id,
        details: `Created deal "${newDeal.title}" with value ₹${newDeal.amount.toLocaleString('en-IN')}`,
      },
    });

    return res.status(201).json({ message: 'Deal created successfully', deal: newDeal });
  } catch (err) {
    next(err);
  }
}

async function updateDeal(req, res, next) {
  try {
    const { id } = req.params;
    const parseResult = updateDealSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && existingDeal.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own deals' });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: parseResult.data,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'DEAL',
        entityId: id,
        details: `Updated deal "${updatedDeal.title}": ${JSON.stringify(parseResult.data)}`,
      },
    });

    return res.json({ message: 'Deal updated successfully', deal: updatedDeal });
  } catch (err) {
    next(err);
  }
}

async function updateDealStage(req, res, next) {
  try {
    const { id } = req.params;
    const parseResult = stageChangeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { stage: newStage } = parseResult.data;

    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && existingDeal.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own deals' });
    }

    const isClosingStage = newStage === 'WON' || newStage === 'LOST';

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        stage: newStage,
        closedAt: isClosingStage ? new Date() : null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        customer: true,
      },
    });

    // Auto-log activity for stage change
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'STAGE_CHANGE',
        entityType: 'DEAL',
        entityId: id,
        details: `Stage changed from ${existingDeal.stage} to ${newStage} for deal "${updatedDeal.title}"`,
      },
    });

    return res.json({
      message: `Deal stage updated to ${newStage}`,
      deal: updatedDeal,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteDeal(req, res, next) {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && deal.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own deals' });
    }

    await prisma.task.deleteMany({ where: { relatedType: 'DEAL', relatedId: id } });
    await prisma.note.deleteMany({ where: { relatedType: 'DEAL', relatedId: id } });
    await prisma.deal.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'DEAL',
        entityId: id,
        details: `Deleted deal "${deal.title}"`,
      },
    });

    return res.json({ message: 'Deal deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  VALID_STAGES,
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
};
