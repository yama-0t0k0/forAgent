/**
 * Design System Compliance Checker
 * 
 * This script scans the codebase for hardcoded color values (hex codes)
 * and ensures that UI code uses the semantic tokens from THEME instead.
 * 
 * Usage: node scripts/check_design_system.js [path_to_scan]
 */
const fs = require('fs');
const path = require('path');

const TARGET_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const IGNORED_FILES = ['theme.js', 'DESIGN.md', 'check_design_system.js'];
const IGNORED_DIRS = ['node_modules', '.git', '.expo', 'dist', 'build'];

// Regex to match hex colors: # followed by 3 or 6 hex digits
// We exclude matches inside strings that look like URLs or other non-UI values if needed,
// but for now, we'll flag all hex codes.
const HEX_COLOR_REGEX = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;

// Some hex codes might be allowed (e.g., in theme definition or specific low-level mocks)
// but generally we want to discourage them.
const ALLOWED_HEX_CODES = [
  '#000', '#000000', '#fff', '#ffffff' // Pure black/white might be okay in some contexts, but even then tokens are better.
].map(c => c.toLowerCase());

let totalViolations = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (IGNORED_DIRS.includes(file)) continue;
      scanDir(fullPath);
    } else if (stats.isFile()) {
      if (!TARGET_EXTENSIONS.includes(path.extname(file))) continue;
      if (IGNORED_FILES.includes(file)) continue;

      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fileViolations = 0;

  lines.forEach((line, index) => {
    // Basic comment skipping
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    const matches = line.match(HEX_COLOR_REGEX);
    if (matches) {
      matches.forEach(match => {
        // If it's a legitimate violation (not in a comment or allowed list)
        if (!ALLOWED_HEX_CODES.includes(match.toLowerCase())) {
          console.log(`❌ ${filePath}:${index + 1} - Hardcoded color found: ${match}`);
          fileViolations++;
          totalViolations++;
        }
      });
    }
  });

  if (fileViolations > 0) {
    // console.log(`   Found ${fileViolations} violations in ${filePath}`);
  }
}

const startPath = process.argv[2] || '.';
console.log(`🔍 Scanning for Design System violations in: ${startPath}`);

if (fs.existsSync(startPath)) {
  const stats = fs.statSync(startPath);
  if (stats.isDirectory()) {
    scanDir(startPath);
  } else {
    checkFile(startPath);
  }
} else {
  console.error(`❌ Path not found: ${startPath}`);
  process.exit(1);
}

if (totalViolations > 0) {
  console.log(`\n❌ Total Design System violations: ${totalViolations}`);
  console.log('💡 Please use semantic tokens from THEME instead of hardcoded hex values.');
  process.exit(1);
} else {
  console.log('\n✅ Design System compliance check passed!');
  process.exit(0);
}
