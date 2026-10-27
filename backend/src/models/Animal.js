'use strict';

const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema(
  {
    animalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rfidUid: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    breed: {
      type: String,
      default: null,
      index: true,
    },
    breedConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    sex: {
      type: String,
      enum: ['male', 'female', 'unknown'],
      default: 'unknown',
    },
    age: {
      type: Number,
      min: 0,
      default: null,
    },
    ownerName: {
      type: String,
      trim: true,
      default: null,
    },
    village: {
      type: String,
      trim: true,
      default: null,
    },
    district: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: null,
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
    lastGpsUpdate: {
      type: Date,
      default: null,
    },
    latestImage: {
      type: String,
      default: null,
    },
    latestDetectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Detection',
      default: null,
    },
    lastDetectionTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Animal', animalSchema);
