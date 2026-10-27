'use strict';

/**
 * Dashboard API tests.
 */
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

describe('Dashboard APIs', () => {
  test('GET /api/dashboard/summary returns summary fields', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d).toHaveProperty('totalAnimals');
    expect(d).toHaveProperty('onlineAnimals');
    expect(d).toHaveProperty('offlineAnimals');
    expect(d).toHaveProperty('gpsFixedAnimals');
    expect(d).toHaveProperty('totalDetections');
    expect(d).toHaveProperty('todayDetections');
    expect(typeof d.totalAnimals).toBe('number');
  });

  test('GET /api/dashboard/breeds returns distribution array', async () => {
    const res = await request(app).get('/api/dashboard/breeds');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.distribution)).toBe(true);
  });

  test('GET /api/dashboard/recent returns detections array', async () => {
    const res = await request(app).get('/api/dashboard/recent');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.detections)).toBe(true);
  });

  test('GET /api/dashboard/live returns animals array', async () => {
    const res = await request(app).get('/api/dashboard/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.animals)).toBe(true);
  });

  test('Dashboard summary counts are accurate', async () => {
    // Pre-insert animals via API
    const token = await (async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Admin', email: 'dash@test.com', password: 'password123',
      });
      const l = await request(app).post('/api/auth/login').send({ email: 'dash@test.com', password: 'password123' });
      return l.body.data.token;
    })();

    await request(app).post('/api/animals').set('Authorization', `Bearer ${token}`).send({ rfidUid: 'A1:B1:C1:D1' });
    await request(app).post('/api/animals').set('Authorization', `Bearer ${token}`).send({ rfidUid: 'A2:B2:C2:D2' });

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.body.data.totalAnimals).toBe(2);
  });
});
