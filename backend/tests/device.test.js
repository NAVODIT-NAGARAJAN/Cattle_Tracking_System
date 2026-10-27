'use strict';

/**
 * Device-specific tests (also covered in tracking.test.js, but here as standalone).
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

describe('Device Management', () => {
  test('POST /api/devices/register upserts device on repeat call', async () => {
    await request(app).post('/api/devices/register').send({ deviceId: 'ESP32-UPSERT', firmwareVersion: '1.0' });
    const res = await request(app).post('/api/devices/register').send({ deviceId: 'ESP32-UPSERT', firmwareVersion: '1.1' });
    expect(res.status).toBe(200);
    expect(res.body.data.device.firmwareVersion).toBe('1.1');
  });

  test('POST /api/devices/register rejects missing deviceId', async () => {
    const res = await request(app).post('/api/devices/register').send({ firmwareVersion: '1.0' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/devices/heartbeat returns 404 for unknown device', async () => {
    const res = await request(app).post('/api/devices/heartbeat').send({ deviceId: 'UNKNOWN-DEVICE-XYZ' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/devices/:deviceId returns 404 for unknown', async () => {
    const res = await request(app).get('/api/devices/UNKNOWN-XYZ');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
