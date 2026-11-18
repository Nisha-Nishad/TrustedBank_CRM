const request = require('supertest');
const app = require('../app');
const prisma = require('../config/db');

describe('Module 5: Tasks & Reminders Management', () => {
  let adminToken;
  let managerToken;
  let rep1Token;
  let rep2Token;

  let rep1TaskId;
  let rep2TaskId;

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
    if (rep1TaskId) {
      await prisma.task.deleteMany({ where: { id: rep1TaskId } });
    }
    if (rep2TaskId) {
      await prisma.task.deleteMany({ where: { id: rep2TaskId } });
    }
    await prisma.$disconnect();
  });

  describe('Task Creation & Validation', () => {
    it('Happy path: Rep 1 creates a Task due today', async () => {
      const todayDue = new Date();
      todayDue.setHours(todayDue.getHours() + 2);

      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          title: 'Follow-up call on Sanction Letter terms',
          type: 'CALL',
          dueDate: todayDue.toISOString(),
          relatedType: 'CUSTOMER',
          relatedId: 'dummy-customer-id-1',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.task.title).toBe('Follow-up call on Sanction Letter terms');
      expect(res.body.task.status).toBe('PENDING');
      expect(res.body.task.assignedTo.email).toBe('rep1@trustbank.in');
      rep1TaskId = res.body.task.id;
    });

    it('Happy path: Rep 2 creates an upcoming Task due next week', async () => {
      const futureDue = new Date();
      futureDue.setDate(futureDue.getDate() + 7);

      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${rep2Token}`)
        .send({
          title: 'Quarterly review meeting with commercial client',
          type: 'MEETING',
          dueDate: futureDue.toISOString(),
          relatedType: 'DEAL',
          relatedId: 'dummy-deal-id-2',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.task.assignedTo.email).toBe('rep2@trustbank.in');
      rep2TaskId = res.body.task.id;
    });

    it('Validation error: missing relatedId or invalid type returns 400', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${rep1Token}`)
        .send({
          title: 'Bad Task',
          type: 'FLY_A_KITE',
          dueDate: 'not-a-date',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('Due Date Filtering Tabs (Today, Upcoming, Completed)', () => {
    it('tab=today returns pending tasks due today', async () => {
      const res = await request(app)
        .get('/tasks?tab=today')
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      const ids = res.body.tasks.map((t) => t.id);
      expect(ids).toContain(rep1TaskId);
      expect(ids).not.toContain(rep2TaskId); // Rep 2 task is next week
    });

    it('tab=upcoming returns future pending tasks', async () => {
      const res = await request(app)
        .get('/tasks?tab=upcoming')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      const ids = res.body.tasks.map((t) => t.id);
      expect(ids).toContain(rep2TaskId);
    });
  });

  describe('Mark Task Complete (Toggle)', () => {
    it('PATCH /tasks/:id/complete marks task as COMPLETED', async () => {
      const res = await request(app)
        .patch(`/tasks/${rep1TaskId}/complete`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.task.status).toBe('COMPLETED');

      // Now query tab=completed
      const completedList = await request(app)
        .get('/tasks?tab=completed')
        .set('Authorization', `Bearer ${rep1Token}`);

      const ids = completedList.body.tasks.map((t) => t.id);
      expect(ids).toContain(rep1TaskId);
    });

    it('PATCH /tasks/:id/complete toggles back to PENDING', async () => {
      const res = await request(app)
        .patch(`/tasks/${rep1TaskId}/complete`)
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.task.status).toBe('PENDING');
    });
  });

  describe('Data Access Rules for Tasks', () => {
    it('Data Isolation: Rep 1 cannot view Rep 2 task in list', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${rep1Token}`);

      expect(res.statusCode).toBe(200);
      const ids = res.body.tasks.map((t) => t.id);
      expect(ids).toContain(rep1TaskId);
      expect(ids).not.toContain(rep2TaskId);
    });

    it('Data Isolation: Rep 2 receives 403 attempting to complete Rep 1 task', async () => {
      const res = await request(app)
        .patch(`/tasks/${rep1TaskId}/complete`)
        .set('Authorization', `Bearer ${rep2Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('Data Access: Manager sees both tasks', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      const ids = res.body.tasks.map((t) => t.id);
      expect(ids).toContain(rep1TaskId);
      expect(ids).toContain(rep2TaskId);
    });
  });
});
