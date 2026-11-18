const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 4: Deals / Pipeline (Kanban & Stages)', () => {
  let adminToken;
  let managerToken;
  let rep1Token;
  let rep2Token;

  let rep1DealId;
  let rep2DealId;

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
    if (rep1DealId) {
      await prisma.deal.deleteMany({ where: { id: rep1DealId } });
    }
    if (rep2DealId) {
      await prisma.deal.deleteMany({ where: { id: rep2DealId } });
    }
    await prisma.$disconnect();
  });

  describe('Deal Creation & Kanban Grouping', () => {
    it('Happy path: Rep 1 creates a Deal in NEW stage', async () => {
      const res = await request(app)
        .post('/deals')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          title: 'Kapil Dev - Commercial Complex Loan',
          amount: 8500000,
          stage: 'NEW',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.deal.title).toBe('Kapil Dev - Commercial Complex Loan');
      expect(res.body.deal.amount).toBe(8500000);
      expect(res.body.deal.stage).toBe('NEW');
      expect(res.body.deal.owner.email).toBe('rep1@trustbank.in');
      rep1DealId = res.body.deal.id;
    });

    it('Happy path: Rep 2 creates a Deal in CONTACTED stage', async () => {
      const res = await request(app)
        .post('/deals')
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({
          title: 'Sourav Ganguly - Business Overdraft',
          amount: 4000000,
          stage: 'CONTACTED',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.deal.owner.email).toBe('rep2@trustbank.in');
      rep2DealId = res.body.deal.id;
    });

    it('Kanban View: GET /deals?groupBy=stage groups deals into 7 stage columns with counts', async () => {
      const res = await request(app)
        .get('/deals?groupBy=stage')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.grouped).toBeDefined();
      expect(res.body.grouped).toHaveProperty('NEW');
      expect(res.body.grouped).toHaveProperty('CONTACTED');
      expect(res.body.grouped).toHaveProperty('DOCUMENTS');
      expect(res.body.grouped).toHaveProperty('VERIFICATION');
      expect(res.body.grouped).toHaveProperty('APPROVED');
      expect(res.body.grouped).toHaveProperty('WON');
      expect(res.body.grouped).toHaveProperty('LOST');

      expect(res.body.grouped.NEW.deals.some((d) => d.id === rep1DealId)).toBe(true);
      expect(res.body.grouped.CONTACTED.deals.some((d) => d.id === rep2DealId)).toBe(true);
    });
  });

  describe('Specific Requirement: Stage Change & Activity Logging', () => {
    it('Stage change from NEW to DOCUMENTS logs activity and updates stage', async () => {
      const res = await request(app)
        .patch(`/deals/${rep1DealId}/stage`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ stage: 'DOCUMENTS' });

      expect(res.statusCode).toBe(200);
      expect(res.body.deal.stage).toBe('DOCUMENTS');

      // Verify activity log was automatically recorded
      const log = await prisma.activityLog.findFirst({
        where: {
          action: 'STAGE_CHANGE',
          entityType: 'DEAL',
          entityId: rep1DealId,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(log).not.toBeNull();
      expect(log.details).toContain('from NEW to DOCUMENTS');
    });

    it('Stage change to WON sets closedAt timestamp', async () => {
      const res = await request(app)
        .patch(`/deals/${rep1DealId}/stage`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ stage: 'WON' });

      expect(res.statusCode).toBe(200);
      expect(res.body.deal.stage).toBe('WON');
      expect(res.body.deal.closedAt).not.toBeNull();
    });

    it('Validation error: invalid stage returns 400', async () => {
      const res = await request(app)
        .patch(`/deals/${rep1DealId}/stage`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ stage: 'INVALID_STAGE_NAME' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('Data Access Rules for Deals', () => {
    it('Data Isolation: Rep 1 does not see Rep 2 deal in list', async () => {
      const res = await request(app)
        .get('/deals')
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      const dealIds = res.body.deals.map((d) => d.id);
      expect(dealIds).toContain(rep1DealId);
      expect(dealIds).not.toContain(rep2DealId);
    });

    it('Data Isolation: Rep 2 receives 403 attempting to change stage of Rep 1 deal', async () => {
      const res = await request(app)
        .patch(`/deals/${rep1DealId}/stage`)
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({ stage: 'LOST' });

      expect(res.statusCode).toBe(403);
    });

    it('Data Access: Manager can transition any deal', async () => {
      const res = await request(app)
        .patch(`/deals/${rep2DealId}/stage`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ stage: 'VERIFICATION' });

      expect(res.statusCode).toBe(200);
      expect(res.body.deal.stage).toBe('VERIFICATION');
    });
  });
});
