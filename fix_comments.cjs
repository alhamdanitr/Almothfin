const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*.tsx').concat(glob.sync('src/components/*.tsx'));

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Regex to find // ... followed by some known code.
  // Actually, let's just do manual fixes for the files that are broken, because there aren't many.
});
