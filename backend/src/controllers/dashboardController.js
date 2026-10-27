'use strict';

const Animal = require('../models/Animal');
const Detection = require('../models/Detection');

/**
 * GET /api/dashboard/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAnimals,
      onlineAnimals,
      offlineAnimals,
      gpsFixedAnimals,
      totalDetections,
      todayDetections,
    ] = await Promise.all([
      Animal.countDocuments(),
      Animal.countDocuments({ status: 'online' }),
      Animal.countDocuments({ status: 'offline' }),
      Animal.countDocuments({ gpsFix: true }),
      Detection.countDocuments(),
      Detection.countDocuments({ timestamp: { $gte: today } }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved',
      data: {
        totalAnimals,
        onlineAnimals,
        offlineAnimals,
        gpsFixedAnimals,
        totalDetections,
        todayDetections,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/breeds
 * Breed distribution.
 */
const getBreeds = async (req, res, next) => {
  try {
    const distribution = await Animal.aggregate([
      { $match: { breed: { $ne: null } } },
      { $group: { _id: '$breed', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { breed: '$_id', count: 1, _id: 0 } },
    ]);

    res.status(200).json({
      success: true,
      message: 'Breed distribution retrieved',
      data: { distribution },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent
 * Recent detections.
 */
const getRecent = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const detections = await Detection.find().sort({ timestamp: -1 }).limit(parseInt(limit));
    res.status(200).json({
      success: true,
      message: 'Recent detections retrieved',
      data: { detections },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/live
 * Animals currently online with GPS fix.
 */
const getLive = async (req, res, next) => {
  try {
    const animals = await Animal.find({ status: 'online' }).sort({ lastGpsUpdate: -1 }).limit(50);
    res.status(200).json({
      success: true,
      message: 'Live animals retrieved',
      data: { animals },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getBreeds, getRecent, getLive };
