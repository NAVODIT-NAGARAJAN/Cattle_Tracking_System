'use strict';

const Animal = require('../models/Animal');
const { generateAnimalId, normalizeRfid } = require('../utils/animalId');
const { isValidRfid, isValidLatitude, isValidLongitude } = require('../utils/validation');
const socketService = require('../services/socketService');

/**
 * POST /api/animals
 */
const createAnimal = async (req, res, next) => {
  try {
    const { rfidUid, sex, age, ownerName, village, district, state, breed, breedConfidence } = req.body;

    if (!isValidRfid(rfidUid)) {
      return res.status(400).json({ success: false, message: 'RFID UID is required', error: 'VALIDATION_ERROR' });
    }

    const normalizedRfid = normalizeRfid(rfidUid);
    const animalId = generateAnimalId(normalizedRfid);

    const existing = await Animal.findOne({ rfidUid: normalizedRfid });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Animal with this RFID already exists', error: 'DUPLICATE_RFID' });
    }

    const animal = await Animal.create({
      animalId,
      rfidUid: normalizedRfid,
      sex: sex || 'unknown',
      age: age !== undefined && age !== null ? age : 12,
      ownerName: ownerName || 'Navodit',
      village: village || 'Vellode',
      district: district || 'Erode',
      state: state || null,
      breed: breed || null,
      breedConfidence: breedConfidence || null,
      status: 'unknown',
    });

    socketService.emitAnimalUpdated(animal);

    res.status(201).json({
      success: true,
      message: 'Animal registered successfully',
      data: { animal },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/animals
 */
const getAnimals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, breed, status, district } = req.query;
    const filter = {};

    if (breed) filter.breed = breed;
    if (status) filter.status = status;
    if (district) filter.district = district;
    if (search) {
      filter.$or = [
        { animalId: { $regex: search, $options: 'i' } },
        { rfidUid: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [animals, total] = await Promise.all([
      Animal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Animal.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Animals retrieved',
      data: {
        animals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/animals/:animalId
 */
const getAnimalById = async (req, res, next) => {
  try {
    const animal = await Animal.findOne({ animalId: req.params.animalId });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found', error: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Animal retrieved', data: { animal } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/animals/rfid/:rfidUid
 */
const getAnimalByRfid = async (req, res, next) => {
  try {
    const rfidUid = normalizeRfid(req.params.rfidUid);
    const animal = await Animal.findOne({ rfidUid });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found', error: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Animal retrieved', data: { animal } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/animals/:animalId
 */
const updateAnimal = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude !== undefined && !isValidLatitude(latitude)) {
      return res.status(400).json({ success: false, message: 'Latitude must be between -90 and 90', error: 'VALIDATION_ERROR' });
    }
    if (longitude !== undefined && !isValidLongitude(longitude)) {
      return res.status(400).json({ success: false, message: 'Longitude must be between -180 and 180', error: 'VALIDATION_ERROR' });
    }

    // Prevent updating protected fields
    const { animalId: _aid, rfidUid: _rfid, ...updateData } = req.body;

    const animal = await Animal.findOneAndUpdate(
      { animalId: req.params.animalId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found', error: 'NOT_FOUND' });
    }

    socketService.emitAnimalUpdated(animal);

    res.status(200).json({ success: true, message: 'Animal updated', data: { animal } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/animals/:animalId/status
 */
const updateAnimalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['online', 'offline', 'unknown'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be online, offline, or unknown', error: 'VALIDATION_ERROR' });
    }

    const animal = await Animal.findOneAndUpdate(
      { animalId: req.params.animalId },
      { status },
      { new: true }
    );

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found', error: 'NOT_FOUND' });
    }

    socketService.emitAnimalUpdated(animal);

    res.status(200).json({ success: true, message: 'Animal status updated', data: { animal } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/animals/:animalId
 */
const deleteAnimal = async (req, res, next) => {
  try {
    const animal = await Animal.findOneAndDelete({ animalId: req.params.animalId });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found', error: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Animal deleted', data: { animal } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAnimal,
  getAnimals,
  getAnimalById,
  getAnimalByRfid,
  updateAnimal,
  updateAnimalStatus,
  deleteAnimal,
};
