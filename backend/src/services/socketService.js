'use strict';

let io = null;

/**
 * Initialize Socket.IO instance.
 * @param {import('socket.io').Server} socketIoServer
 */
const init = (socketIoServer) => {
  io = socketIoServer;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit an event to all connected clients.
 * @param {string} event
 * @param {*} data
 */
const emit = (event, data) => {
  if (!io) {
    console.warn('[Socket.IO] Not initialized, cannot emit:', event);
    return;
  }
  io.emit(event, data);
};

const emitTrackingUpdated = (data) => emit('tracking:updated', data);
const emitDetectionCreated = (data) => emit('detection:created', data);
const emitAnimalUpdated = (data) => emit('animal:updated', data);
const emitDeviceOnline = (data) => emit('device:online', data);
const emitDeviceOffline = (data) => emit('device:offline', data);
const emitDashboardUpdated = (data) => emit('dashboard:updated', data);

module.exports = {
  init,
  emit,
  emitTrackingUpdated,
  emitDetectionCreated,
  emitAnimalUpdated,
  emitDeviceOnline,
  emitDeviceOffline,
  emitDashboardUpdated,
};
