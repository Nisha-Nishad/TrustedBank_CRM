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

const VALID_LOAN_TYPES = [
  'HOME_LOAN',
  'PERSONAL_LOAN',
  'AUTO_LOAN',
  'BUSINESS_LOAN',
  'GOLD_LOAN',
  'EDUCATION_LOAN',
];

// Helper: Calculate standard banking EMI and FOIR eligibility
function evaluateLoanEligibility(amount, tenureMonths = 36, interestRate = 10.5, monthlyIncome = 0) {
  if (!amount || amount <= 0) {
    return { eligibilityStatus: 'PENDING', eligibilityNotes: 'Loan amount required to assess eligibility' };
  }

  const P = amount;
  const n = tenureMonths || 36;
  const annualRate = interestRate || 10.5;
  const r = annualRate / 12 / 100;

  // Monthly EMI calculation
  let emi = 0;
  if (r > 0) {
    emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  } else {
    emi = Math.round(P / n);
  }

  if (!monthlyIncome || monthlyIncome <= 0) {
    return {
      eligibilityStatus: 'CONDITIONAL',
      eligibilityNotes: `Estimated EMI is ₹${emi.toLocaleString('en-IN')}/month @ ${annualRate}% for ${n} months. Applicant monthly income proof required for final sanction.`,
      estimatedEMI: emi,
    };
  }

  const foir = emi / monthlyIncome;

  if (foir <= 0.50) {
    return {
      eligibilityStatus: 'ELIGIBLE',
      eligibilityNotes: `Eligible: Monthly EMI ₹${emi.toLocaleString('en-IN')} is ${(foir * 100).toFixed(1)}% of income (within 50% RBI FOIR threshold). Standard interest rate of ${annualRate}% applied.`,
      estimatedEMI: emi,
    };
  } else if (foir <= 0.65) {
    return {
      eligibilityStatus: 'CONDITIONAL',
      eligibilityNotes: `Conditional: Monthly EMI ₹${emi.toLocaleString('en-IN')} is ${(foir * 100).toFixed(1)}% of income (exceeds 50% limit). Requires credit-worthy co-applicant or 20% additional collateral.`,
      estimatedEMI: emi,
    };
  } else {
    return {
      eligibilityStatus: 'INELIGIBLE',
      eligibilityNotes: `Ineligible: Monthly EMI ₹${emi.toLocaleString('en-IN')} is ${(foir * 100).toFixed(1)}% of income (exceeds 65% hard debt-service limit). Recommended max loan is ₹${Math.round((monthlyIncome * 0.50 * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))).toLocaleString('en-IN')}.`,
      estimatedEMI: emi,
    };
  }
}

const createDealSchema = z.object({
  title: z.string().min(2, 'Deal title must have at least 2 characters'),
  amount: z.number().positive('Deal amount must be a positive number'),
  stage: z.enum(VALID_STAGES).default('NEW'),
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  loanType: z.string().optional().default('PERSONAL_LOAN'),
  tenureMonths: z.number().int().positive().optional().default(36),
  interestRate: z.number().positive().optional().default(10.5),
  monthlyIncome: z.number().nonnegative().optional().nullable(),
});

const updateDealSchema = createDealSchema.partial();

const stageChangeSchema = z.object({
  stage: z.enum(VALID_STAGES, {
    errorMap: () => ({ message: `Stage must be one of: ${VALID_STAGES.join(', ')}` }),
  }),
});

async function listDeals(req, res, next) {
  try {
    const { stage, ownerId, customerId, leadId, groupBy, approvalStatus } = req.query;

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
    if (approvalStatus) {
      where.approvalStatus = approvalStatus.toUpperCase();
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
        customer: { select: { id: true, name: true, phone: true, email: true, kycStatus: true } },
        lead: { select: { id: true, name: true, phone: true, email: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
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
        approvedBy: { select: { id: true, name: true, role: true } },
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

    // Auto-calculate loan eligibility if amount and details provided
    const eligibility = evaluateLoanEligibility(
      data.amount,
      data.tenureMonths || 36,
      data.interestRate || 10.5,
      data.monthlyIncome || 0
    );

    data.eligibilityStatus = eligibility.eligibilityStatus;
    data.eligibilityNotes = eligibility.eligibilityNotes;

    const newDeal = await prisma.deal.create({
      data,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        customer: { select: { id: true, name: true, kycStatus: true } },
        lead: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'DEAL',
        entityId: newDeal.id,
        details: `Created ${newDeal.loanType || 'loan'} deal "${newDeal.title}" with value ₹${newDeal.amount.toLocaleString('en-IN')}. Eligibility: ${newDeal.eligibilityStatus}`,
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

    const updateData = { ...parseResult.data };

    // Re-evaluate eligibility if financial terms changed
    if (updateData.amount || updateData.tenureMonths || updateData.interestRate || updateData.monthlyIncome !== undefined) {
      const eligibility = evaluateLoanEligibility(
        updateData.amount || existingDeal.amount,
        updateData.tenureMonths || existingDeal.tenureMonths || 36,
        updateData.interestRate || existingDeal.interestRate || 10.5,
        updateData.monthlyIncome !== undefined ? updateData.monthlyIncome : (existingDeal.monthlyIncome || 0)
      );
      updateData.eligibilityStatus = eligibility.eligibilityStatus;
      updateData.eligibilityNotes = eligibility.eligibilityNotes;
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        customer: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'DEAL',
        entityId: id,
        details: `Updated deal "${updatedDeal.title}"`,
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

// Phase 2: Maker-Checker Workflow - Submit Deal for Approval (Maker)
async function submitDealForApproval(req, res, next) {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && deal.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only submit your own deals for approval' });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        approvalStatus: 'SUBMITTED_FOR_APPROVAL',
        submittedAt: new Date(),
        stage: 'VERIFICATION',
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        customer: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DEAL_SUBMIT_APPROVAL',
        entityType: 'DEAL',
        entityId: id,
        details: `Deal "${deal.title}" (₹${deal.amount.toLocaleString('en-IN')}) submitted for credit committee approval`,
      },
    });

    return res.json({
      message: 'Deal submitted for manager credit approval successfully',
      deal: updatedDeal,
    });
  } catch (err) {
    next(err);
  }
}

// Phase 2: Maker-Checker Workflow - Approve Deal (Checker: Manager or Admin)
async function approveDeal(req, res, next) {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Role check: Sales Rep cannot approve deals
    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can approve deals' });
    }

    // Crucial Maker-Checker Rule: Maker cannot be Checker!
    if (deal.ownerId === req.user.id) {
      return res.status(403).json({
        error: 'Maker-Checker Violation: Maker cannot be the checker. You cannot approve your own deal submission.',
      });
    }

    // Crucial Banking Rule: Rejected KYC blocks deal approval!
    if (deal.customer && deal.customer.kycStatus === 'REJECTED') {
      return res.status(400).json({
        error: 'Cannot approve deal: Customer KYC status is REJECTED. KYC compliance verification must pass before sanction.',
      });
    }

    const approvedDeal = await prisma.deal.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        stage: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        approvalNotes: approvalNotes || 'Approved by Branch Credit Committee',
        rejectionReason: null,
      },
      include: {
        owner: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
        customer: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DEAL_APPROVE',
        entityType: 'DEAL',
        entityId: id,
        details: `Approved loan deal "${deal.title}" (₹${deal.amount.toLocaleString('en-IN')}) by ${req.user.name}`,
      },
    });

    return res.json({
      message: 'Deal sanctioned and approved successfully',
      deal: approvedDeal,
    });
  } catch (err) {
    next(err);
  }
}

// Phase 2: Maker-Checker Workflow - Reject Deal (Checker: Manager or Admin)
async function rejectDeal(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can reject deals' });
    }

    // Maker cannot be Checker rule
    if (deal.ownerId === req.user.id) {
      return res.status(403).json({
        error: 'Maker-Checker Violation: Maker cannot be the checker. You cannot reject your own deal submission.',
      });
    }

    const reason = rejectionReason || 'Credit underwriting criteria not satisfied';

    const rejectedDeal = await prisma.deal.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        stage: 'LOST',
        closedAt: new Date(),
        approvedById: req.user.id,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        owner: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
        customer: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DEAL_REJECT',
        entityType: 'DEAL',
        entityId: id,
        details: `Rejected loan deal "${deal.title}": ${reason}`,
      },
    });

    return res.json({
      message: 'Deal rejected by credit authority',
      deal: rejectedDeal,
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
  VALID_LOAN_TYPES,
  evaluateLoanEligibility,
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  submitDealForApproval,
  approveDeal,
  rejectDeal,
  deleteDeal,
};
