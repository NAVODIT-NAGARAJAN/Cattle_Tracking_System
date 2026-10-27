'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/authRoutes');
const animalRoutes = require('./routes/animalRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const detectionRoutes = require('./routes/detectionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Services
const mlService = require('./services/mlService');

const createApp = () => {
  const app = express();

  // Security
  app.use(helmet());

  // CORS
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { success: false, message: 'Too many requests', error: 'RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Ensure upload directory exists
  const uploadDir = process.env.UPLOAD_DIR || 'uploads/detections';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve uploads statically
  app.use('/uploads', express.static(path.resolve(uploadDir, '..')));

  // Health check
  app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const mlStatus = mlService.getModelStatus();
    res.status(200).json({
      success: true,
      message: 'Backend is running',
      database: dbStatus,
      mlModel: mlStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/animals', animalRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/detections', detectionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/devices', deviceRoutes);

  // 404
  app.use(notFound);

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
