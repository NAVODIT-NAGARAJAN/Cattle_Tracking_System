'use strict';

/**
 * Animal CRUD + RFID lookup tests.
 * Requires auth token for write operations.
 */
const request = require('supertest');
const { connect, disconnect, clearCollections, getApp } = require('./helpers');

let app;
let token;

const registerAndLogin = async (appInstance) => {
  await request(appInstance).post('/api/auth/register').send({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });
  const res = await request(appInstance).post('/api/auth/login').send({
    email: 'admin@test.com',
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
  // Re-create auth user after clear
  token = await registerAndLogin(app);
});

afterAll(async () => {
  await disconnect();
});

describe('Animal CRUD', () => {
  test('POST /api/animals creates animal with correct animalId', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: '21:39:05:6E', ownerName: 'Ravi', district: 'Nagpur' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.animal.animalId).toBe('BUF-21:39:05:6E');
    expect(res.body.data.animal.rfidUid).toBe('21:39:05:6E');
  });

  test('POST /api/animals normalizes RFID to uppercase', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'aa:bb:cc:dd' });

    expect(res.status).toBe(201);
    expect(res.body.data.animal.rfidUid).toBe('AA:BB:CC:DD');
    expect(res.body.data.animal.animalId).toBe('BUF-AA:BB:CC:DD');
  });

  test('POST /api/animals rejects empty RFID', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/animals rejects missing RFID', async () => {
    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ ownerName: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/animals returns list', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'AA:11:22:33' });

    const res = await request(app).get('/api/animals');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.animals)).toBe(true);
    expect(res.body.data.animals.length).toBeGreaterThan(0);
  });

  test('GET /api/animals/:animalId finds animal', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'BB:22:33:44' });

    const res = await request(app).get('/api/animals/BUF-BB:22:33:44');
    expect(res.status).toBe(200);
    expect(res.body.data.animal.animalId).toBe('BUF-BB:22:33:44');
  });

  test('GET /api/animals/rfid/:rfidUid finds animal by RFID', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'CC:33:44:55' });

    const res = await request(app).get('/api/animals/rfid/CC:33:44:55');
    expect(res.status).toBe(200);
    expect(res.body.data.animal.rfidUid).toBe('CC:33:44:55');
  });

  test('PUT /api/animals/:animalId updates fields', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'DD:44:55:66', ownerName: 'Old' });

    const res = await request(app)
      .put('/api/animals/BUF-DD:44:55:66')
      .set('Authorization', `Bearer ${token}`)
      .send({ ownerName: 'New Owner', district: 'Mumbai' });

    expect(res.status).toBe(200);
    expect(res.body.data.animal.ownerName).toBe('New Owner');
    expect(res.body.data.animal.district).toBe('Mumbai');
  });

  test('PUT /api/animals/:animalId rejects invalid latitude', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'EE:55:66:77' });

    const res = await request(app)
      .put('/api/animals/BUF-EE:55:66:77')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 999 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/animals/:animalId rejects invalid longitude', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'FF:66:77:88' });

    const res = await request(app)
      .put('/api/animals/BUF-FF:66:77:88')
      .set('Authorization', `Bearer ${token}`)
      .send({ longitude: -999 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('PATCH /api/animals/:animalId/status updates status', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: '11:22:33:44' });

    const res = await request(app)
      .patch('/api/animals/BUF-11:22:33:44/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'online' });

    expect(res.status).toBe(200);
    expect(res.body.data.animal.status).toBe('online');
  });

  test('DELETE /api/animals/:animalId deletes animal', async () => {
    await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: '99:88:77:66' });

    const del = await request(app)
      .delete('/api/animals/BUF-99:88:77:66')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const find = await request(app).get('/api/animals/BUF-99:88:77:66');
    expect(find.status).toBe(404);
  });

  test('GET /api/animals/:animalId returns 404 for unknown animal', async () => {
    const res = await request(app).get('/api/animals/BUF-UNKNOWN');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
