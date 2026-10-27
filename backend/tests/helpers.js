'use strict';

/**
 * Shared test helpers: in-memory MongoDB setup/teardown and app factory.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');

let mongod = null;

const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
  process.env.NODE_ENV = 'test';
  process.env.UPLOAD_DIR = 'uploads/detections';
  process.env.ML_MODEL_PATH = 'C:\\IOT\\ml\\models\\best.onnx';
  await mongoose.connect(uri);
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

const getApp = () => createApp();

module.exports = { connect, disconnect, clearCollections, getApp };
