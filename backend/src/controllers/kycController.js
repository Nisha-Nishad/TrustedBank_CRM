const prisma = require('../config/db');
const { z } = require('zod');

// Masking helper for sensitive ID numbers (Aadhaar, PAN)
function maskDocumentNumber(docType, num) {
  if (!num) return '';
  const clean = String(num).trim();
  if (clean.length <= 4) return '****';
  // If PAN (10 chars, e.g. ABCDE1234F -> AB****34F)
  if (docType === 'PAN' && clean.length === 10) {
    return `${clean.slice(0, 2)}****${clean.slice(7)}`;
  }
  // If Aadhaar (12 chars -> XXXX-XXXX-1234)
  if (docType === 'AADHAAR' && clean.length >= 12) {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  // Default: show first 2 and last 4
  return `${clean.slice(0, 2)}****${clean.slice(-4)}`;
}

// Recalculate customer's overall KYC status
async function recalculateCustomerKycStatus(customerId) {
  const docs = await prisma.kycDocument.findMany({
    where: { customerId },
  });

  if (docs.length === 0) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { kycStatus: 'PENDING' },
    });
    return 'PENDING';
  }

  const hasRejected = docs.some((d) => d.status === 'REJECTED');
  if (hasRejected) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { kycStatus: 'REJECTED' },
    });
    return 'REJECTED';
  }

  const allVerified = docs.length > 0 && docs.every((d) => d.status === 'VERIFIED');
  const newStatus = allVerified ? 'VERIFIED' : 'PENDING';

  await prisma.customer.update({
    where: { id: customerId },
    data: { kycStatus: newStatus },
  });

  return newStatus;
}

const addDocumentSchema = z.object({
  documentType: z.enum(['PAN', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'SALARY_SLIP', 'BANK_STATEMENT', 'ITR']),
  documentNumber: z.string().min(4, 'Document number must be at least 4 characters'),
  fileUrl: z.string().optional(),
});

// List documents for a customer
async function getCustomerDocuments(req, res, next) {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Role isolation check for Sales Rep
    if (req.user.role === 'SALES_REP' && customer.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view documents for your own customers' });
    }

    const documents = await prisma.kycDocument.findMany({
      where: { customerId },
      include: {
        verifiedBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask document numbers for standard view unless explicitly unmasked
    const maskedDocs = documents.map((doc) => ({
      ...doc,
      maskedNumber: maskDocumentNumber(doc.documentType, doc.documentNumber),
    }));

    return res.json({
      customerId,
      overallKycStatus: customer.kycStatus,
      documents: maskedDocs,
    });
  } catch (err) {
    next(err);
  }
}

// Add a new KYC document
async function addCustomerDocument(req, res, next) {
  try {
    const { customerId } = req.params;

    const parseResult = addDocumentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (req.user.role === 'SALES_REP' && customer.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only upload documents for your own customers' });
    }

    let fileUrl = req.body.fileUrl;
    if (req.file) {
      fileUrl = `/uploads/kyc/${req.file.filename}`;
    }

    const newDoc = await prisma.kycDocument.create({
      data: {
        customerId,
        documentType: parseResult.data.documentType,
        documentNumber: parseResult.data.documentNumber.trim(),
        fileUrl: fileUrl || null,
        status: 'PENDING',
      },
    });

    await recalculateCustomerKycStatus(customerId);

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'KYC_UPLOAD',
        entityType: 'KYC_DOCUMENT',
        entityId: newDoc.id,
        details: `Uploaded ${newDoc.documentType} document for customer ${customer.name}`,
      },
    });

    return res.status(201).json({
      message: 'KYC document registered successfully',
      document: {
        ...newDoc,
        maskedNumber: maskDocumentNumber(newDoc.documentType, newDoc.documentNumber),
      },
    });
  } catch (err) {
    next(err);
  }
}

// Verify a KYC Document (Manager / Admin only)
async function verifyDocument(req, res, next) {
  try {
    const { id } = req.params;

    // Strict role check: Sales Rep cannot verify KYC documents
    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can verify KYC documents' });
    }

    const document = await prisma.kycDocument.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    const updatedDoc = await prisma.kycDocument.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        verifiedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    const newOverallStatus = await recalculateCustomerKycStatus(document.customerId);

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'KYC_VERIFY',
        entityType: 'KYC_DOCUMENT',
        entityId: updatedDoc.id,
        details: `Verified ${document.documentType} for ${document.customer.name}. Overall KYC: ${newOverallStatus}`,
      },
    });

    return res.json({
      message: 'Document verified successfully',
      document: {
        ...updatedDoc,
        maskedNumber: maskDocumentNumber(updatedDoc.documentType, updatedDoc.documentNumber),
      },
      overallKycStatus: newOverallStatus,
    });
  } catch (err) {
    next(err);
  }
}

// Reject a KYC Document (Manager / Admin only)
async function rejectDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can reject KYC documents' });
    }

    if (!rejectionReason || rejectionReason.trim().length < 3) {
      return res.status(400).json({ error: 'Validation Error: rejectionReason is required' });
    }

    const document = await prisma.kycDocument.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    const updatedDoc = await prisma.kycDocument.update({
      where: { id },
      data: {
        status: 'REJECTED',
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
      },
      include: {
        verifiedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    const newOverallStatus = await recalculateCustomerKycStatus(document.customerId);

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'KYC_REJECT',
        entityType: 'KYC_DOCUMENT',
        entityId: updatedDoc.id,
        details: `Rejected ${document.documentType} for ${document.customer.name}: ${rejectionReason}`,
      },
    });

    return res.json({
      message: 'Document marked as rejected',
      document: {
        ...updatedDoc,
        maskedNumber: maskDocumentNumber(updatedDoc.documentType, updatedDoc.documentNumber),
      },
      overallKycStatus: newOverallStatus,
    });
  } catch (err) {
    next(err);
  }
}

// Delete document record
async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;

    const document = await prisma.kycDocument.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'KYC document not found' });
    }

    if (req.user.role === 'SALES_REP' && document.customer.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete documents of other users' });
    }

    await prisma.kycDocument.delete({ where: { id } });
    const newOverallStatus = await recalculateCustomerKycStatus(document.customerId);

    return res.json({
      message: 'KYC document deleted successfully',
      overallKycStatus: newOverallStatus,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCustomerDocuments,
  addCustomerDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
  maskDocumentNumber,
  recalculateCustomerKycStatus,
};
