const mlService = require('./src/services/mlService');
const sharp = require('sharp');
const path = require('path');
const ort = require('onnxruntime-node');

const softmax = (logits) => {
  const arr = Array.isArray(logits) ? logits : Array.from(logits);
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
};

async function run() {
  await mlService.initModel();
  const session = await ort.InferenceSession.create(path.resolve(__dirname, '../ml/models/best.onnx'));
  
  const testImages = ['black.jpg', 'brown.jpg', 'red.jpg', 'white.jpg'];
  for (const img of testImages) {
    const { data, info } = await sharp(path.join(__dirname, img))
      .resize(224, 224)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const pixels = 224 * 224;
    const raw = new Array(pixels * 3);
    for (let i = 0; i < pixels; i++) {
      for (let c = 0; c < 3; c++) {
        // No mean/std! Just / 255.0
        raw[c * pixels + i] = data[i * info.channels + c] / 255.0;
      }
    }
    const buf = Buffer.allocUnsafe(pixels * 3 * 4);
    for (let i = 0; i < pixels * 3; i++) {
      buf.writeFloatLE(raw[i], i * 4);
    }
    const tensor = new Float32Array(buf.buffer, buf.byteOffset, pixels * 3);
    
    const inputTensor = new ort.Tensor('float32', tensor, [1, 3, 224, 224]);
    const results = await session.run({ images: inputTensor });
    const outputData = results.output0.data;
    
    const probs = softmax(Array.from(outputData));
    const preds = mlService.BREED_CLASSES.map((breed, idx) => ({ breed, conf: (probs[idx] * 100).toFixed(2) }))
                    .sort((a,b) => b.conf - a.conf);
    console.log(img, preds[0]);
  }
}

run().catch(console.error);
