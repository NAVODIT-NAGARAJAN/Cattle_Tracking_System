'use strict';

/**
 * Custom Jest environment that uses Node's real globals for native module compatibility.
 * Specifically needed for onnxruntime-node which checks instanceof Float32Array
 * against the native binding's Float32Array, not Jest's sandboxed one.
 */
const { TestEnvironment } = require('jest-environment-node');

class NativeNodeEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    // Override Float32Array and related typed arrays with real Node.js globals
    // so onnxruntime-node's native binding instanceof checks pass
    this.global.Float32Array = Float32Array;
    this.global.Float64Array = Float64Array;
    this.global.Int32Array = Int32Array;
    this.global.Uint8Array = Uint8Array;
    this.global.Uint16Array = Uint16Array;
    this.global.Int64Array = typeof Int64Array !== 'undefined' ? Int64Array : undefined;
    this.global.BigInt64Array = BigInt64Array;
    this.global.BigUint64Array = BigUint64Array;
    this.global.ArrayBuffer = ArrayBuffer;
    this.global.SharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
    this.global.Buffer = Buffer;
  }
}

module.exports = NativeNodeEnvironment;
