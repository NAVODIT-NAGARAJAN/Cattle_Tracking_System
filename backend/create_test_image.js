/**
 * Creates a minimal valid test JPEG for upload tests.
 * Run: node create_test_image.js
 */
'use strict';
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const fixturesDir = path.join(__dirname, 'tests', 'fixtures');
if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });

const outPath = path.join(fixturesDir, 'test_buffalo.jpg');

// Create a real 224x224 JPEG with brown/black colors (buffalo-like)
sharp({
  create: {
    width: 224,
    height: 224,
    channels: 3,
    background: { r: 80, g: 50, b: 30 },
  },
})
  .jpeg({ quality: 85 })
  .toFile(outPath)
  .then(() => console.log('Test image created:', outPath))
  .catch((e) => console.error(e));
