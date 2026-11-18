const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');
const { generateToken } = require('../middleware/auth');

describe('Reports & Settings API', () => {
  let adminToken;
  let repToken;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const rep = await prisma.user.findFirst({ where: { role: 'SALES_REP' } });

    adminToken = generateToken(admin);
    repToken = generateToken(rep);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /reports/summary', () => {
    it('returns summary metrics, RM leaderboard, and product distribution', async () => {
      const res = await request(app)
        .get('/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('rmLeaderboard');
      expect(res.body).toHaveProperty('productsDistribution');
      expect(res.body).toHaveProperty('kycSummary');
      expect(Array.isArray(res.body.rmLeaderboard)).toBe(true);
    });

    it('returns 401 when token is missing', async () => {
      const res = await request(app).get('/reports/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /reports/export', () => {
    it('returns CSV content with proper headers', async () => {
      const res = await request(app)
        .get('/reports/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Deal Title,Customer Name');
    });
  });

  describe('GET & PUT /settings', () => {
    it('retrieves default branch and security settings', async () => {
      const res = await request(app)
        .get('/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.branch.bankName).toBe('TrustBank India Ltd.');
      expect(res.body.security.twoFactorAuth).toBe(true);
    });

    it('allows Admin to update branch settings', async () => {
      const res = await request(app)
        .put('/settings/branch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ region: 'West Zone - Maharashtra Circle' });

      expect(res.status).toBe(200);
      expect(res.body.branch.region).toBe('West Zone - Maharashtra Circle');
    });

    it('denies SALES_REP from updating branch settings', async () => {
      const res = await request(app)
        .put('/settings/branch')
        .set('Authorization', `Bearer ${repToken}`)
        .send({ region: 'Hacked Circle' });

      expect(res.status).toBe(403);
    });
  });
});
