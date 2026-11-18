const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 2: Customers Management & Data Isolation', () => {
  let adminToken;
  let managerToken;
  let rep1Token;
  let rep2Token;

  let rep1CustomerId;
  let rep2CustomerId;

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
    if (rep1CustomerId) {
      await prisma.customer.deleteMany({ where: { id: rep1CustomerId } });
    }
    if (rep2CustomerId) {
      await prisma.customer.deleteMany({ where: { id: rep2CustomerId } });
    }
    await prisma.$disconnect();
  });

  describe('Customer Creation & Validation', () => {
    it('Happy path: Rep 1 creates Customer 1', async () => {
      const res = await request(app)
        .post('/customers')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          name: 'Sunita Narain',
          phone: '+91 98112 34567',
          email: 'sunita.narain@delhi.org',
          city: 'New Delhi',
          type: 'INDIVIDUAL',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.customer.name).toBe('Sunita Narain');
      expect(res.body.customer.createdBy.email).toBe('rep1@trustbank.in');
      rep1CustomerId = res.body.customer.id;
    });

    it('Happy path: Rep 2 creates Customer 2', async () => {
      const res = await request(app)
        .post('/customers')
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({
          name: 'Bengaluru Tech Park Ltd',
          phone: '+91 80223 99881',
          email: 'finance@bengalurutech.com',
          city: 'Bengaluru',
          type: 'BUSINESS',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.customer.name).toBe('Bengaluru Tech Park Ltd');
      expect(res.body.customer.createdBy.email).toBe('rep2@trustbank.in');
      rep2CustomerId = res.body.customer.id;
    });

    it('Validation error: invalid email or short phone returns 400', async () => {
      const res = await request(app)
        .post('/customers')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          name: 'Invalid Customer',
          phone: '123',
          email: 'not-an-email',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toHaveProperty('phone');
      expect(res.body.details).toHaveProperty('email');
    });
  });

  describe('Data Access Isolation Rules (Crucial Rule)', () => {
    it('Data Isolation: Rep 1 can see their own customer, NOT Rep 2 customer', async () => {
      const res = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      const customerIds = res.body.customers.map((c) => c.id);
      expect(customerIds).toContain(rep1CustomerId);
      expect(customerIds).not.toContain(rep2CustomerId);
    });

    it('Data Isolation: Rep 2 receives 403 Forbidden attempting to view Rep 1 customer by ID', async () => {
      const res = await request(app)
        .get(`/customers/${rep1CustomerId}`)
        .set('Authorization', `Bearer ${rep2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('Data Access: Manager can view all customers including both Rep 1 and Rep 2', async () => {
      const res = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      const customerIds = res.body.customers.map((c) => c.id);
      expect(customerIds).toContain(rep1CustomerId);
      expect(customerIds).toContain(rep2CustomerId);
    });

    it('Data Access: Admin can view any customer detail by ID', async () => {
      const res = await request(app)
        .get(`/customers/${rep1CustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.customer.name).toBe('Sunita Narain');
    });
  });

  describe('Search, Filter & Pagination', () => {
    it('Search customer by name', async () => {
      const res = await request(app)
        .get('/customers?search=Sunita')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.customers.length).toBeGreaterThanOrEqual(1);
      expect(res.body.customers[0].name).toContain('Sunita');
    });

    it('Filter customer by type (BUSINESS)', async () => {
      const res = await request(app)
        .get('/customers?type=BUSINESS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      res.body.customers.forEach((c) => {
        expect(c.type).toBe('BUSINESS');
      });
    });

    it('Pagination structure matches schema', async () => {
      const res = await request(app)
        .get('/customers?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.customers.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Update & Delete Restrictions', () => {
    it('Rep 2 gets 403 Forbidden trying to update Rep 1 customer', async () => {
      const res = await request(app)
        .put(`/customers/${rep1CustomerId}`)
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({ city: 'Hacked City' });

      expect(res.statusCode).toBe(403);
    });

    it('Rep 1 can update their own customer', async () => {
      const res = await request(app)
        .put(`/customers/${rep1CustomerId}`)
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({ city: 'South Delhi' });

      expect(res.statusCode).toBe(200);
      expect(res.body.customer.city).toBe('South Delhi');
    });

    it('Not found: returns 404 for non-existent customer', async () => {
      const res = await request(app)
        .get('/customers/non-existent-uuid-1234')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
