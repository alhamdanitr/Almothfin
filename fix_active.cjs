const fs = require('fs');

let settingsCode = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

settingsCode = settingsCode.replace(
  'activeCompanyId,',
  'activeCompanyId,\n    activeCompany,'
);

fs.writeFileSync('src/pages/Settings.tsx', settingsCode);
