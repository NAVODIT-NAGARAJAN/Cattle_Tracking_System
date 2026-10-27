'use strict';

const express = require('express');
const router = express.Router();
const {
  createAnimal,
  getAnimals,
  getAnimalById,
  getAnimalByRfid,
  updateAnimal,
  updateAnimalStatus,
  deleteAnimal,
} = require('../controllers/animalController');
const { protect } = require('../middleware/auth');

// Public read routes (can be accessed by ESP32/field devices)
router.get('/', getAnimals);
router.get('/rfid/:rfidUid', getAnimalByRfid);
router.get('/:animalId', getAnimalById);

// Protected write routes
router.post('/', protect, createAnimal);
router.put('/:animalId', protect, updateAnimal);
router.patch('/:animalId/status', protect, updateAnimalStatus);
router.delete('/:animalId', protect, deleteAnimal);

module.exports = router;
