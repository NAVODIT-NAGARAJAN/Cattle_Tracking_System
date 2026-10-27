'use strict';

const Animal = require('../models/Animal');
const { generateAnimalId, normalizeRfid } = require('../utils/animalId');

/**
 * Create or find an animal by RFID.
 * @param {object} data
 * @returns {Promise<Animal>}
 */
const createAnimal = async (data) => {
  const rfidUid = normalizeRfid(data.rfidUid);
  const animalId = generateAnimalId(rfidUid);

  const animal = new Animal({ ...data, rfidUid, animalId });
  await animal.save();
  return animal;
};

/**
 * Find animal by animalId.
 * @param {string} animalId
 * @returns {Promise<Animal|null>}
 */
const findByAnimalId = (animalId) => Animal.findOne({ animalId });

/**
 * Find animal by RFID UID.
 * @param {string} rfidUid
 * @returns {Promise<Animal|null>}
 */
const findByRfid = (rfidUid) => Animal.findOne({ rfidUid: normalizeRfid(rfidUid) });

/**
 * Update an animal's GPS fields.
 * @param {string} animalId
 * @param {object} gpsData
 * @returns {Promise<Animal|null>}
 */
const updateGps = (animalId, gpsData) =>
  Animal.findOneAndUpdate({ animalId }, gpsData, { new: true });

/**
 * Update animal breed info after detection.
 * @param {string} animalId
 * @param {object} breedData
 * @returns {Promise<Animal|null>}
 */
const updateBreed = (animalId, breedData) =>
  Animal.findOneAndUpdate({ animalId }, breedData, { new: true });

module.exports = { createAnimal, findByAnimalId, findByRfid, updateGps, updateBreed };
