const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function run() {
  const sharp = require('sharp');
  const redPath = path.join(__dirname, 'red2.jpg');
  await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .jpeg()
    .toFile(redPath);

  const form = new FormData();
  form.append('image', fs.createReadStream(redPath));

  try {
    const res = await axios.post('http://localhost:5000/api/detections/predict', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}

run().catch(console.error);
