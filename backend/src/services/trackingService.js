'use strict';

const Tracking = require('../models/Tracking');

/**
 * Create a tracking record.
 * @param {object} data
 * @returns {Promise<Tracking>}
 */
const createTracking = async (data) => {
  const record = new Tracking(data);
  await record.save();
  return record;
};

/**
 * Get tracking history for an animal.
 * @param {string} animalId
 * @param {number} limit
 * @returns {Promise<Tracking[]>}
 */
const getHistory = (animalId, limit = 100) =>
  Tracking.find({ animalId }).sort({ timestamp: -1 }).limit(limit);

/**
 * Get latest tracking record for an animal.
 * @param {string} animalId
 * @returns {Promise<Tracking|null>}
 */
const getLatest = (animalId) =>
  Tracking.findOne({ animalId }).sort({ timestamp: -1 });

module.exports = { createTracking, getHistory, getLatest };
