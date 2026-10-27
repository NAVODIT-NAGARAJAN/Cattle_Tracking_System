'use strict';

require('dotenv').config();

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');

const { createApp } = require('./app');
const connectDB = require('./config/db');
const socketService = require('./services/socketService');
const mlService = require('./services/mlService');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create Express app and HTTP server
    const app = createApp();
    const server = http.createServer(app);

    // Attach Socket.IO to same HTTP server
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Initialize Socket.IO service
    socketService.init(io);

    // Initialize ML model (non-fatal at startup)
    await mlService.initModel();

    // Start listening
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`ML model status: ${mlService.getModelStatus()}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down...`);
      server.close(() => {
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
