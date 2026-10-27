'use strict';

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ort = require('onnxruntime-node');

// Actual model classes (9) — verified from exported best.onnx / best.pt
// model.names: {0:'Banni',1:'Bargur',2:'Bhadawari',3:'Jaffrabadi',4:'Mehsana',5:'Murrah',6:'Nagpuri',7:'Nili_Ravi',8:'Toda'}
const BREED_CLASSES = [
  'Banni',
  'Bargur',
  'Bhadawari',
  'Jaffrabadi',
  'Mehsana',
  'Murrah',
  'Nagpuri',
  'Nili_Ravi',
  'Toda',
];

const INPUT_SIZE = 224;

let session = null;
let modelLoaded = false;
let modelError = null;

/**
 * Resolve the ONNX model path from environment.
 */
const getModelPath = () => {
  return process.env.ML_MODEL_PATH || path.resolve(__dirname, '../../..', 'ml', 'models', 'best.onnx');
};

/**
 * Load the ONNX model once. Subsequent calls return immediately.
 */
const loadModel = async () => {
  if (modelLoaded) return;
  if (modelError) throw modelError;

  const modelPath = getModelPath();

  if (!fs.existsSync(modelPath)) {
    modelError = new Error(`ONNX model not found at: ${modelPath}. Run the one-time export first.`);
    throw modelError;
  }

  try {
    session = await ort.InferenceSession.create(modelPath);
    modelLoaded = true;
    console.log(`ML model loaded: ${modelPath}`);
  } catch (err) {
    modelError = new Error(`Failed to load ONNX model: ${err.message}`);
    throw modelError;
  }
};

/**
 * Attempt to initialize the model at startup (non-fatal if missing).
 */
const initModel = async () => {
  try {
    await loadModel();
  } catch (err) {
    console.warn(`[mlService] Model not ready at startup: ${err.message}`);
  }
};

/**
 * Return current model status.
 * @returns {'loaded'|'not_loaded'}
 */
const getModelStatus = () => (modelLoaded ? 'loaded' : 'not_loaded');

/**
 * Apply softmax to raw output logits.
 * @param {Float32Array} logits
 * @returns {Float32Array}
 */
const softmax = (logits) => {
  const arr = Array.isArray(logits) ? logits : Array.from(logits);
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
};

/**
 * Preprocess an image file to a Float32Array tensor [1, 3, 224, 224]
 * normalized with ImageNet mean/std.
 * @param {string} imagePath
 * @returns {Promise<Float32Array>}
 */
const preprocessImage = async (imagePath) => {
  const { data, info } = await sharp(imagePath)
    .resize(INPUT_SIZE, INPUT_SIZE)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { channels } = info;
  const pixels = INPUT_SIZE * INPUT_SIZE;
  const numElements = 3 * pixels;

  const raw = new Array(numElements);
  for (let i = 0; i < pixels; i++) {
    for (let c = 0; c < 3; c++) {
      raw[c * pixels + i] = data[i * channels + c] / 255.0;
    }
  }

  // Convert through Buffer to ensure correct native realm
  const buf = Buffer.allocUnsafe(numElements * 4);
  for (let i = 0; i < numElements; i++) {
    buf.writeFloatLE(raw[i], i * 4);
  }
  return new Float32Array(buf.buffer, buf.byteOffset, numElements);
};

/**
 * Run breed prediction on an image file.
 * @param {string} imagePath - Absolute path to the image file.
 * @returns {Promise<{breed: string, confidence: number, topPredictions: Array}>}
 */
const predict = async (imagePath) => {
  if (!modelLoaded) {
    await loadModel(); // Will throw if model is missing
  }

  const tensor = await preprocessImage(imagePath);

  // Create ORT tensor: [1, 3, 224, 224]
  const inputTensor = new ort.Tensor('float32', tensor, [1, 3, INPUT_SIZE, INPUT_SIZE]);

  // Get input name dynamically
  const inputName = session.inputNames[0];
  const feeds = { [inputName]: inputTensor };

  const results = await session.run(feeds);

  // Get output tensor (first output)
  const outputName = session.outputNames[0];
  const outputData = results[outputName].data;

  // Apply softmax to get probabilities
  const probs = softmax(Array.from(outputData));

  // Map to breed names with confidence percentages
  const predictions = BREED_CLASSES.map((breed, idx) => ({
    breed,
    confidence: parseFloat((probs[idx] * 100).toFixed(2)),
  }));

  // Sort by confidence descending
  predictions.sort((a, b) => b.confidence - a.confidence);

  const top = predictions[0];
  const topPredictions = predictions.slice(0, 3);

  return {
    breed: top.breed,
    confidence: top.confidence,
    topPredictions,
  };
};

module.exports = {
  initModel,
  loadModel,
  getModelStatus,
  predict,
  BREED_CLASSES,
};
