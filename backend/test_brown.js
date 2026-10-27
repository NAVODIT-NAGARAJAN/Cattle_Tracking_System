const mlService = require('./src/services/mlService');
const sharp = require('sharp');
const path = require('path');

async function run() {
  await mlService.initModel();

  const blackPath = path.join(__dirname, 'black.jpg');
  await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .jpeg()
    .toFile(blackPath);

  const brownPath = path.join(__dirname, 'brown.jpg');
  await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 80, g: 50, b: 30 } } })
    .jpeg()
    .toFile(brownPath);

  console.log("Black Image:", await mlService.predict(blackPath));
  console.log("Brown Image:", await mlService.predict(brownPath));
}

run().catch(console.error);
