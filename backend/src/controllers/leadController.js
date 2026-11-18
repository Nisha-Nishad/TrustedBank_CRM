const { z } = require('zod');
const prisma = require('../config/db');

const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  phone: z.string().min(8, 'Phone number must have at least 8 digits'),
  email: z.string().email('Invalid email address format'),
  source: z.enum(['WEBSITE', 'BRANCH', 'REFERRAL', 'CALL']).default('WEBSITE'),
  productInterest: z.string().min(2, 'Product interest is required'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']).default('NEW'),
  assignedToId: z.string().optional().nullable(),
});

const updateLeadSchema = createLeadSchema.partial();

async function listLeads(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { status, source, assignedToId, search } = req.query;

    const where = {};

    // Role-based data access rule:
    // Sales Rep sees only own assigned leads. Manager & Admin see all.
    if (req.user.role === 'SALES_REP') {
      where.assignedToId = req.user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (source) {
      where.source = source.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { productInterest: { contains: search } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          customer: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return res.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getLeadById(req, res, next) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        customer: true,
        deals: true,
      },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Role-based access check
    if (req.user.role === 'SALES_REP' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view leads assigned to you' });
    }

    return res.json({ lead });
  } catch (err) {
    next(err);
  }
}

async function createLead(req, res, next) {
  try {
    const parseResult = createLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Default assignedToId for Sales Rep to self if not provided
    if (req.user.role === 'SALES_REP' && !data.assignedToId) {
      data.assignedToId = req.user.id;
    }

    const newLead = await prisma.lead.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'LEAD',
        entityId: newLead.id,
        details: `Created lead ${newLead.name} (${newLead.productInterest})`,
      },
    });

    return res.status(201).json({ message: 'Lead created successfully', lead: newLead });
  } catch (err) {
    next(err);
  }
}

async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const parseResult = updateLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (req.user.role === 'SALES_REP' && existingLead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your assigned leads' });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: parseResult.data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'LEAD',
        entityId: id,
        details: `Updated lead ${updatedLead.name}: ${JSON.stringify(parseResult.data)}`,
      },
    });

    return res.json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (err) {
    next(err);
  }
}

async function convertLead(req, res, next) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (req.user.role === 'SALES_REP' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only convert your assigned leads' });
    }

    if (lead.status === 'CONVERTED' || lead.customerId) {
      return res.status(400).json({ error: 'Lead is already converted to a customer' });
    }

    // Atomic transaction for conversion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create customer
      const customer = await tx.customer.create({
        data: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          type: 'INDIVIDUAL',
          createdById: lead.assignedToId || req.user.id,
        },
      });

      // 2. Update lead status & link to customer
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          customerId: customer.id,
        },
      });

      // 3. Link any existing deals from this lead to the new customer
      await tx.deal.updateMany({
        where: { leadId: lead.id },
        data: { customerId: customer.id },
      });

      // 4. Log conversion activity
      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'CONVERT',
          entityType: 'LEAD',
          entityId: lead.id,
          details: `Converted lead ${lead.name} to customer ${customer.name} (#${customer.id})`,
        },
      });

      return { customer, lead: updatedLead };
    });

    return res.json({
      message: 'Lead successfully converted to customer',
      customer: result.customer,
      lead: result.lead,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (req.user.role === 'SALES_REP' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your assigned leads' });
    }

    await prisma.task.deleteMany({ where: { relatedType: 'LEAD', relatedId: id } });
    await prisma.note.deleteMany({ where: { relatedType: 'LEAD', relatedId: id } });
    await prisma.deal.deleteMany({ where: { leadId: id } });
    await prisma.lead.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'LEAD',
        entityId: id,
        details: `Deleted lead ${lead.name}`,
      },
    });

    return res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
};
