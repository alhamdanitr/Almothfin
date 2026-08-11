const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  try {
    require.resolve('sharp');
  } catch (e) {
    console.log("Installing sharp...");
    execSync('npm install sharp --no-save', { stdio: 'inherit' });
  }
  
  const sharp = require('sharp');
  const publicDir = path.join(__dirname, 'public');
  const rootFiles = fs.readdirSync(__dirname);
  
  let targetFile = null;
  // look in public
  const publicFiles = fs.readdirSync(publicDir);
  for (const f of publicFiles) {
    if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) {
      targetFile = path.join(publicDir, f);
      break;
    }
  }
  // look in root if not in public
  if (!targetFile) {
    for (const f of rootFiles) {
      if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) {
        targetFile = path.join(__dirname, f);
        break;
      }
    }
  }

  if (targetFile) {
    console.log("Found image to compress:", targetFile);
    const outputPath = path.join(publicDir, 'logo_compressed.png');
    
    sharp(targetFile)
      .resize(500) 
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath)
      .then(() => {
        fs.renameSync(outputPath, path.join(publicDir, 'logo.png'));
        if (targetFile !== path.join(publicDir, 'logo.png')) {
           fs.unlinkSync(targetFile);
        }
        console.log("SUCCESS: Image compressed and saved as public/logo.png");
      })
      .catch(err => console.error("Sharp error:", err));
  } else {
    console.log("ERROR: No image found to compress yet.");
  }
} catch (error) {
  console.error(error);
}
