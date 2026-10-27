'use strict';

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ['esp32', 'raspberry_pi', 'other'],
      default: 'esp32',
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    firmwareVersion: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
