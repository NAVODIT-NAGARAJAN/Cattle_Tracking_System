const fs = require('fs');
const path = require('path');
const http = require('http');

async function run() {
  const sharp = require('sharp');
  
  // Create a red image
  const redPath = path.join(__dirname, 'red.jpg');
  await sharp({ create: { width: 224, height: 224, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .jpeg()
    .toFile(redPath);

  // Upload to API
  const imageBuffer = fs.readFileSync(redPath);
  const boundary = `----FormBoundary${Date.now()}`;

  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="red.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    imageBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const predictResult = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/detections/predict',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipart.length,
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (_) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(multipart);
    req.end();
  });

  console.log("Upload result:", predictResult.body.data || predictResult.body);
}

run().catch(console.error);
