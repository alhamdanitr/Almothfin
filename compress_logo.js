const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Check if sharp is installed, if not install it
  try {
    require.resolve('sharp');
  } catch (e) {
    console.log("Installing sharp...");
    execSync('npm install sharp --no-save', { stdio: 'inherit' });
  }
  
  const sharp = require('sharp');
  
  // Find the image in public folder
  const publicDir = path.join(__dirname, 'public');
  const files = fs.readdirSync(publicDir);
  let logoFile = files.find(f => f.toLowerCase().includes('logo') || f.endsWith('.png') || f.endsWith('.jpg'));
  
  if (!logoFile) {
    // Check root directory as well
    const rootFiles = fs.readdirSync(__dirname);
    logoFile = rootFiles.find(f => f.includes('٢٠٢٦') || f.endsWith('.png'));
    if (logoFile) {
      fs.copyFileSync(path.join(__dirname, logoFile), path.join(publicDir, logoFile));
    }
  }

  if (logoFile) {
    const inputPath = path.join(publicDir, logoFile);
    const outputPath = path.join(publicDir, 'logo_compressed.png');
    
    sharp(inputPath)
      .resize(400) // Resize width to 400px (height auto)
      .png({ quality: 70, compressionLevel: 9 })
      .toFile(outputPath)
      .then(() => {
        fs.renameSync(outputPath, path.join(publicDir, 'logo.png'));
        if (logoFile !== 'logo.png') {
           fs.unlinkSync(inputPath);
        }
        console.log("SUCCESS: Image compressed and saved as logo.png");
      })
      .catch(err => console.error("Sharp error:", err));
  } else {
    console.log("ERROR: No image found");
  }
} catch (error) {
  console.error(error);
}
