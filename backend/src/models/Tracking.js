'use strict';

const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema(
  {
    animalId: {
      type: String,
      required: true,
      index: true,
    },
    rfidUid: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      default: null,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      default: null,
    },
    gpsFix: {
      type: Boolean,
      default: false,
    },
    satellites: {
      type: Number,
      min: 0,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: ['esp32', 'manual', 'api'],
      default: 'esp32',
    },
    deviceId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tracking', trackingSchema);
