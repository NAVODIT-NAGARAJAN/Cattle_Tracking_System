'use strict';

const express = require('express');
const router = express.Router();
const {
  receiveDeviceData,
  getAnimalHistory,
  getLatestTracking,
  getAllTracking,
} = require('../controllers/trackingController');

router.post('/device-data', receiveDeviceData);
router.get('/', getAllTracking);
router.get('/latest/:animalId', getLatestTracking);
router.get('/animal/:animalId', getAnimalHistory);

module.exports = router;
