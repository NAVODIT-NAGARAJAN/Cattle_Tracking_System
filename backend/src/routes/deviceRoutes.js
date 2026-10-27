'use strict';

const express = require('express');
const router = express.Router();
const { registerDevice, deviceHeartbeat, getDevices, getDeviceById } = require('../controllers/deviceController');

router.post('/register', registerDevice);
router.post('/heartbeat', deviceHeartbeat);
router.get('/', getDevices);
router.get('/:deviceId', getDeviceById);

module.exports = router;
