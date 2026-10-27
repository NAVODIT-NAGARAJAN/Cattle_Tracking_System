'use strict';

module.exports = {
  testEnvironment: 'node',
  testTimeout: 120000,
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  // Run all tests in the same process — required for onnxruntime-node native bindings
  // (avoids Float32Array VM-context mismatch in worker threads)
  maxWorkers: 1,
  // Ensure fake timers are NOT used (onnxruntime uses setImmediate internally)
  fakeTimers: { enableGlobally: false },
};
