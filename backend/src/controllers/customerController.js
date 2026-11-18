const { z } = require('zod');
const prisma = require('../config/db');

const customerSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  phone: z.string().min(8, 'Phone number must have at least 8 digits'),
  email: z.string().email('Invalid email address format'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']).default('INDIVIDUAL'),
});

const updateCustomerSchema = customerSchema.partial();

async function listCustomers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, type, city } = req.query;

    const where = {};

    // Role-based data access rule:
    // Sales Rep sees only own data. Manager and Admin see all.
    if (req.user.role === 'SALES_REP') {
      where.createdById = req.user.id;
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    if (city) {
      where.city = { contains: city };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { deals: true, leads: true } },
        },
      }),
    ]);

    return res.json({
      customers,
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

async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        deals: true,
        leads: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Role-based access rule
    if (req.user.role === 'SALES_REP' && customer.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own customers' });
    }

    return res.json({ customer });
  } catch (err) {
    next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const newCustomer = await prisma.customer.create({
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
        entityType: 'CUSTOMER',
        entityId: newCustomer.id,
        details: `Created customer ${newCustomer.name} (${newCustomer.type})`,
      },
    });

    return res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const parseResult = updateCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (req.user.role === 'SALES_REP' && existingCustomer.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own customers' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: parseResult.data,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'CUSTOMER',
        entityId: id,
        details: `Updated customer ${updatedCustomer.name}: ${JSON.stringify(parseResult.data)}`,
      },
    });

    return res.json({ message: 'Customer updated successfully', customer: updatedCustomer });
  } catch (err) {
    next(err);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (req.user.role === 'SALES_REP' && existingCustomer.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own customers' });
    }

    // Clean linked deals/leads relations or delete
    await prisma.deal.deleteMany({ where: { customerId: id } });
    await prisma.task.deleteMany({ where: { relatedType: 'CUSTOMER', relatedId: id } });
    await prisma.note.deleteMany({ where: { relatedType: 'CUSTOMER', relatedId: id } });
    await prisma.customer.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'CUSTOMER',
        entityId: id,
        details: `Deleted customer ${existingCustomer.name}`,
      },
    });

    return res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
