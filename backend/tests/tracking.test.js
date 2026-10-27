'use strict';

const request = require('supertest');
const { connect, disconnect, clearCollections, getApp } = require('./helpers');

let app;
let token;

const registerAndLogin = async (appInstance) => {
  await request(appInstance).post('/api/auth/register').send({
    name: 'Admin',
    email: 'track@test.com',
    password: 'password123',
    role: 'admin',
  });
  const res = await request(appInstance).post('/api/auth/login').send({
    email: 'track@test.com',
    password: 'password123',
  });
  return res.body.data.token;
};

beforeAll(async () => {
  await connect();
  app = getApp();
  token = await registerAndLogin(app);
});

afterEach(async () => {
  await clearCollections();
  token = await registerAndLogin(app);
});

afterAll(async () => {
  await disconnect();
});

describe('Tracking - ESP32 Device Data', () => {
  test('POST /api/tracking/device-data accepts gpsFix=false with null coords', async () => {
    const payload = {
      deviceId: 'ESP32-DEVKIT-01',
      rfidUid: '21:39:05:6E',
      animalId: 'BUF-21:39:05:6E',
      latitude: null,
      longitude: null,
      gpsFix: false,
      satellites: 0,
      timestamp: new Date().toISOString(),
    };
    const res = await request(app).post('/api/tracking/device-data').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gpsFix).toBe(false);
  });

  test('POST /api/tracking/device-data accepts valid GPS fix', async () => {
    const payload = {
      deviceId: 'ESP32-DEVKIT-01',
      rfidUid: '21:39:05:6E',
      latitude: 20.5937,
      longitude: 78.9629,
      gpsFix: true,
      satellites: 6,
      timestamp: new Date().toISOString(),
    };
    const res = await request(app).post('/api/tracking/device-data').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gpsFix).toBe(true);
  });

  test('POST /api/tracking/device-data rejects missing RFID', async () => {
    const res = await request(app).post('/api/tracking/device-data').send({
      deviceId: 'ESP32-01',
      gpsFix: false,
      satellites: 0,
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/tracking/device-data rejects gpsFix=true with invalid latitude', async () => {
    const res = await request(app).post('/api/tracking/device-data').send({
      rfidUid: '11:22:33:44',
      latitude: 999,
      longitude: 78.9,
      gpsFix: true,
      satellites: 4,
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/tracking/device-data rejects gpsFix=true with invalid longitude', async () => {
    const res = await request(app).post('/api/tracking/device-data').send({
      rfidUid: '11:22:33:44',
      latitude: 20.0,
      longitude: 999,
      gpsFix: true,
      satellites: 4,
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/tracking/device-data creates tracking record when GPS fix=true', async () => {
    const rfid = 'AA:BB:CC:DD';
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: rfid });

    await request(app).post('/api/tracking/device-data').send({
      rfidUid: rfid,
      latitude: 19.076,
      longitude: 72.877,
      gpsFix: true,
      satellites: 8,
    });

    const res = await request(app).get('/api/tracking/animal/BUF-AA:BB:CC:DD');
    expect(res.status).toBe(200);
    expect(res.body.data.records.length).toBeGreaterThan(0);
    expect(res.body.data.records[0].gpsFix).toBe(true);
  });

  test('GET /api/tracking/latest/:animalId returns latest record', async () => {
    const rfid = 'EE:FF:00:11';
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: rfid });

    await request(app).post('/api/tracking/device-data').send({
      rfidUid: rfid,
      latitude: 18.52,
      longitude: 73.86,
      gpsFix: true,
      satellites: 5,
    });

    const res = await request(app).get('/api/tracking/latest/BUF-EE:FF:00:11');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.record).toHaveProperty('rfidUid', rfid);
  });

  test('GET /api/tracking returns all records with pagination', async () => {
    const res = await request(app).get('/api/tracking');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('records');
    expect(res.body.data).toHaveProperty('pagination');
  });
});

describe('Device Registration & Heartbeat', () => {
  test('POST /api/devices/register registers device', async () => {
    const res = await request(app).post('/api/devices/register').send({
      deviceId: 'ESP32-TEST-01',
      deviceType: 'esp32',
      name: 'Test Device',
      firmwareVersion: '1.0.0',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.device.deviceId).toBe('ESP32-TEST-01');
    expect(res.body.data.device.status).toBe('online');
  });

  test('POST /api/devices/heartbeat updates device lastSeen', async () => {
    await request(app).post('/api/devices/register').send({ deviceId: 'ESP32-HEART-01' });

    const res = await request(app).post('/api/devices/heartbeat').send({
      deviceId: 'ESP32-HEART-01',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.device.status).toBe('online');
    expect(res.body.data.device).toHaveProperty('lastSeen');
  });

  test('POST /api/devices/heartbeat rejects missing deviceId', async () => {
    const res = await request(app).post('/api/devices/heartbeat').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/devices returns device list', async () => {
    await request(app).post('/api/devices/register').send({ deviceId: 'ESP32-LIST-01' });
    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.devices)).toBe(true);
  });

  test('GET /api/devices/:deviceId returns specific device', async () => {
    await request(app).post('/api/devices/register').send({ deviceId: 'ESP32-GET-01' });
    const res = await request(app).get('/api/devices/ESP32-GET-01');
    expect(res.status).toBe(200);
    expect(res.body.data.device.deviceId).toBe('ESP32-GET-01');
  });
});
