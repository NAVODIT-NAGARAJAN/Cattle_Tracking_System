const path = require('path');
const mlService = require('./src/services/mlService');

async function run() {
  await mlService.initModel();

  // We will test with a purely black image and a purely white image to see if the output changes.
  const sharp = require('sharp');
  
  const blackPath = path.join(__dirname, 'black.jpg');
  await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .jpeg()
    .toFile(blackPath);
    
  const whitePath = path.join(__dirname, 'white.jpg');
  await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .jpeg()
    .toFile(whitePath);

  const resBlack = await mlService.predict(blackPath);
  console.log("Black Image Prediction:", resBlack);

  const resWhite = await mlService.predict(whitePath);
  console.log("White Image Prediction:", resWhite);
}

run().catch(console.error);
