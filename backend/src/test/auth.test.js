const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 1: Authentication & Role-Based Access Control', () => {
  let adminToken;
  let managerToken;
  let repToken;
  let createdUserId;

  beforeAll(async () => {
    // Ensure Nisha's password hash is `#dev@Free` before running auth tests
    const bcrypt = require('bcryptjs');
    const nishaHash = await bcrypt.hash('#dev@Free', 10);
    await prisma.user.updateMany({
      where: { email: 'ernishanishad@gmail.com' },
      data: { passwordHash: nishaHash },
    });

    // Ensure demo users exist
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

    const repRes = await request(app).post('/auth/login').send({
      email: 'rep1@trustbank.in',
      password: 'Password@123',
    });
    repToken = repRes.body.token;
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.activityLog.deleteMany({ where: { entityId: createdUserId } });
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('Happy path: Admin Nisha Nishad logs in with custom credentials', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'ernishanishad@gmail.com',
        password: '#dev@Free',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe('Nisha Nishad');
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.token).toBeDefined();
    });

    it('Happy path: Admin logs in successfully', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'admin@trustbank.in',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.email).toBe('admin@trustbank.in');
    });

    it('Happy path: Manager logs in successfully', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'manager@trustbank.in',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('MANAGER');
    });

    it('Happy path: Sales Rep logs in successfully', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'rep1@trustbank.in',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('SALES_REP');
    });

    it('Validation error: missing email & password returns 400', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toHaveProperty('email');
    });

    it('Unauthorized: wrong password returns 401', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'admin@trustbank.in',
        password: 'WrongPassword!',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('Unauthorized: non-existent email returns 401', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'ghost@trustbank.in',
        password: 'Password@123',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /auth/me', () => {
    it('Happy path: Returns authenticated user profile', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.email).toBe('admin@trustbank.in');
    });

    it('Unauthorized: Request without token returns 401', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('Unauthorized: Request with corrupted token returns 401', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('User Management (Admin Role Guard)', () => {
    it('Forbidden: Sales Rep cannot list users (403)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${repToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('Forbidden: Manager cannot list users (403)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('Happy path: Admin can list all users (200)', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(4);
    });

    it('Happy path: Admin can create a new user (201)', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sunil Gavaskar',
          email: 'sunil.g@trustbank.in',
          password: 'Password@123',
          role: 'SALES_REP',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.user.email).toBe('sunil.g@trustbank.in');
      expect(res.body.user.role).toBe('SALES_REP');
      createdUserId = res.body.user.id;
    });

    it('Validation error: invalid role returns 400', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Role Guy',
          email: 'invalid.role@trustbank.in',
          password: 'Password@123',
          role: 'SUPER_HERO',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('Happy path: Admin can disable a user and disabled user cannot login (403)', async () => {
      // Disable the created user
      const updateRes = await request(app)
        .put(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.user.isActive).toBe(false);

      // Attempt login with deactivated user
      const loginRes = await request(app).post('/auth/login').send({
        email: 'sunil.g@trustbank.in',
        password: 'Password@123',
      });
      expect(loginRes.statusCode).toBe(403);
      expect(loginRes.body.error).toContain('deactivated');
    });
  });

  describe('Password Reset Flow (Forgot & Reset Password)', () => {
    let capturedResetToken;

    it('Happy path: POST /auth/forgot-password sends reset instructions to email', async () => {
      const res = await request(app).post('/auth/forgot-password').send({
        email: 'ernishanishad@gmail.com',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('dispatched to your email');
      expect(res.body.token).toBeDefined();
      capturedResetToken = res.body.token;
    });

    it('Validation error: invalid email format returns 400', async () => {
      const res = await request(app).post('/auth/forgot-password').send({
        email: 'bad-email-format',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('Happy path: POST /auth/reset-password updates user password with token', async () => {
      const res = await request(app).post('/auth/reset-password').send({
        token: capturedResetToken,
        newPassword: 'BrandNewPassword@2026',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('successfully updated');

      // Verify user can login with new password
      const loginRes = await request(app).post('/auth/login').send({
        email: 'ernishanishad@gmail.com',
        password: 'BrandNewPassword@2026',
      });
      expect(loginRes.statusCode).toBe(200);

      // Restore password back to #dev@Free
      const forgotAgain = await request(app).post('/auth/forgot-password').send({
        email: 'ernishanishad@gmail.com',
      });
      await request(app).post('/auth/reset-password').send({
        token: forgotAgain.body.token,
        newPassword: '#dev@Free',
      });
    });

    it('Security check: invalid or tampered token returns 400', async () => {
      const res = await request(app).post('/auth/reset-password').send({
        token: 'invalid_tampered_token_string',
        newPassword: 'AnotherPassword@123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid or expired');
    });
  });
});
