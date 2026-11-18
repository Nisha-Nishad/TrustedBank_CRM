const prisma = require('../config/db');

async function globalSearch(req, res, next) {
  try {
    const query = req.query.q?.trim() || '';
    if (!query || query.length < 2) {
      return res.json({ customers: [], leads: [], deals: [] });
    }

    const isRep = req.user.role === 'SALES_REP';
    const repId = req.user.id;

    const [customers, leads, deals] = await Promise.all([
      prisma.customer.findMany({
        where: {
          ...(isRep ? { createdById: repId } : {}),
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
            { city: { contains: query } },
          ],
        },
        take: 4,
        select: { id: true, name: true, phone: true, city: true, type: true },
      }),
      prisma.lead.findMany({
        where: {
          ...(isRep ? { assignedToId: repId } : {}),
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
            { productInterest: { contains: query } },
          ],
        },
        take: 4,
        select: { id: true, name: true, phone: true, productInterest: true, status: true },
      }),
      prisma.deal.findMany({
        where: {
          ...(isRep ? { ownerId: repId } : {}),
          OR: [
            { title: { contains: query } },
            { stage: { contains: query } },
          ],
        },
        take: 4,
        select: {
          id: true,
          title: true,
          amount: true,
          stage: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    return res.json({
      query,
      totalMatches: customers.length + leads.length + deals.length,
      customers,
      leads,
      deals,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  globalSearch,
};
