const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
code = code.replace('  };\n  };\n  const handleDelete = async', '  };\n  const handleDelete = async');
fs.writeFileSync('src/pages/Settings.tsx', code);
