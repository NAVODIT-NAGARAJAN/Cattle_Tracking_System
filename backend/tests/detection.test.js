'use strict';

/**
 * Socket.IO real-time event tests.
 */
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { io: SocketIOClient } = require('socket.io-client');
const request = require('supertest');
const { connect, disconnect, clearCollections, getApp } = require('./helpers');
const socketService = require('../src/services/socketService');

let app;
let server;
let clientSocket;
let token;
const PORT = 0; // OS assigns a free port

const registerAndLogin = async (appInstance) => {
  await request(appInstance).post('/api/auth/register').send({
    name: 'Admin', email: 'socket@test.com', password: 'password123', role: 'admin',
  }).catch(() => {});
  const res = await request(appInstance).post('/api/auth/login').send({
    email: 'socket@test.com', password: 'password123',
  });
  return res.body.data && res.body.data.token;
};

beforeAll(async () => {
  await connect();
  app = getApp();

  // Boot a real HTTP + Socket.IO server on a random port
  server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  socketService.init(io);

  await new Promise((resolve) => server.listen(PORT, resolve));
  const addr = server.address();

  token = await registerAndLogin(app);

  // Connect client
  clientSocket = SocketIOClient(`http://127.0.0.1:${addr.port}`, {
    transports: ['websocket'],
    reconnection: false,
  });
  await new Promise((resolve, reject) => {
    clientSocket.on('connect', resolve);
    clientSocket.on('connect_error', reject);
    setTimeout(reject, 5000);
  });
});

afterEach(async () => {
  await clearCollections();
  token = await registerAndLogin(app);
});

afterAll(async () => {
  clientSocket.disconnect();
  await new Promise((resolve) => server.close(resolve));
  await disconnect();
});

describe('Socket.IO Events', () => {
  test('tracking:updated is emitted on device-data POST', (done) => {
    clientSocket.once('tracking:updated', (data) => {
      expect(data).toHaveProperty('rfidUid');
      done();
    });

    request(app).post('/api/tracking/device-data').send({
      rfidUid: '21:39:05:6E',
      gpsFix: false,
      satellites: 0,
    }).then(() => {}).catch(done);
  });

  test('animal:updated is emitted on animal creation', (done) => {
    clientSocket.once('animal:updated', (data) => {
      expect(data).toHaveProperty('rfidUid');
      done();
    });

    request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${token}`)
      .send({ rfidUid: 'FF:EE:DD:CC' })
      .then(() => {}).catch(done);
  });

  test('detection:created is emitted on manual detection create', (done) => {
    clientSocket.once('detection:created', (data) => {
      expect(data).toHaveProperty('breed');
      done();
    });

    request(app).post('/api/detections').send({
      breed: 'murrah',
      confidence: 90,
    }).then(() => {}).catch(done);
  });

  test('device:online is emitted on device register', (done) => {
    clientSocket.once('device:online', (data) => {
      expect(data).toHaveProperty('deviceId');
      done();
    });

    request(app).post('/api/devices/register').send({
      deviceId: 'ESP32-SOCKET-TEST',
    }).then(() => {}).catch(done);
  });
});
