'use strict';

const request = require('supertest');
const { connect, disconnect, getApp } = require('./helpers');

let app;

beforeAll(async () => {
  await connect();
  app = getApp();
});

afterAll(async () => {
  await disconnect();
});

describe('Health Check', () => {
  test('GET /api/health returns success with database and mlModel fields', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Backend is running');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('mlModel');
    expect(res.body).toHaveProperty('timestamp');
    // DB should be connected (memory server)
    expect(res.body.database).toBe('connected');
  });

  test('GET /api/health returns JSON', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('GET /unknown-route returns 404 with success:false', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
