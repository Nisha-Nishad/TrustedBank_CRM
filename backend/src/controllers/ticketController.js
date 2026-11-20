const { z } = require('zod');
const prisma = require('../config/db');

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_CATEGORIES = ['TRANSACTION_ISSUE', 'CARD_ISSUE', 'LOAN_DISPUTE', 'KYC_ISSUE', 'GENERAL'];

// SLA Due Date helper based on priority
function computeSlaDueDate(priority) {
  const now = new Date();
  switch (priority) {
    case 'URGENT':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    case 'HIGH':
      return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    case 'LOW':
      return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
    case 'MEDIUM':
    default:
      return new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours (3 days)
  }
}

const createTicketSchema = z.object({
  title: z.string().min(3, 'Ticket title must have at least 3 characters'),
  description: z.string().min(5, 'Ticket description must have at least 5 characters'),
  customerId: z.string().min(1, 'customerId is required'),
  category: z.enum(VALID_CATEGORIES).optional().default('GENERAL'),
  priority: z.enum(VALID_PRIORITIES).optional().default('MEDIUM'),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const updateTicketSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  priority: z.enum(VALID_PRIORITIES).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  assignedToId: z.string().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
});

async function listTickets(req, res, next) {
  try {
    const { status, priority, category, customerId, assignedToId } = req.query;

    const where = {};

    // Role-based data access:
    // Sales Rep sees tickets assigned to them or for their customers
    if (req.user.role === 'SALES_REP') {
      where.OR = [
        { assignedToId: req.user.id },
        { customer: { createdById: req.user.id } },
      ];
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }
    if (priority) {
      where.priority = priority.toUpperCase();
    }
    if (category) {
      where.category = category.toUpperCase();
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return res.json({ tickets, total: tickets.length });
  } catch (err) {
    next(err);
  }
}

async function getTicketById(req, res, next) {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (
      req.user.role === 'SALES_REP' &&
      ticket.assignedToId !== req.user.id &&
      ticket.customer?.createdById !== req.user.id
    ) {
      return res.status(403).json({ error: 'Forbidden: You can only view tickets assigned to you or your customers' });
    }

    return res.json({ ticket });
  } catch (err) {
    next(err);
  }
}

async function createTicket(req, res, next) {
  try {
    const parseResult = createTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { customerId, title, description, category, priority, assignedToId, dueDate } = parseResult.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Generate unique sequential ticket number
    const count = await prisma.ticket.count();
    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const calculatedDueDate = dueDate ? new Date(dueDate) : computeSlaDueDate(priority || 'MEDIUM');

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        customerId,
        assignedToId: assignedToId || req.user.id,
        createdById: req.user.id,
        dueDate: calculatedDueDate,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'TICKET_CREATE',
        entityType: 'TICKET',
        entityId: newTicket.id,
        details: `Created support ticket ${ticketNumber}: "${title}" for ${customer.name}`,
      },
    });

    return res.status(201).json({
      message: 'Support ticket registered successfully',
      ticket: newTicket,
    });
  } catch (err) {
    next(err);
  }
}

async function updateTicket(req, res, next) {
  try {
    const { id } = req.params;
    const parseResult = updateTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updateData = { ...parseResult.data };
    if (updateData.status === 'RESOLVED' || updateData.status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'TICKET_UPDATE',
        entityType: 'TICKET',
        entityId: id,
        details: `Updated ticket ${updated.ticketNumber}: status is now ${updated.status}`,
      },
    });

    return res.json({ message: 'Ticket updated successfully', ticket: updated });
  } catch (err) {
    next(err);
  }
}

async function updateTicketStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const isResolved = status.toUpperCase() === 'RESOLVED' || status.toUpperCase() === 'CLOSED';

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        resolvedAt: isResolved ? new Date() : null,
        resolutionNotes: resolutionNotes || existing.resolutionNotes,
      },
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'TICKET_STATUS_CHANGE',
        entityType: 'TICKET',
        entityId: id,
        details: `Ticket ${updated.ticketNumber} moved from ${existing.status} to ${status.toUpperCase()}`,
      },
    });

    return res.json({ message: `Ticket status updated to ${status.toUpperCase()}`, ticket: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTicket(req, res, next) {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await prisma.ticket.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'TICKET_DELETE',
        entityType: 'TICKET',
        entityId: id,
        details: `Deleted ticket ${ticket.ticketNumber}`,
      },
    });

    return res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_CATEGORIES,
  computeSlaDueDate,
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
};
