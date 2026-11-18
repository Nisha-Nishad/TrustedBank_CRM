const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 6: Notes & Activity Logs', () => {
  let adminToken;
  let rep1Token;
  let rep2Token;

  let rep1NoteId;
  const testCustomerId = 'test-cust-notes-999';

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

    const rep2Res = await request(app).post('/auth/login').send({
      email: 'rep2@trustbank.in',
      password: 'Password@123',
    });
    rep2Token = rep2Res.body.token;
  });

  afterAll(async () => {
    if (rep1NoteId) {
      await prisma.note.deleteMany({ where: { id: rep1NoteId } });
    }
    await prisma.$disconnect();
  });

  describe('Notes CRUD & Polymorphic Relations', () => {
    it('Happy path: Rep 1 creates a note on a customer', async () => {
      const res = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          content: 'Discussed mortgage rate reduction. Customer submitted Form 16.',
          relatedType: 'CUSTOMER',
          relatedId: testCustomerId,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.note.content).toContain('Discussed mortgage rate');
      expect(res.body.note.createdBy.email).toBe('rep1@trustbank.in');
      rep1NoteId = res.body.note.id;
    });

    it('Filter notes by relatedType and relatedId', async () => {
      const res = await request(app)
        .get(`/notes?relatedType=CUSTOMER&relatedId=${testCustomerId}`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.notes[0].relatedId).toBe(testCustomerId);
    });

    it('Validation error: empty content or invalid relatedType returns 400', async () => {
      const res = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          content: '',
          relatedType: 'INVALID_TYPE',
          relatedId: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('Permission guard: Rep 2 cannot delete Rep 1 note', async () => {
      const res = await request(app)
        .delete(`/notes/${rep1NoteId}`)
        .set('Authorization', `Bearer ${rep2Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Activity Logs & Audit Trail', () => {
    it('GET /activity-logs returns recorded system activities', async () => {
      const res = await request(app)
        .get('/activity-logs?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeGreaterThan(0);
      expect(res.body.logs[0]).toHaveProperty('action');
      expect(res.body.logs[0]).toHaveProperty('user');
    });

    it('Unauthorized without token returns 401', async () => {
      const res = await request(app).get('/activity-logs');
      expect(res.statusCode).toBe(401);
    });
  });
});
