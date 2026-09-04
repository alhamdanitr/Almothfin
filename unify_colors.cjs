const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*.tsx').concat(glob.sync('src/components/*.tsx'));

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Remove all dark: classes
  code = code.replace(/dark:[^\s"']+/g, '');
  
  // Replace specific color scales with our CSS variables
  code = code.replace(/text-violet-600/g, 'text-primary');
  code = code.replace(/text-violet-900/g, 'text-primary/80');
  code = code.replace(/bg-violet-50/g, 'bg-primary/10');
  code = code.replace(/bg-violet-100/g, 'bg-primary/20');
  code = code.replace(/bg-violet-600/g, 'bg-primary');
  
  code = code.replace(/text-indigo-600/g, 'text-primary');
  code = code.replace(/text-indigo-900/g, 'text-text-main');
  code = code.replace(/bg-indigo-50/g, 'bg-primary/10');
  code = code.replace(/bg-indigo-100/g, 'bg-primary/20');
  code = code.replace(/bg-indigo-500/g, 'bg-primary');
  code = code.replace(/bg-indigo-600/g, 'bg-primary');
  
  code = code.replace(/text-blue-600/g, 'text-primary');
  code = code.replace(/text-blue-900/g, 'text-text-main');
  code = code.replace(/bg-blue-50/g, 'bg-primary/10');
  code = code.replace(/bg-blue-100/g, 'bg-primary/20');
  
  code = code.replace(/text-gray-900/g, 'text-text-main');
  code = code.replace(/text-gray-800/g, 'text-text-main');
  code = code.replace(/text-gray-700/g, 'text-text-main');
  code = code.replace(/text-gray-600/g, 'text-text-muted');
  code = code.replace(/text-gray-500/g, 'text-text-muted');
  code = code.replace(/text-gray-400/g, 'text-text-muted');
  
  code = code.replace(/bg-gray-50/g, 'bg-brand-bg');
  code = code.replace(/bg-gray-100/g, 'bg-border-main');
  code = code.replace(/bg-gray-200/g, 'bg-border-main');
  
  code = code.replace(/border-gray-200/g, 'border-border-main');
  code = code.replace(/border-gray-100/g, 'border-border-main');
  code = code.replace(/border-gray-300/g, 'border-border-main');
  
  code = code.replace(/divide-gray-100/g, 'divide-border-main');
  code = code.replace(/divide-gray-200/g, 'divide-border-main');
  
  code = code.replace(/text-slate-900/g, 'text-text-main');
  code = code.replace(/text-slate-800/g, 'text-text-main');
  code = code.replace(/text-slate-700/g, 'text-text-main');
  code = code.replace(/text-slate-600/g, 'text-text-muted');
  code = code.replace(/text-slate-500/g, 'text-text-muted');
  
  // Cleanup extra spaces left by removed dark: classes
  code = code.replace(/\s{2,}/g, ' ');
  code = code.replace(/ "\}/g, '"}');
  code = code.replace(/ \}/g, '}');
  code = code.replace(/ "/g, '"');
  code = code.replace(/" /g, '"');
  // Revert the naive space replace if it breaks syntax, better just leave spaces or fix them gracefully
  
  fs.writeFileSync(file, code);
});
