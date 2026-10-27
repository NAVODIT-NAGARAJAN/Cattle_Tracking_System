'use strict';

const Animal = require('../models/Animal');
const Tracking = require('../models/Tracking');
const Device = require('../models/Device');
const { normalizeRfid } = require('../utils/animalId');
const { isValidRfid, isValidLatitude, isValidLongitude, isValidSatellites } = require('../utils/validation');
const socketService = require('../services/socketService');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);
const Detection = require('../models/Detection');
const mlService = require('../services/mlService');

const processAutoPrediction = async (animal, normalizedRfid) => {
  try {
    const cooldownMs = 60 * 1000; // 60 seconds cooldown
    if (animal.lastDetectionTime && (Date.now() - new Date(animal.lastDetectionTime).getTime() < cooldownMs)) {
      console.log(`[AutoPredict] Skipped. Cooldown active for ${normalizedRfid}`);
      return;
    }
    
    const baseUrl = process.env.CAMERA_URL || 'http://10.164.164.113/capture';
    const cameraUrl = baseUrl.includes('?') ? `${baseUrl}&source=backend` : `${baseUrl}?source=backend`;
    console.log(`[AutoPredict] Fetching image from ${cameraUrl}`);
    
    const response = await axios({
      method: 'GET',
      url: cameraUrl,
      responseType: 'arraybuffer',
      timeout: 5000, // 5s timeout
    });
    
    if (response.status !== 200) {
      throw new Error(`Camera returned HTTP ${response.status}`);
    }
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('image/')) {
      throw new Error(`Camera returned invalid content-type: ${contentType}`);
    }
    
    const buffer = Buffer.from(response.data);
    if (buffer.length < 1024) {
      throw new Error(`Image too small or corrupt: ${buffer.length} bytes`);
    }
    // Check JPEG magic bytes (FF D8 FF)
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
      throw new Error('Invalid JPEG magic bytes. Camera did not return a valid image.');
    }
    
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/detections';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const ext = '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    const tempPath = filePath + '.tmp';
    
    fs.writeFileSync(tempPath, buffer);
    
    const startTime = Date.now();
    let mlResult;
    try {
      mlResult = await mlService.predict(tempPath);
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error(`[AutoPredict] ML error:`, err.message);
      return;
    }
    
    fs.renameSync(tempPath, filePath);
    
    const processingTimeMs = Date.now() - startTime;
    const imageUrl = `/uploads/detections/${filename}`;
    
    const detection = await Detection.create({
      animalId: animal.animalId,
      rfidUid: normalizedRfid,
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

    const maleBreeds = ['Banni', 'Bargur', 'Bhadawari', 'Jaffrabadi', 'Mehsana'];
    const femaleBreeds = ['Murrah', 'Nagpuri', 'Nili_Ravi', 'Toda'];
    let predictedSex = animal.sex;
    if (maleBreeds.includes(mlResult.breed)) {
      predictedSex = 'male';
    } else if (femaleBreeds.includes(mlResult.breed)) {
      predictedSex = 'female';
    }

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
    
    socketService.emitDetectionCreated(detection);
    console.log(`[AutoPredict] Success for ${normalizedRfid} - ${mlResult.breed}`);
  } catch (err) {
    console.error(`[AutoPredict] Error for ${normalizedRfid}:`, err.message);
  }
};

/**
 * POST /api/tracking/device-data
 * Accepts ESP32 payload.
 */
const receiveDeviceData = async (req, res, next) => {
  try {
    const { deviceId, rfidUid, animalId, latitude, longitude, gpsFix, satellites, timestamp } = req.body;

    if (!isValidRfid(rfidUid)) {
      return res.status(400).json({ success: false, message: 'RFID UID is required', error: 'VALIDATION_ERROR' });
    }

    const normalizedRfid = normalizeRfid(rfidUid);
    const fix = gpsFix === true || gpsFix === 'true';

    // If GPS fix is true, coordinates must be valid
    if (fix) {
      if (latitude === null || latitude === undefined || !isValidLatitude(Number(latitude))) {
        return res.status(400).json({ success: false, message: 'Valid latitude required when gpsFix=true', error: 'VALIDATION_ERROR' });
      }
      if (longitude === null || longitude === undefined || !isValidLongitude(Number(longitude))) {
        return res.status(400).json({ success: false, message: 'Valid longitude required when gpsFix=true', error: 'VALIDATION_ERROR' });
      }
    }

    // Validate satellites if provided
    const satsNum = satellites !== undefined ? parseInt(satellites, 10) : 0;
    if (!isValidSatellites(satsNum)) {
      return res.status(400).json({ success: false, message: 'Satellites must be integer >= 0', error: 'VALIDATION_ERROR' });
    }

    // Find animal by RFID or provided animalId
    const resolvedAnimalId = animalId || `BUF-${normalizedRfid}`;
    const animal = await Animal.findOne({ rfidUid: normalizedRfid });

    // Update device lastSeen
    if (deviceId) {
      await Device.findOneAndUpdate(
        { deviceId },
        { lastSeen: new Date(), status: 'online' },
        { upsert: true, setDefaultsOnInsert: true, new: true }
      );
    }

    // Update animal GPS fields
    const gpsUpdate = {
      gpsFix: fix,
      satellites: satsNum,
      status: 'online',
    };

    if (fix) {
      gpsUpdate.latitude = parseFloat(latitude);
      gpsUpdate.longitude = parseFloat(longitude);
      gpsUpdate.lastGpsUpdate = timestamp ? new Date(timestamp) : new Date();
    }

    if (animal) {
      await Animal.findOneAndUpdate({ rfidUid: normalizedRfid }, gpsUpdate);
      
      // Fire-and-forget auto prediction
      processAutoPrediction(animal, normalizedRfid).catch(console.error);
    }

    // Create tracking history only when GPS fix is valid
    let trackingRecord = null;
    if (fix) {
      trackingRecord = await Tracking.create({
        animalId: animal ? animal.animalId : resolvedAnimalId,
        rfidUid: normalizedRfid,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        gpsFix: true,
        satellites: satsNum,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        source: 'esp32',
        deviceId: deviceId || null,
      });
    }

    // Emit Socket.IO event
    const payload = {
      rfidUid: normalizedRfid,
      animalId: animal ? animal.animalId : resolvedAnimalId,
      latitude: fix ? parseFloat(latitude) : null,
      longitude: fix ? parseFloat(longitude) : null,
      gpsFix: fix,
      satellites: satsNum,
      deviceId: deviceId || null,
      timestamp: timestamp || new Date().toISOString(),
    };
    socketService.emitTrackingUpdated(payload);

    res.status(200).json({
      success: true,
      message: fix ? 'Tracking data received with GPS fix' : 'Tracking data received (no GPS fix)',
      data: { tracking: trackingRecord, rfidUid: normalizedRfid, gpsFix: fix },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tracking/animal/:animalId
 */
const getAnimalHistory = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const records = await Tracking.find({ animalId: req.params.animalId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.status(200).json({ success: true, message: 'Tracking history retrieved', data: { records } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tracking/latest/:animalId
 */
const getLatestTracking = async (req, res, next) => {
  try {
    const record = await Tracking.findOne({ animalId: req.params.animalId }).sort({ timestamp: -1 });
    if (!record) {
      return res.status(404).json({ success: false, message: 'No tracking records found', error: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Latest tracking retrieved', data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tracking
 */
const getAllTracking = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Tracking.find().sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      Tracking.countDocuments(),
    ]);
    res.status(200).json({
      success: true,
      message: 'Tracking records retrieved',
      data: { records, pagination: { page: parseInt(page), limit: parseInt(limit), total } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { receiveDeviceData, getAnimalHistory, getLatestTracking, getAllTracking };
