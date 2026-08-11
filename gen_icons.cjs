const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
const logoFile = path.join(publicDir, 'logo.png');

if (fs.existsSync(logoFile)) {
  sharp(logoFile)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(path.join(publicDir, 'icon-192.png'))
    .then(() => console.log('Created icon-192.png'));

  sharp(logoFile)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(path.join(publicDir, 'icon-512.png'))
    .then(() => console.log('Created icon-512.png'));
} else {
  console.log("Logo not found at", logoFile);
}
