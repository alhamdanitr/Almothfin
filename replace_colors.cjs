const fs = require('fs');
const path = require('path');

const colorMap = {
  // Primary
  'bg-indigo-600': 'bg-primary',
  'bg-indigo-700': 'bg-primary hover:opacity-90',
  'text-indigo-600': 'text-primary',
  'text-indigo-700': 'text-primary',
  'border-indigo-600': 'border-primary',
  'ring-indigo-500': 'ring-primary',
  'bg-indigo-50': 'bg-primary/10',
  'text-indigo-800': 'text-primary',
  'bg-indigo-100': 'bg-primary/20',
  
  // Secondary
  'bg-indigo-500': 'bg-secondary',
  'text-indigo-500': 'text-secondary',
  'text-indigo-400': 'text-secondary',
  'border-indigo-500': 'border-secondary',
  'border-indigo-200': 'border-secondary/30',

  // Surface & Background
  'bg-white': 'bg-surface',
  'bg-gray-50': 'bg-brand-bg',
  'bg-gray-100': 'bg-brand-bg hover:bg-brand-bg/80',

  // Text Main
  'text-gray-900': 'text-text-main',
  'text-gray-800': 'text-text-main',
  'text-gray-700': 'text-text-main',

  // Text Secondary (Muted)
  'text-gray-600': 'text-text-muted',
  'text-gray-500': 'text-text-muted',
  'text-gray-400': 'text-text-muted',

  // Border
  'border-gray-200': 'border-border-main',
  'border-gray-300': 'border-border-main',
  'border-gray-100': 'border-border-main',

  // Success
  'bg-emerald-500': 'bg-success',
  'bg-emerald-600': 'bg-success',
  'text-emerald-500': 'text-success',
  'text-emerald-600': 'text-success',
  'text-emerald-400': 'text-success',

  // Danger
  'bg-red-500': 'bg-danger',
  'bg-red-600': 'bg-danger',
  'text-red-500': 'text-danger',
  'text-red-600': 'text-danger',
  'text-red-400': 'text-danger',

  // Warning
  'bg-orange-500': 'bg-warning',
  'bg-orange-600': 'bg-warning',
  'text-orange-500': 'text-warning',
  'text-orange-600': 'text-warning',
  'bg-yellow-500': 'bg-warning',
  'bg-yellow-600': 'bg-warning',
  'text-yellow-600': 'text-warning'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Sort keys by length descending to avoid partial matches replacing parts of larger classes
  const keys = Object.keys(colorMap).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    // Replace whole word matches only for classes
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    content = content.replace(regex, colorMap[key]);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir('./src');
