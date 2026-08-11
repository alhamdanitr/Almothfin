const fs = require('fs');
console.log("Checking if logo.png exists in public...");
if (fs.existsSync('public/logo.png')) {
  console.log("Exists.");
}
