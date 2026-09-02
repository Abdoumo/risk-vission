const fs = require('fs');
const path = require('path');

// Bulk color replacement: cyan → emerald, blue (accent) → green
// This is carefully ordered to avoid double-replacements
const replacements = [
  // ─── Tailwind class replacements (cyan → emerald) ───
  // Colors
  ['text-cyan-300', 'text-emerald-300'],
  ['text-cyan-400', 'text-emerald-400'],
  ['text-cyan-500', 'text-emerald-500'],
  ['text-cyan-200', 'text-emerald-200'],
  ['bg-cyan-400', 'bg-emerald-400'],
  ['bg-cyan-500', 'bg-emerald-500'],
  ['border-cyan-400', 'border-emerald-400'],
  ['border-cyan-500', 'border-emerald-500'],
  ['ring-cyan-500', 'ring-emerald-500'],
  ['shadow-cyan-500', 'shadow-emerald-500'],
  ['from-cyan-400', 'from-emerald-400'],
  ['from-cyan-500', 'from-emerald-500'],
  ['to-cyan-500', 'to-emerald-500'],

  // Opacity variants  
  ['cyan-500/10', 'emerald-500/10'],
  ['cyan-500/20', 'emerald-500/20'],
  ['cyan-500/30', 'emerald-500/30'],
  ['cyan-500/50', 'emerald-500/50'],
  ['cyan-500/70', 'emerald-500/70'],
  ['cyan-400/70', 'emerald-400/70'],
  ['cyan-400/80', 'emerald-400/80'],
  ['cyan-300/20', 'emerald-300/20'],
  
  // ─── Tailwind class replacements (blue accents → green) ───
  ['to-blue-500', 'to-green-600'],
  ['to-blue-600', 'to-green-700'],
  ['from-blue-500', 'from-green-500'],
  ['from-blue-600', 'from-green-600'],
  ['bg-blue-500', 'bg-green-500'],
  ['bg-blue-600', 'bg-green-600'],
  ['text-blue-400', 'text-green-400'],
  ['text-blue-500', 'text-green-500'],
  ['border-blue-500', 'border-green-500'],
  ['blue-500/5', 'green-500/5'],
  ['blue-500/10', 'green-500/10'],
  ['blue-500/20', 'green-500/20'],
  ['blue-600/5', 'green-600/5'],
  
  // ─── Hex color replacements in inline styles / chart configs ───
  // Cyan hex → Emerald hex
  ['#22d3ee', '#10b981'],  // cyan-400 → emerald-500
  ['#0ea5e9', '#059669'],  // sky-500 → emerald-600
  ['#06b6d4', '#047857'],  // cyan-500 → emerald-700
  ['#67e8f9', '#34d399'],  // cyan-300 → emerald-400
  ['#0891b2', '#065f46'],  // cyan-600 → emerald-800
  ['#0284c7', '#047857'],  // sky-600 → emerald-700
  ['#38bdf8', '#6ee7b7'],  // sky-400 → emerald-300
  ['#7dd3fc', '#a7f3d0'],  // sky-300 → emerald-200
  
  // RGBA cyan → RGBA emerald
  ['rgba(34,211,238,', 'rgba(16,185,129,'],
];

let updatedFiles = 0;

function processFile(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Updated: ${path.relative(process.cwd(), fullPath)}`);
    updatedFiles++;
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file === 'node_modules' || file === 'dist') continue;
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      // Skip type definitions and config files
      if (fullPath.endsWith('.d.ts')) continue;
      processFile(fullPath);
    }
  }
}

console.log('🇩🇿 AlgoRiskAI Algerian Color Migration');
console.log('========================================');
processDir(path.join(__dirname, 'ALGORISKAI', 'src'));
console.log(`\n✨ Done! Updated ${updatedFiles} files.`);
