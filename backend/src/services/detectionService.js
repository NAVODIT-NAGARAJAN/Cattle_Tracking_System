'use strict';

const Detection = require('../models/Detection');

/**
 * Create a detection record.
 * @param {object} data
 * @returns {Promise<Detection>}
 */
const createDetection = async (data) => {
  const detection = new Detection(data);
  await detection.save();
  return detection;
};

/**
 * Get all detections with optional filters.
 * @param {object} filter
 * @param {number} limit
 * @returns {Promise<Detection[]>}
 */
const getDetections = (filter = {}, limit = 50) =>
  Detection.find(filter).sort({ timestamp: -1 }).limit(limit);

/**
 * Get detections for a specific animal.
 * @param {string} animalId
 * @returns {Promise<Detection[]>}
 */
const getByAnimalId = (animalId) =>
  Detection.find({ animalId }).sort({ timestamp: -1 });

module.exports = { createDetection, getDetections, getByAnimalId };
