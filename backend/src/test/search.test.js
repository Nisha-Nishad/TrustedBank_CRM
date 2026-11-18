const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');
const { generateToken } = require('../middleware/auth');

describe('Global Search API', () => {
  let adminToken;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    adminToken = generateToken(admin);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('searches across customers, leads, and deals by query', async () => {
    const res = await request(app)
      .get('/search?q=Rohit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('customers');
    expect(res.body).toHaveProperty('leads');
    expect(res.body).toHaveProperty('deals');
    expect(res.body.customers.length).toBeGreaterThan(0);
    expect(res.body.customers[0].name).toContain('Rohit');
  });

  it('searches by phone number prefix', async () => {
    const res = await request(app)
      .get('/search?q=98201')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.customers.length).toBeGreaterThan(0);
  });

  it('returns empty results if query is less than 2 characters', async () => {
    const res = await request(app)
      .get('/search?q=a')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.customers).toEqual([]);
    expect(res.body.leads).toEqual([]);
    expect(res.body.deals).toEqual([]);
  });
});
