'use strict';

/**
 * Normalize RFID UID to uppercase and trim.
 * @param {string} rfid
 * @returns {string}
 */
const normalizeRfid = (rfid) => {
  if (!rfid || typeof rfid !== 'string') return '';
  return rfid.trim().toUpperCase();
};

/**
 * Generate animalId from RFID UID.
 * Example: 21:39:05:6E => BUF-21:39:05:6E
 * @param {string} rfidUid
 * @returns {string}
 */
const generateAnimalId = (rfidUid) => {
  const normalized = normalizeRfid(rfidUid);
  if (!normalized) throw new Error('RFID UID is required to generate animal ID');
  return `BUF-${normalized}`;
};

module.exports = { generateAnimalId, normalizeRfid };
