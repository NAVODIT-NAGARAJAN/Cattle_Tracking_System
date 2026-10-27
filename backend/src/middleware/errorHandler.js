'use strict';

/**
 * Centralized error handling middleware.
 * Must have 4 parameters so Express recognizes it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let error = err.code || 'SERVER_ERROR';

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    statusCode = 409;
    message = `Duplicate value for ${field}`;
    error = 'DUPLICATE_KEY';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    error = 'VALIDATION_ERROR';
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    error = 'INVALID_ID';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    error = 'UNAUTHORIZED';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    error = 'TOKEN_EXPIRED';
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${statusCode} ${message}`, err.stack || '');
  }

  res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

module.exports = errorHandler;
