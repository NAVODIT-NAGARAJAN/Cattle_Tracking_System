'use strict';

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  predict,
  createDetection,
  getDetections,
  getLatestDetections,
  getDetectionById,
  getDetectionsByAnimal,
  predictEsp32Raw,
} = require('../controllers/detectionController');

// IMPORTANT: /latest and /animal/:animalId before /:id to avoid param shadowing
router.get('/latest', getLatestDetections);
router.get('/animal/:animalId', getDetectionsByAnimal);
router.get('/:id', getDetectionById);
router.get('/', getDetections);

// Wrap multer so its errors are forwarded to Express error handler via next()
const uploadSingle = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      err.statusCode = err.statusCode || 400;
      err.code = err.code || 'UPLOAD_ERROR';
      return next(err);
    }
    next();
  });
};

router.post('/predict', uploadSingle, predict);
router.post('/predict-esp32', express.raw({ type: ['image/jpeg', 'application/octet-stream'], limit: '10mb' }), predictEsp32Raw);
router.post('/', createDetection);

module.exports = router;
