'use strict';

const Device = require('../models/Device');
const socketService = require('../services/socketService');

/**
 * POST /api/devices/register
 */
const registerDevice = async (req, res, next) => {
  try {
    const { deviceId, deviceType, name, ipAddress, firmwareVersion, metadata } = req.body;

    if (!deviceId || !deviceId.trim()) {
      return res.status(400).json({ success: false, message: 'deviceId is required', error: 'VALIDATION_ERROR' });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId: deviceId.trim() },
      {
        deviceId: deviceId.trim(),
        deviceType: deviceType || 'esp32',
        name: name || null,
        ipAddress: ipAddress || null,
        firmwareVersion: firmwareVersion || null,
        status: 'online',
        lastSeen: new Date(),
        metadata: metadata || {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    socketService.emitDeviceOnline(device);

    res.status(200).json({ success: true, message: 'Device registered', data: { device } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/devices/heartbeat
 */
const deviceHeartbeat = async (req, res, next) => {
  try {
    const { deviceId, ipAddress, firmwareVersion } = req.body;

    if (!deviceId || !deviceId.trim()) {
      return res.status(400).json({ success: false, message: 'deviceId is required', error: 'VALIDATION_ERROR' });
    }

    const updateFields = { status: 'online', lastSeen: new Date() };
    if (ipAddress) updateFields.ipAddress = ipAddress;
    if (firmwareVersion) updateFields.firmwareVersion = firmwareVersion;

    const device = await Device.findOneAndUpdate(
      { deviceId: deviceId.trim() },
      updateFields,
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found', error: 'NOT_FOUND' });
    }

    socketService.emitDeviceOnline(device);

    res.status(200).json({ success: true, message: 'Heartbeat received', data: { device } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/devices
 */
const getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 });
    res.status(200).json({ success: true, message: 'Devices retrieved', data: { devices } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/devices/:deviceId
 */
const getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found', error: 'NOT_FOUND' });
    }
    res.status(200).json({ success: true, message: 'Device retrieved', data: { device } });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerDevice, deviceHeartbeat, getDevices, getDeviceById };
