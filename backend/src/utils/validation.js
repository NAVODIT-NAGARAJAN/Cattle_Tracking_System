'use strict';

/**
 * Validate RFID UID: non-empty string.
 * @param {string} rfid
 * @returns {boolean}
 */
const isValidRfid = (rfid) => {
  return typeof rfid === 'string' && rfid.trim().length > 0;
};

/**
 * Validate latitude: -90 to 90.
 * @param {number} lat
 * @returns {boolean}
 */
const isValidLatitude = (lat) => {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
};

/**
 * Validate longitude: -180 to 180.
 * @param {number} lon
 * @returns {boolean}
 */
const isValidLongitude = (lon) => {
  return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
};

/**
 * Validate satellites: integer >= 0.
 * @param {number} sats
 * @returns {boolean}
 */
const isValidSatellites = (sats) => {
  return Number.isInteger(sats) && sats >= 0;
};

/**
 * Validate confidence: 0-100.
 * @param {number} confidence
 * @returns {boolean}
 */
const isValidConfidence = (confidence) => {
  return typeof confidence === 'number' && !isNaN(confidence) && confidence >= 0 && confidence <= 100;
};

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email);
};

/**
 * Validate password: minimum 6 characters.
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

module.exports = {
  isValidRfid,
  isValidLatitude,
  isValidLongitude,
  isValidSatellites,
  isValidConfidence,
  isValidEmail,
  isValidPassword,
};
