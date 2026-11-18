const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 7: Dashboard Summary API', () => {
  let adminToken;
  let rep1Token;

  beforeAll(async () => {
    const adminRes = await request(app).post('/auth/login').send({
      email: 'admin@trustbank.in',
      password: 'Password@123',
    });
    adminToken = adminRes.body.token;

    const rep1Res = await request(app).post('/auth/login').send({
      email: 'rep1@trustbank.in',
      password: 'Password@123',
    });
    rep1Token = rep1Res.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Happy path: Manager/Admin receives complete dashboard summary metrics', async () => {
    const res = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary).toHaveProperty('totalLeads');
    expect(res.body.summary).toHaveProperty('totalCustomers');
    expect(res.body.summary).toHaveProperty('wonDealsValue');
    expect(res.body.summary).toHaveProperty('conversionRate');
    expect(res.body.summary).toHaveProperty('pendingTodayTasksCount');

    expect(res.body.stageBreakdown).toBeDefined();
    expect(res.body.stageBreakdown).toHaveProperty('NEW');
    expect(res.body.stageBreakdown).toHaveProperty('WON');

    expect(Array.isArray(res.body.recentActivities)).toBe(true);
  });

  it('Happy path: Sales Rep receives scoped dashboard metrics', async () => {
    const res = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${rep1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary.conversionRate).toBe('number');
  });

  it('Unauthorized without token returns 401', async () => {
    const res = await request(app).get('/dashboard/summary');
    expect(res.statusCode).toBe(401);
  });
});
