const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(
  /if \(!data\.version \|\| \(!data\.workers && !data\.records\)\) \{/,
  `const importData = data.data || data;
        if (!data.version || (!importData.workers && !importData.records)) {`
);

code = code.replace(
  /if \(data\.workers && Array\.isArray\(data\.workers\)\) \{/g,
  `if (importData.workers && Array.isArray(importData.workers)) {`
);

code = code.replace(
  /for \(const worker of data\.workers\) \{/g,
  `for (const worker of importData.workers) {`
);

code = code.replace(
  /if \(data\.records && Array\.isArray\(data\.records\)\) \{/g,
  `if (importData.records && Array.isArray(importData.records)) {`
);

code = code.replace(
  /data\.records\.map\(/g,
  `importData.records.map(`
);

fs.writeFileSync('src/pages/Settings.tsx', code);
