const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_EXTENSIONS = ['.js'];
const EXCLUDE_DIRS = ['node_modules', '.git', '.firebase', '.expo', 'dist', 'web-build', 'assets'];

// Rules configuration
const RULES = [
    {
        id: 'no-uninitialized-vars',
        level: 'error',
        message: 'Variable declared without initialization. Initialize with null, "", 0, etc. (Convention 1.2)',
        // Simple regex to catch "let x;" or "var y;" but not "let x = 1;"
        // Note: This is a heuristic and might have false positives/negatives compared to a real AST parser.
        regex: /(?:let|var)\s+[a-zA-Z0-9_$]+\s*;/g
    },
    {
        id: 'require-jsdoc-functions',
        level: 'warning',
        message: 'Function definition might be missing JSDoc. (Convention 2.1)',
        // Looks for function definitions that aren't immediately preceded by */
        // This is complex to do with regex perfectly, so we'll do a line-by-line context check in the main loop instead.
        manualCheck: 'jsdoc'
    },
    {
        id: 'prefer-class-over-literal',
        level: 'info',
        message: 'Potential complex object literal found. Consider converting to Class. (Convention 1.1)',
        // Heuristic: specific patterns of data access that suggest raw JSON usage
        regex: /data\['.*?'\]/g
    }
];

// Statistics
let errorCount = 0;
let warningCount = 0;
let infoCount = 0;

/**
 * Recursively walk directory and process files
 */
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (EXCLUDE_DIRS.includes(file)) return;
        
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else {
            if (TARGET_EXTENSIONS.includes(path.extname(file))) {
                checkFile(fullPath);
            }
        }
    });
}

/**
 * Check a single file against rules
 */
function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 1. Regex-based checks
    RULES.filter(r => r.regex).forEach(rule => {
        let match;
        // Reset regex state if global
        rule.regex.lastIndex = 0;
        
        // We iterate line by line for line numbers, though regex matches across lines could be tricky.
        // For simplicity in this script, we check line by line for the defined regexes.
        lines.forEach((line, index) => {
            if (rule.regex.test(line)) {
                report(filePath, index + 1, rule.level, rule.message, line.trim());
            }
        });
    });

    // 2. Context-aware checks (JSDoc)
    lines.forEach((line, index) => {
        // Simple heuristic for function definitions
        if (line.match(/(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?(?:\(.*?\)|[^=>]+)\s*=>/) || 
            line.match(/function\s+\w+\s*\(/) ||
            line.match(/class\s+\w+/)) {
            
            // Look backward for JSDoc end "*/"
            let hasJSDoc = false;
            // Check previous non-empty lines
            for (let i = index - 1; i >= 0; i--) {
                const prevLine = lines[i].trim();
                if (prevLine === '') continue; // skip empty lines
                if (prevLine.endsWith('*/')) {
                    hasJSDoc = true;
                }
                break; // only check the immediate preceding code block
            }
            
            if (!hasJSDoc) {
                // Ignore inside render/return or simple one-liners if needed, but for now report all
                // Filter out common React hooks usage which look like functions but aren't definitions needing JSDoc
                if (!line.includes('useEffect') && !line.includes('useState') && !line.includes('useContext')) {
                    report(filePath, index + 1, 'warning', 'Missing JSDoc for function/class definition. (Convention 2.1)', line.trim());
                }
            }
        }
    });
}

function report(filePath, line, level, message, codeContext) {
    const color = level === 'error' ? '\x1b[31m' : (level === 'warning' ? '\x1b[33m' : '\x1b[36m');
    const reset = '\x1b[0m';
    
    console.log(`${color}[${level.toUpperCase()}] ${filePath}:${line}${reset}`);
    console.log(`  ${message}`);
    console.log(`  Code: ${codeContext}`);
    console.log('');
    
    if (level === 'error') errorCount++;
    if (level === 'warning') warningCount++;
    if (level === 'info') infoCount++;
}

// Main execution
const targetDirs = process.argv.slice(2);

if (targetDirs.length === 0) {
    console.log('Usage: node check_coding_conventions.js <directory1> <directory2> ...');
    process.exit(1);
}

console.log('🔍 Starting Coding Convention Check...');
console.log('Rules reference: docs/CodingConventions_JS.md');
console.log('--------------------------------------------------');

targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        walkDir(dir);
    } else {
        console.error(`Directory not found: ${dir}`);
    }
});

console.log('--------------------------------------------------');
console.log(`Check Complete.`);
console.log(`Errors: ${errorCount}, Warnings: ${warningCount}, Infos: ${infoCount}`);

if (errorCount > 0) {
    console.log('\x1b[31m❌ Failed: Critical convention violations found.\x1b[0m');
    process.exit(1);
} else {
    console.log('\x1b[32m✅ Passed: No critical violations.\x1b[0m');
    process.exit(0);
}
