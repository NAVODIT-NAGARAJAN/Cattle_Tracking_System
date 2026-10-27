#!/usr/bin/env node
'use strict';

/**
 * Standalone ML integration test — runs outside Jest.
 * Tests real ONNX inference with onnxruntime-node.
 * Run: npm run test:ml
 *
 * Requirements:
 *  - C:\IOT\ml\models\best.onnx must exist
 *  - tests/fixtures/test_buffalo.jpg must exist (created by create_test_image.js)
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const http = require('http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Server: SocketIOServer } = require('socket.io');
const { createApp } = require('../src/app');
const socketService = require('../src/services/socketService');
const mlService = require('../src/services/mlService');

const ONNX_PATH = process.env.ML_MODEL_PATH || 'C:\\IOT\\ml\\models\\best.onnx';
const TEST_IMAGE_PATH = path.join(__dirname, 'fixtures', 'test_buffalo.jpg');
const BREED_CLASSES = mlService.BREED_CLASSES;

let pass = 0;
let fail = 0;

function ok(name, value, expected) {
  if (value === expected || (expected === undefined && value)) {
    console.log(`  ✓ ${name}`);
    pass++;
  } else {
    console.error(`  ✗ ${name} — got: ${JSON.stringify(value)}, expected: ${JSON.stringify(expected)}`);
    fail++;
  }
}

function inRange(name, value, min, max) {
  if (typeof value === 'number' && value >= min && value <= max) {
    console.log(`  ✓ ${name} (${value})`);
    pass++;
  } else {
    console.error(`  ✗ ${name} — got: ${value}, expected: ${min}–${max}`);
    fail++;
  }
}

async function runTests() {
  console.log('\n══════════════════════════════════════════');
  console.log('  ML Integration Test (Node.js, no Jest)');
  console.log('══════════════════════════════════════════\n');

  // ── 1. File existence ──────────────────────────────────────────────────────
  console.log('[ 1 ] File Checks');
  ok('best.onnx exists', fs.existsSync(ONNX_PATH), true);
  ok('test image exists', fs.existsSync(TEST_IMAGE_PATH), true);

  if (!fs.existsSync(ONNX_PATH)) {
    console.error('\nFATAL: best.onnx missing. Run: python ml/export_onnx.py');
    process.exit(1);
  }
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.error('\nFATAL: test image missing. Run: node create_test_image.js');
    process.exit(1);
  }

  // ── 2. Model loading ───────────────────────────────────────────────────────
  console.log('\n[ 2 ] Model Loading');
  try {
    await mlService.loadModel();
    ok('loadModel() resolves', true, true);
    ok('getModelStatus() returns "loaded"', mlService.getModelStatus(), 'loaded');
  } catch (err) {
    console.error('  ✗ loadModel() threw:', err.message);
    fail++;
    process.exit(1);
  }

  ok('BREED_CLASSES count', BREED_CLASSES.length, 9);

  // ── 3. Direct ONNX inference ───────────────────────────────────────────────
  console.log('\n[ 3 ] Direct ONNX Inference (mlService.predict)');
  let prediction;
  try {
    prediction = await mlService.predict(TEST_IMAGE_PATH);
    ok('predict() returns breed', typeof prediction.breed, 'string');
    ok('breed is in BREED_CLASSES', BREED_CLASSES.includes(prediction.breed), true);
    inRange('confidence is 0–100', prediction.confidence, 0, 100);
    ok('topPredictions is array', Array.isArray(prediction.topPredictions), true);
    ok('topPredictions has 3 entries', prediction.topPredictions.length, 3);
    console.log(`     → Breed: ${prediction.breed}  Confidence: ${prediction.confidence}%`);
    console.log(`     → Top 3: ${prediction.topPredictions.map(p => `${p.breed}(${p.confidence}%)`).join(', ')}`);
  } catch (err) {
    console.error('  ✗ predict() threw:', err.message);
    fail++;
  }

  // ── 4. Full API integration via real HTTP server ───────────────────────────
  console.log('\n[ 4 ] Full HTTP API Integration');

  let mongod, server;
  try {
    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET = 'test-secret-ml-integration';
    process.env.NODE_ENV = 'test';
    process.env.UPLOAD_DIR = 'uploads/detections';
    await mongoose.connect(mongod.getUri());

    // Ensure upload dir exists
    if (!fs.existsSync('uploads/detections')) fs.mkdirSync('uploads/detections', { recursive: true });

    // Boot HTTP server + Socket.IO
    const app = createApp();
    server = http.createServer(app);
    const io = new SocketIOServer(server, { cors: { origin: '*' } });
    socketService.init(io);
    await new Promise((resolve) => server.listen(0, resolve));
    const addr = server.address();
    const BASE = `http://127.0.0.1:${addr.port}`;

    // Helper: simple HTTP request using built-in http module
    const fetch = (method, urlPath, body, headers = {}) =>
      new Promise((resolve, reject) => {
        const parsed = new URL(`${BASE}${urlPath}`);
        const data = body ? JSON.stringify(body) : undefined;
        const req = http.request({
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          },
        }, (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
            catch (_) { resolve({ status: res.statusCode, body: raw }); }
          });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
      });

    // 4a. Health check
    const health = await fetch('GET', '/api/health');
    ok('GET /api/health → 200', health.status, 200);
    ok('health.database connected', health.body.database, 'connected');
    ok('health.mlModel loaded', health.body.mlModel, 'loaded');

    // 4b. Register user
    const reg = await fetch('POST', '/api/auth/register', {
      name: 'ML Tester', email: 'ml@integration.test', password: 'password123',
    });
    ok('POST /api/auth/register → 201', reg.status, 201);
    const jwtToken = reg.body.data && reg.body.data.token;
    ok('JWT token received', typeof jwtToken, 'string');

    // 4c. Create animal
    const animalRes = await fetch('POST', '/api/animals',
      { rfidUid: '21:39:05:6E' },
      { Authorization: `Bearer ${jwtToken}` }
    );
    ok('POST /api/animals → 201', animalRes.status, 201);
    ok('animalId generated', animalRes.body.data && animalRes.body.data.animal.animalId, 'BUF-21:39:05:6E');

    // 4d. POST /api/detections/predict using multipart form (via Node.js)
    console.log('\n[ 4d ] POST /api/detections/predict (multipart upload)');
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const boundary = `----FormBoundary${Date.now()}`;

    const multipart = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="rfidUid"\r\n\r\n21:39:05:6E\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="animalId"\r\n\r\nBUF-21:39:05:6E\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const predictResult = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: addr.port,
        path: '/api/detections/predict',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': multipart.length,
        },
      }, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch (_) { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.on('error', reject);
      req.write(multipart);
      req.end();
    });

    ok('POST /api/detections/predict → 200', predictResult.status, 200);
    if (predictResult.status === 200 && predictResult.body.data) {
      const pd = predictResult.body.data;
      ok('predict returns breed', typeof pd.breed, 'string');
      ok('breed is valid', BREED_CLASSES.includes(pd.breed), true);
      inRange('confidence 0–100', pd.confidence, 0, 100);
      ok('topPredictions present', Array.isArray(pd.topPredictions), true);
      ok('detection saved', pd.detection && pd.detection._id ? true : false, true);
      console.log(`     → Breed: ${pd.breed}  Confidence: ${pd.confidence}%`);

      // 4e. Check detection saved in MongoDB
      const dets = await fetch('GET', '/api/detections');
      ok('GET /api/detections → 200', dets.status, 200);
      ok('detection in DB', dets.body.data.detections.length > 0, true);

      // 4f. Check animal breed updated
      const animalCheck = await fetch('GET', '/api/animals/BUF-21:39:05:6E');
      ok('GET /api/animals/:animalId → 200', animalCheck.status, 200);
      ok('animal.breed updated', animalCheck.body.data.animal.breed !== null, true);
      ok('animal.breedConfidence updated', animalCheck.body.data.animal.breedConfidence !== null, true);
      console.log(`     → Animal updated: breed=${animalCheck.body.data.animal.breed}`);
    } else {
      console.error('  ✗ Predict failed:', JSON.stringify(predictResult.body).slice(0, 200));
      fail += 6;
    }

    // 4g. Dashboard summary
    const dash = await fetch('GET', '/api/dashboard/summary');
    ok('GET /api/dashboard/summary → 200', dash.status, 200);
    ok('summary has totalAnimals', typeof dash.body.data.totalAnimals, 'number');

    // 4h. Socket.IO event (just verify emit doesn't crash)
    ok('socketService.emitTrackingUpdated callable', typeof socketService.emitTrackingUpdated, 'function');

  } catch (err) {
    console.error('  ✗ API integration error:', err.message);
    fail++;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    if (mongod) await mongod.stop();
  }

  // ── Final Summary ──────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`  Results: ${pass} passed, ${fail} failed`);
  console.log('══════════════════════════════════════════\n');

  process.exit(fail > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
