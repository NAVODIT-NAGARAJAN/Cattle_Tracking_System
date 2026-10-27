'use strict';

const mongoose = require('mongoose');

const topPredictionSchema = new mongoose.Schema(
  {
    breed: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    animalId: {
      type: String,
      default: null,
      index: true,
    },
    rfidUid: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
      index: true,
    },
    breed: {
      type: String,
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePath: {
      type: String,
      default: null,
    },
    modelName: {
      type: String,
      default: 'YOLO11-cls',
    },
    inferenceSource: {
      type: String,
      enum: ['onnx', 'manual'],
      default: 'onnx',
    },
    topPredictions: {
      type: [topPredictionSchema],
      default: [],
    },
    processingTimeMs: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Detection', detectionSchema);
