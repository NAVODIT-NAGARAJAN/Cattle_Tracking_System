'use strict';

/**
 * 404 Not Found handler.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
  });
};

module.exports = notFound;
