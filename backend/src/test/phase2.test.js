const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Prompt 3: Phase 2 (Bank-Specific Advanced Features)', () => {
  let adminToken;
  let managerToken;
  let rep1Token;
  let rep2Token;
  let rep1User;
  let rep2User;
  let managerUser;

  let testCustomer1;
  let testCustomer2;
  let testDoc1;
  let testDeal1;

  beforeAll(async () => {
    // 1. Authenticate all roles
    const adminRes = await request(app).post('/auth/login').send({
      email: 'admin@trustbank.in',
      password: 'Password@123',
    });
    adminToken = adminRes.body.token;

    const managerRes = await request(app).post('/auth/login').send({
      email: 'manager@trustbank.in',
      password: 'Password@123',
    });
    managerToken = managerRes.body.token;
    managerUser = managerRes.body.user;

    const rep1Res = await request(app).post('/auth/login').send({
      email: 'rep1@trustbank.in',
      password: 'Password@123',
    });
    rep1Token = rep1Res.body.token;
    rep1User = rep1Res.body.user;

    const rep2Res = await request(app).post('/auth/login').send({
      email: 'rep2@trustbank.in',
      password: 'Password@123',
    });
    rep2Token = rep2Res.body.token;
    rep2User = rep2Res.body.user;

    // 2. Setup Test Customers
    testCustomer1 = await prisma.customer.create({
      data: {
        name: 'Phase2 Test Customer A',
        email: 'p2.custA@banktest.com',
        phone: '+91 98200 11221',
        type: 'INDIVIDUAL',
        kycStatus: 'PENDING',
        createdById: rep1User.id,
      },
    });

    testCustomer2 = await prisma.customer.create({
      data: {
        name: 'Phase2 Test Customer B',
        email: 'p2.custB@banktest.com',
        phone: '+91 98200 11222',
        type: 'INDIVIDUAL',
        kycStatus: 'PENDING',
        createdById: rep2User.id,
      },
    });
  });

  afterAll(async () => {
    // Cleanup Phase 2 test entities
    if (testCustomer1) {
      await prisma.ticket.deleteMany({ where: { customerId: testCustomer1.id } });
      await prisma.kycDocument.deleteMany({ where: { customerId: testCustomer1.id } });
      await prisma.deal.deleteMany({ where: { customerId: testCustomer1.id } });
      await prisma.customer.deleteMany({ where: { id: testCustomer1.id } });
    }
    if (testCustomer2) {
      await prisma.ticket.deleteMany({ where: { customerId: testCustomer2.id } });
      await prisma.kycDocument.deleteMany({ where: { customerId: testCustomer2.id } });
      await prisma.deal.deleteMany({ where: { customerId: testCustomer2.id } });
      await prisma.customer.deleteMany({ where: { id: testCustomer2.id } });
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. KYC MODULE TESTS
  // =========================================================================
  describe('1. KYC Module & Document Records', () => {
    it('Happy path: Rep 1 uploads a PAN document for their customer', async () => {
      const res = await request(app)
        .post(`/kyc/customers/${testCustomer1.id}/documents`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          documentType: 'PAN',
          documentNumber: 'ABCDE1234F',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.document.documentType).toBe('PAN');
      expect(res.body.document.status).toBe('PENDING');
      expect(res.body.document.maskedNumber).toBe('AB****34F');
      testDoc1 = res.body.document;
    });

    it('Data Isolation: Rep 2 receives 403 trying to view or upload docs for Rep 1 customer', async () => {
      const res = await request(app)
        .get(`/kyc/customers/${testCustomer1.id}/documents`)
        .set('Authorization', `Bearer ${rep2Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('Role restriction: Sales Rep receives 403 trying to verify KYC document', async () => {
      const res = await request(app)
        .patch(`/kyc/documents/${testDoc1.id}/verify`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('Happy path: Manager verifies KYC document; Customer overall KYC becomes VERIFIED', async () => {
      const res = await request(app)
        .patch(`/kyc/documents/${testDoc1.id}/verify`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.document.status).toBe('VERIFIED');
      expect(res.body.overallKycStatus).toBe('VERIFIED');

      const cust = await prisma.customer.findUnique({ where: { id: testCustomer1.id } });
      expect(cust.kycStatus).toBe('VERIFIED');
    });

    it('Rejection flow: Manager rejects an uploaded document with reason; Customer overall KYC becomes REJECTED', async () => {
      // Rep 1 uploads an Aadhaar doc
      const aadhaarRes = await request(app)
        .post(`/kyc/customers/${testCustomer1.id}/documents`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          documentType: 'AADHAAR',
          documentNumber: '123456789012',
        });
      expect(aadhaarRes.statusCode).toBe(201);
      const aadhaarDocId = aadhaarRes.body.document.id;

      // Manager rejects it
      const rejectRes = await request(app)
        .patch(`/kyc/documents/${aadhaarDocId}/reject`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ rejectionReason: 'Aadhaar copy is blurred and unreadable' });

      expect(rejectRes.statusCode).toBe(200);
      expect(rejectRes.body.document.status).toBe('REJECTED');
      expect(rejectRes.body.document.rejectionReason).toContain('blurred');
      expect(rejectRes.body.overallKycStatus).toBe('REJECTED');

      const cust = await prisma.customer.findUnique({ where: { id: testCustomer1.id } });
      expect(cust.kycStatus).toBe('REJECTED');
    });
  });

  // =========================================================================
  // 2. LOAN PIPELINE & ELIGIBILITY ENGINE TESTS
  // =========================================================================
  describe('2. Loan/Product Pipeline & Eligibility Check', () => {
    it('Happy path: Creates deal with loanType, tenure, and high income -> ELIGIBLE', async () => {
      const res = await request(app)
        .post('/deals')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          title: 'Home Loan Application - ₹40 Lakh',
          amount: 4000000,
          loanType: 'HOME_LOAN',
          tenureMonths: 240, // 20 years
          interestRate: 8.5,
          monthlyIncome: 150000, // EMI ~₹34.7k (well under 50% limit)
          customerId: testCustomer1.id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.deal.loanType).toBe('HOME_LOAN');
      expect(res.body.deal.tenureMonths).toBe(240);
      expect(res.body.deal.eligibilityStatus).toBe('ELIGIBLE');
      expect(res.body.deal.eligibilityNotes).toContain('within 50%');
      expect(res.body.deal.approvalStatus).toBe('DRAFT');
      testDeal1 = res.body.deal;
    });

    it('Income-based calculation: Low income relative to loan -> INELIGIBLE', async () => {
      const res = await request(app)
        .post('/deals')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          title: 'Personal Loan - ₹15 Lakh',
          amount: 1500000,
          loanType: 'PERSONAL_LOAN',
          tenureMonths: 36,
          interestRate: 14.0,
          monthlyIncome: 30000, // EMI ~₹51k exceeds entire income!
          customerId: testCustomer1.id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.deal.eligibilityStatus).toBe('INELIGIBLE');
      expect(res.body.deal.eligibilityNotes).toContain('exceeds 65%');
    });
  });

  // =========================================================================
  // 3. APPROVAL WORKFLOW (MAKER-CHECKER) TESTS
  // =========================================================================
  describe('3. Approval Workflow (Maker-Checker System)', () => {
    it('Maker action: Rep 1 (Maker) submits deal for credit approval', async () => {
      const res = await request(app)
        .patch(`/deals/${testDeal1.id}/submit-approval`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.deal.approvalStatus).toBe('SUBMITTED_FOR_APPROVAL');
      expect(res.body.deal.stage).toBe('VERIFICATION');
    });

    it('CRUCIAL SPECIFIC TEST 1: Maker cannot be Checker! Rep 1 cannot approve their own deal', async () => {
      const res = await request(app)
        .patch(`/deals/${testDeal1.id}/approve`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ approvalNotes: 'Self approval attempt' });

      // Returns 403 Forbidden
      expect(res.statusCode).toBe(403);
    });

    it('CRUCIAL SPECIFIC TEST 2: Rejected KYC blocks deal approval!', async () => {
      // testCustomer1 currently has kycStatus = 'REJECTED' from previous test
      const res = await request(app)
        .patch(`/deals/${testDeal1.id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approvalNotes: 'Manager approves' });

      // Must be blocked with 400 Bad Request
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('REJECTED');
    });

    it('Once KYC is cleared, Manager (Checker) successfully approves deal', async () => {
      // Clear KYC to VERIFIED
      await prisma.customer.update({
        where: { id: testCustomer1.id },
        data: { kycStatus: 'VERIFIED' },
      });

      const res = await request(app)
        .patch(`/deals/${testDeal1.id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approvalNotes: 'Sanctioned by Branch Credit Committee' });

      expect(res.statusCode).toBe(200);
      expect(res.body.deal.approvalStatus).toBe('APPROVED');
      expect(res.body.deal.stage).toBe('APPROVED');
      expect(res.body.deal.approvedById).toBe(managerUser.id);
    });
  });

  // =========================================================================
  // 4. COMPLAINTS & SUPPORT TICKETS TESTS
  // =========================================================================
  describe('5. Complaints / Support Tickets with SLA', () => {
    let createdTicketId;

    it('Happy path: Creates a support ticket with priority and auto-calculated SLA due date', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          title: 'ATM Card Trapped - Urgent Replacement',
          description: 'Customer card swallowed at Nariman Point ATM. Urgent reissue required.',
          category: 'CARD_ISSUE',
          priority: 'URGENT',
          customerId: testCustomer1.id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ticket.ticketNumber).toMatch(/^TCK-\d{4}-\d{4}$/);
      expect(res.body.ticket.status).toBe('OPEN');
      expect(res.body.ticket.priority).toBe('URGENT');
      expect(res.body.ticket.dueDate).toBeDefined();
      createdTicketId = res.body.ticket.id;
    });

    it('Status transition: Updates ticket to IN_PROGRESS, then to RESOLVED', async () => {
      const inProgressRes = await request(app)
        .patch(`/tickets/${createdTicketId}/status`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(inProgressRes.statusCode).toBe(200);
      expect(inProgressRes.body.ticket.status).toBe('IN_PROGRESS');

      const resolveRes = await request(app)
        .patch(`/tickets/${createdTicketId}/status`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ status: 'RESOLVED', resolutionNotes: 'New EMV Chip card dispatched via speed post' });

      expect(resolveRes.statusCode).toBe(200);
      expect(resolveRes.body.ticket.status).toBe('RESOLVED');
      expect(resolveRes.body.ticket.resolvedAt).toBeDefined();
    });

    it('Data Isolation: Rep 2 gets 403 trying to view Rep 1 customer ticket', async () => {
      const res = await request(app)
        .get(`/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${rep2Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  // =========================================================================
  // 5. IMMUTABLE AUDIT LOGS TESTS
  // =========================================================================
  describe('6. Immutable Audit Logs & Regulatory Protection', () => {
    it('Audit trail records sensitive operations (KYC, Deals, Tickets)', async () => {
      const res = await request(app)
        .get('/activity-logs?limit=50')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);

      const actions = res.body.logs.map((l) => l.action);
      expect(actions).toEqual(expect.arrayContaining(['KYC_VERIFY', 'DEAL_APPROVE', 'TICKET_CREATE']));
    });

    it('CRUCIAL SPECIFIC TEST 3: Audit logs cannot be edited or deleted (Immutability Guard)', async () => {
      const fakeId = 'any-log-id';

      // PUT attempt
      const putRes = await request(app)
        .put(`/activity-logs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'TAMPERED' });
      expect(putRes.statusCode).toBe(403);
      expect(putRes.body.error).toContain('Immutable Audit Trail');

      // DELETE attempt
      const delRes = await request(app)
        .delete(`/activity-logs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.statusCode).toBe(403);
      expect(delRes.body.error).toContain('Immutable Audit Trail');
    });
  });

  // =========================================================================
  // 6. SECURITY HARDENING TESTS
  // =========================================================================
  describe('8. Security Hardening (Helmet, Rate Limiting & Sensitive Data Masking)', () => {
    it('CRUCIAL SPECIFIC TEST 4: Rate limit works on protected endpoints', async () => {
      // strictTestLimiter allows max 3 requests per 10s
      const req1 = await request(app).get('/auth/test-rate-limit');
      expect(req1.statusCode).toBe(200);

      const req2 = await request(app).get('/auth/test-rate-limit');
      expect(req2.statusCode).toBe(200);

      const req3 = await request(app).get('/auth/test-rate-limit');
      expect(req3.statusCode).toBe(200);

      // 4th request must be blocked by rate limiter with 429 Too Many Requests
      const req4 = await request(app).get('/auth/test-rate-limit');
      expect(req4.statusCode).toBe(429);
      expect(req4.body.error).toContain('Rate limit exceeded');
    });

    it('Sensitive data masking: Aadhaar and PAN numbers are redacted in responses', async () => {
      const { maskDocumentNumber } = require('../controllers/kycController');

      expect(maskDocumentNumber('PAN', 'ABCDE1234F')).toBe('AB****34F');
      expect(maskDocumentNumber('AADHAAR', '123456789012')).toBe('XXXX-XXXX-9012');
    });

    it('Security headers: Helmet security headers are present in responses', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });
});
