const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 3: Leads Management & Lead Conversion', () => {
  let adminToken;
  let managerToken;
  let rep1Token;
  let rep2Token;

  let rep1LeadId;
  let rep2LeadId;
  let convertedCustomerId;

  beforeAll(async () => {
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

    const rep1Res = await request(app).post('/auth/login').send({
      email: 'rep1@trustbank.in',
      password: 'Password@123',
    });
    rep1Token = rep1Res.body.token;

    const rep2Res = await request(app).post('/auth/login').send({
      email: 'rep2@trustbank.in',
      password: 'Password@123',
    });
    rep2Token = rep2Res.body.token;
  });

  afterAll(async () => {
    if (rep1LeadId) {
      await prisma.lead.deleteMany({ where: { id: rep1LeadId } });
    }
    if (rep2LeadId) {
      await prisma.lead.deleteMany({ where: { id: rep2LeadId } });
    }
    if (convertedCustomerId) {
      await prisma.customer.deleteMany({ where: { id: convertedCustomerId } });
    }
    await prisma.$disconnect();
  });

  describe('Lead Creation & Validation', () => {
    it('Happy path: Rep 1 creates a new lead', async () => {
      const res = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          name: 'Anil Kumble',
          phone: '+91 98450 12345',
          email: 'anil.k@cricket.in',
          source: 'BRANCH',
          productInterest: 'Commercial Vehicle Loan (₹30 Lakh)',
          status: 'NEW',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.lead.name).toBe('Anil Kumble');
      expect(res.body.lead.assignedTo.email).toBe('rep1@trustbank.in');
      rep1LeadId = res.body.lead.id;
    });

    it('Happy path: Rep 2 creates a new lead', async () => {
      const res = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({
          name: 'VVS Laxman',
          phone: '+91 94400 98765',
          email: 'vvs.l@hyderabad.in',
          source: 'WEBSITE',
          productInterest: 'Fixed Deposit High Yield',
          status: 'NEW',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.lead.name).toBe('VVS Laxman');
      expect(res.body.lead.assignedTo.email).toBe('rep2@trustbank.in');
      rep2LeadId = res.body.lead.id;
    });

    it('Validation error: missing productInterest or invalid email returns 400', async () => {
      const res = await request(app)
        .post('/leads')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          name: 'Invalid Lead',
          phone: '123',
          email: 'bad-email',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toHaveProperty('email');
      expect(res.body.details).toHaveProperty('productInterest');
    });
  });

  describe('Data Access Isolation Rules for Leads', () => {
    it('Data Isolation: Rep 1 cannot view Rep 2 lead in list', async () => {
      const res = await request(app)
        .get('/leads')
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      const leadIds = res.body.leads.map((l) => l.id);
      expect(leadIds).toContain(rep1LeadId);
      expect(leadIds).not.toContain(rep2LeadId);
    });

    it('Data Isolation: Rep 2 receives 403 Forbidden attempting to view Rep 1 lead by ID', async () => {
      const res = await request(app)
        .get(`/leads/${rep1LeadId}`)
        .set('Authorization', `Bearer ${rep2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('Data Access: Manager sees both Rep 1 and Rep 2 leads', async () => {
      const res = await request(app)
        .get('/leads')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      const leadIds = res.body.leads.map((l) => l.id);
      expect(leadIds).toContain(rep1LeadId);
      expect(leadIds).toContain(rep2LeadId);
    });
  });

  describe('Specific Requirement: Convert Lead to Customer', () => {
    it('Happy path: Lead conversion creates customer, links ID, sets status to CONVERTED and writes activity log', async () => {
      const res = await request(app)
        .post(`/leads/${rep1LeadId}/convert`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('successfully converted');
      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.name).toBe('Anil Kumble');
      expect(res.body.customer.email).toBe('anil.k@cricket.in');

      convertedCustomerId = res.body.customer.id;

      expect(res.body.lead.status).toBe('CONVERTED');
      expect(res.body.lead.customerId).toBe(convertedCustomerId);

      // Verify customer exists in database
      const customerInDb = await prisma.customer.findUnique({
        where: { id: convertedCustomerId },
      });
      expect(customerInDb).not.toBeNull();

      // Verify activity log was recorded
      const activityLog = await prisma.activityLog.findFirst({
        where: {
          action: 'CONVERT',
          entityType: 'LEAD',
          entityId: rep1LeadId,
        },
      });
      expect(activityLog).not.toBeNull();
      expect(activityLog.details).toContain('Converted lead');
    });

    it('Cannot convert already converted lead (returns 400)', async () => {
      const res = await request(app)
        .post(`/leads/${rep1LeadId}/convert`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('already converted');
    });
  });

  describe('Update & Delete Lead', () => {
    it('Rep 2 gets 403 Forbidden trying to update Rep 1 lead', async () => {
      const res = await request(app)
        .put(`/leads/${rep1LeadId}`)
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({ status: 'QUALIFIED' });

      expect(res.statusCode).toBe(403);
    });

    it('Manager can reassign lead', async () => {
      const meRes = await request(app).get('/auth/me').set('Authorization', `Bearer ${rep1Token}`);
      const rep1Id = meRes.body.user.id;

      const res = await request(app)
        .put(`/leads/${rep2LeadId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assignedToId: rep1Id });

      expect(res.statusCode).toBe(200);
      expect(res.body.lead.assignedToId).toBe(rep1Id);
    });

    it('Not found: returns 404 for non-existent lead', async () => {
      const res = await request(app)
        .get('/leads/non-existent-lead-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
