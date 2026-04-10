/**
 * Design System Compliance Checker
 * 
 * Scans the codebase for hardcoded color values (Hex, RGBA, Named Colors)
 * to ensure adherence to the semantic theme tokens defined in THEME.
 */
const fs = require('fs');
const path = require('path');

const TARGET_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const IGNORED_FILES = ['theme.js', 'DESIGN.md', 'check_design_system.js'];
const IGNORED_DIRS = ['node_modules', '.git', '.expo', 'dist', 'build', 'tests/security_stub'];

// 1. Hex Colors: # followed by 3 or 6 hex digits
const HEX_COLOR_REGEX = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;

// 2. RGBA Colors: rgba?(...)
const RGBA_COLOR_REGEX = /rgba?\([\d\s,.]+\)/g;

// 3. Named Colors (as string literals in style objects)
// We look for common CSS color names used as values like: color: 'red'
const NAMED_COLORS = [
  'red', 'blue', 'green', 'yellow', 'cyan', 'magenta', 'orange', 'purple', 'gray', 'grey', 'slate', 'zinc', 'neutral'
];
const NAMED_COLOR_REGEX = new RegExp(`['"](${NAMED_COLORS.join('|')})['"]`, 'gi');

// Pure colors and semantic variant names that are allowed as string literals
const ALLOWED_COLORS = [
  '#fff', '#ffffff', '#000', '#000000', 
  'transparent', 'white', 'black', 
  'neutral', 'primary', 'secondary', 'success', 'warning', 'error', 'info', 'accent'
].map(c => c.toLowerCase());

let totalViolations = 0;
let filesWithViolations = 0;

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
  let fileViolations = [];

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    // Check Hex
    const hexMatches = line.match(HEX_COLOR_REGEX);
    if (hexMatches) {
      hexMatches.forEach(match => {
        if (!ALLOWED_COLORS.includes(match.toLowerCase())) {
          fileViolations.push({ line: index + 1, value: match, type: 'Hex' });
        }
      });
    }

    // Check RGBA
    const rgbaMatches = line.match(RGBA_COLOR_REGEX);
    if (rgbaMatches) {
      rgbaMatches.forEach(match => {
        fileViolations.push({ line: index + 1, value: match, type: 'RGBA' });
      });
    }

    // Check Named Colors
    const namedMatches = line.match(NAMED_COLOR_REGEX);
    if (namedMatches) {
      namedMatches.forEach(match => {
        const colorName = match.replace(/['"]/g, '');
        if (!ALLOWED_COLORS.includes(colorName.toLowerCase())) {
          fileViolations.push({ line: index + 1, value: match, type: 'Named' });
        }
      });
    }
  });

  if (fileViolations.length > 0) {
    filesWithViolations++;
    console.log(`\n📄 ${path.relative(process.cwd(), filePath)}:`);
    fileViolations.forEach(v => {
      console.log(`  L${v.line}: Hardcoded ${v.type} found -> ${v.value}`);
      totalViolations++;
    });
  }
}

const startPath = process.argv[2] || '.';
console.log(`🔍 Scanning for Design System violations in: ${path.resolve(startPath)}`);

if (fs.existsSync(startPath)) {
  scanDir(startPath);
} else {
  console.error(`❌ Path not found: ${startPath}`);
  process.exit(1);
}

if (totalViolations > 0) {
  console.log(`\n❌ Design System compliance check failed!`);
  console.log(`Found ${totalViolations} violations across ${filesWithViolations} files.`);
  console.log('💡 Action: Replace these values with semantic tokens from THEME (e.g., THEME.primary, THEME.surfaceGlass).');
  process.exit(1);
} else {
  console.log('\n✅ All scanned files comply with the Design System!');
  process.exit(0);
}
