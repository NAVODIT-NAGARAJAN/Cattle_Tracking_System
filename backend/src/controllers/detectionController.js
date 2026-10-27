'use strict';

const path = require('path');
const fs = require('fs');
const Detection = require('../models/Detection');
const Animal = require('../models/Animal');
const mlService = require('../services/mlService');
const socketService = require('../services/socketService');
const { normalizeRfid } = require('../utils/animalId');

/**
 * POST /api/detections/predict
 * Multipart: image, rfidUid (optional), animalId (optional)
 */
const predict = async (req, res, next) => {
  const startTime = Date.now();
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required', error: 'MISSING_IMAGE' });
    }

    filePath = req.file.path;
    const rfidUid = req.body.rfidUid ? normalizeRfid(req.body.rfidUid) : null;
    const animalId = req.body.animalId || (rfidUid ? `BUF-${rfidUid}` : null);

    // Run real ONNX inference
    const { breed, confidence, topPredictions } = await mlService.predict(filePath);
    const processingTimeMs = Date.now() - startTime;

    // Build image URL
    const relativePath = req.file.filename;
    const imageUrl = `/uploads/detections/${relativePath}`;

    // Save detection
    const detection = await Detection.create({
      animalId,
      rfidUid,
      breed,
      confidence,
      imageUrl,
      imagePath: filePath,
      modelName: 'YOLO11-cls',
      inferenceSource: 'onnx',
      topPredictions,
      processingTimeMs,
      timestamp: new Date(),
    });

    // Update animal if found
    if (animalId) {
      await Animal.findOneAndUpdate(
        { animalId },
        {
          breed,
          breedConfidence: confidence,
          latestImage: imageUrl,
          latestDetectionId: detection._id,
          lastDetectionTime: new Date(),
        }
      );
    }

    // Emit Socket.IO event
    socketService.emitDetectionCreated(detection);

    res.status(200).json({
      success: true,
      message: 'Breed prediction successful',
      data: {
        breed,
        confidence,
        topPredictions,
        processingTimeMs,
        detection,
        imageUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/detections/predict-esp32
 * Accepts raw image buffer for ESP32 camera uploads.
 */
const predictEsp32Raw = async (req, res, next) => {
  const startTime = Date.now();
  let tempPath = null;
  try {
    const rfidUid = req.headers['x-rfid-uid'] || '21:39:05:6E';
    const animalId = req.headers['x-animal-id'] || `BUF-${rfidUid}`;

    if (!req.body || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ success: false, message: 'Image buffer is required', error: 'MISSING_IMAGE' });
    }

    const buffer = req.body;
    if (buffer.length < 1024 || buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
      return res.status(400).json({ success: false, message: 'Invalid JPEG buffer', error: 'INVALID_IMAGE' });
    }

    const animal = await Animal.findOne({ rfidUid });
    if (animal && animal.lastDetectionTime && (Date.now() - new Date(animal.lastDetectionTime).getTime() < 3000)) {
        console.log(`[ESP32 Upload] Skipped duplicate prediction for ${rfidUid}`);
        return res.status(200).json({ success: true, message: 'Skipped duplicate' });
    }

    const uploadDir = process.env.UPLOAD_DIR || 'uploads/detections';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const ext = '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    tempPath = filePath + '.tmp';
    
    fs.writeFileSync(tempPath, buffer);

    const mlResult = await mlService.predict(tempPath);
    fs.renameSync(tempPath, filePath);
    tempPath = null;
    
    const processingTimeMs = Date.now() - startTime;
    const imageUrl = `/uploads/detections/${filename}`;
    
    const detection = await Detection.create({
      animalId: animal ? animal.animalId : animalId,
      rfidUid,
      breed: mlResult.breed,
      confidence: mlResult.confidence,
      imageUrl,
      imagePath: filePath,
      modelName: 'YOLO11-cls',
      inferenceSource: 'onnx',
      topPredictions: mlResult.topPredictions,
      processingTimeMs,
      timestamp: new Date(),
    });

    if (animal) {
      const maleBreeds = ['Banni', 'Bargur', 'Bhadawari', 'Jaffrabadi', 'Mehsana'];
      const femaleBreeds = ['Murrah', 'Nagpuri', 'Nili_Ravi', 'Toda'];
      let predictedSex = animal.sex;
      if (maleBreeds.includes(mlResult.breed)) predictedSex = 'male';
      else if (femaleBreeds.includes(mlResult.breed)) predictedSex = 'female';

      await Animal.findOneAndUpdate(
        { _id: animal._id },
        {
          breed: mlResult.breed,
          breedConfidence: mlResult.confidence,
          sex: predictedSex,
          latestImage: imageUrl,
          latestDetectionId: detection._id,
          lastDetectionTime: new Date(),
        }
      );
    }

    socketService.emitDetectionCreated(detection);
    console.log(`[ESP32 Upload] Success for ${rfidUid} - ${mlResult.breed}`);

    res.status(200).json({
      success: true,
      message: 'Breed prediction successful',
      data: { breed: mlResult.breed, confidence: mlResult.confidence, imageUrl },
    });
  } catch (err) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error(`[ESP32 Upload] Error:`, err.message);
    next(err);
  }
};

/**
 * POST /api/detections
 * Create detection manually (without ML inference)
 */
const createDetection = async (req, res, next) => {
  try {
    const { animalId, rfidUid, breed, confidence, imageUrl, topPredictions } = req.body;

    if (!breed) {
      return res.status(400).json({ success: false, message: 'breed is required', error: 'VALIDATION_ERROR' });
    }
    if (confidence === undefined || confidence === null || confidence < 0 || confidence > 100) {
      return res.status(400).json({ success: false, message: 'Confidence must be 0-100', error: 'VALIDATION_ERROR' });
    }

    const detection = await Detection.create({
      animalId: animalId || null,
      rfidUid: rfidUid ? normalizeRfid(rfidUid) : null,
      breed,
      confidence,
      imageUrl: imageUrl || null,
      topPredictions: topPredictions || [],
      inferenceSource: 'manual',
      timestamp: new Date(),
    });

    socketService.emitDetectionCreated(detection);

    res.status(201).json({ success: true, message: 'Detection created', data: { detection } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/detections
 */
const getDetections = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, animalId, breed } = req.query;
    const filter = {};
    if (animalId) filter.animalId = animalId;
    if (breed) filter.breed = breed;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [detections, total] = await Promise.all([
      Detection.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      Detection.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Detections retrieved',
      data: { detections, pagination: { page: parseInt(page), limit: parseInt(limit), total } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/detections/latest
 */
const getLatestDetections = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const detections = await Detection.find().sort({ timestamp: -1 }).limit(parseInt(limit));
    res.status(200).json({ success: true, message: 'Latest detections retrieved', data: { detections } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/detections/:id
 */
const getDetectionById = async (req, res, next) => {
  try {
    const detection = await Detection.findById(req.params.id);
    if (!detection) {
      return res.status(404).json({ success: false, message: 'Detection not found', error: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Detection retrieved', data: { detection } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/detections/animal/:animalId
 */
const getDetectionsByAnimal = async (req, res, next) => {
  try {
    const detections = await Detection.find({ animalId: req.params.animalId }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, message: 'Animal detections retrieved', data: { detections } });
  } catch (err) {
    next(err);
  }
};

module.exports = { predict, predictEsp32Raw, createDetection, getDetections, getLatestDetections, getDetectionById, getDetectionsByAnimal };
