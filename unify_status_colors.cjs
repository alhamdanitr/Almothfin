const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*.tsx').concat(glob.sync('src/components/*.tsx'));

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace Success colors (emerald, green)
  code = code.replace(/text-emerald-700/g, 'text-success');
  code = code.replace(/text-emerald-600/g, 'text-success');
  code = code.replace(/text-emerald-900/g, 'text-success');
  code = code.replace(/bg-emerald-50/g, 'bg-success/10');
  code = code.replace(/bg-emerald-100/g, 'bg-success/20');
  code = code.replace(/text-green-700/g, 'text-success');
  code = code.replace(/text-green-600/g, 'text-success');
  code = code.replace(/bg-green-50/g, 'bg-success/10');
  code = code.replace(/bg-green-100/g, 'bg-success/20');
  
  // Replace Danger colors (red, rose)
  code = code.replace(/text-red-700/g, 'text-danger');
  code = code.replace(/text-red-600/g, 'text-danger');
  code = code.replace(/text-red-900/g, 'text-danger');
  code = code.replace(/bg-red-50/g, 'bg-danger/10');
  code = code.replace(/bg-red-100/g, 'bg-danger/20');
  code = code.replace(/bg-red-500/g, 'bg-danger');
  
  // Replace Warning colors (amber, yellow, orange)
  code = code.replace(/text-amber-700/g, 'text-warning');
  code = code.replace(/text-amber-600/g, 'text-warning');
  code = code.replace(/text-amber-900/g, 'text-warning');
  code = code.replace(/bg-amber-50/g, 'bg-warning/10');
  code = code.replace(/bg-amber-100/g, 'bg-warning/20');
  
  fs.writeFileSync(file, code);
});
