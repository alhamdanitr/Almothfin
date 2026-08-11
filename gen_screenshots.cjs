const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
const logoFile = path.join(publicDir, 'logo.png');

if (fs.existsSync(logoFile)) {
  // Desktop screenshot
  sharp(logoFile)
    .resize(1920, 1080, { fit: 'contain', background: '#ffffff' })
    .toFile(path.join(publicDir, 'screenshot-desktop.png'))
    .then(() => console.log('Created screenshot-desktop.png'));

  // Mobile screenshot
  sharp(logoFile)
    .resize(1080, 1920, { fit: 'contain', background: '#ffffff' })
    .toFile(path.join(publicDir, 'screenshot-mobile.png'))
    .then(() => console.log('Created screenshot-mobile.png'));
} else {
  console.log("Logo not found at", logoFile);
}
