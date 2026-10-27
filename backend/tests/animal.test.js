'use strict';

const request = require('supertest');
const { connect, disconnect, clearCollections, getApp } = require('./helpers');

let app;

beforeAll(async () => {
  await connect();
  app = getApp();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnect();
});

describe('Auth - Register', () => {
  test('POST /api/auth/register creates user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'field_worker',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('POST /api/auth/register rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test2@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const payload = { name: 'A', email: 'dup@example.com', password: 'password123' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth - Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  test('POST /api/auth/login succeeds with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('POST /api/auth/login fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me requires JWT', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me returns user with valid token', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    const token = login.body.data.token;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('email', 'login@example.com');
  });
});
