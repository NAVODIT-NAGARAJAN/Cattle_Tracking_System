'use strict';

const express = require('express');
const router = express.Router();
const { getSummary, getBreeds, getRecent, getLive } = require('../controllers/dashboardController');

router.get('/summary', getSummary);
router.get('/breeds', getBreeds);
router.get('/recent', getRecent);
router.get('/live', getLive);

module.exports = router;
