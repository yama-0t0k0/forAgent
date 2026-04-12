const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_EXTENSIONS = ['.js'];
const EXCLUDE_DIRS = ['node_modules', '.git', '.firebase', '.expo', 'dist', 'web-build', 'assets'];

// Rules configuration
const RULES = [
    {
        id: 'no-var',
        level: 'error',
        message: 'Unexpected var, use let or const instead. (Convention 1.2)',
        regex: /var\s+/g
    },
    {
        id: 'no-uninitialized-vars',
        level: 'error',
        message: 'Variable declared without initialization. Initialize with null, "", 0, etc. (Convention 1.2)',
        // Simple regex to catch uninitialized variable declarations
        // Note: This is a heuristic and might have false positives/negatives compared to a real AST parser.
        regex: /let\s+[a-zA-Z0-9_$]+\s*;/g
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
    },
    {
        id: 'no-deep-relative-paths',
        level: 'error',
        message: 'Deep relative path detected. Use Path Aliases (e.g. @shared/) instead. (Convention 6.1)',
        // Matches ../../ (2 levels up) or more
        regex: /\.\.\/\.\.\//g
    },
    {
        id: 'strict-equality',
        level: 'error',
        message: 'Expected === and !== instead of == and !=. (Convention 4.1)',
        // Matches ' == ' or ' != ' but not ' === ' or ' !== '. Uses negative lookahead/lookbehind logic simulation.
        // Matches space or non-symbol before ==/!=, and non-symbol after.
        regex: /(?:^|[^=!<>])\s*(==|!=)(?!=)/g
    },
    {
        id: 'prefer-single-quotes',
        level: 'warning',
        message: 'Strings must use singlequote. (Convention 4.2)',
        // Checks for double quotes. Logic handled in manualCheck to allow double quotes if string contains single quote.
        manualCheck: 'quotes'
    },
    {
        id: 'no-object-assign',
        level: 'warning',
        message: 'Use spread syntax (...) instead of Object.assign. (Convention 4.3)',
        regex: /Object\.assign/g
    },
    {
        id: 'prefer-array-methods',
        level: 'warning',
        message: 'Use array methods (map, filter, etc) instead of for loops. (Convention 4.4)',
        regex: /for\s*\(/g
    },
    {
        id: 'no-magic-values',
        level: 'warning',
        message: 'Magic number or string literal detected in comparison. Use constants/Enums instead. (Convention 3.1)',
        // Matches comparisons (===, !==, ==, !=, >, <, >=, <=) with raw numbers (excluding -1, 0, 1) or strings (excluding empty "")
        // Heuristic: looks for space surrounding op, then literal.
        // Note: Require whitespace around < and > operators to avoid false positives on JSX tag delimiters.
        regex: /(?:===|!==|==|!=)\s*(?!0\b|1\b|-1\b|""\b|''\b)(?:['"`][^'"`]+['"`]|-?\d+)|(?:\s(?:>=|<=|>|<)\s+)(?!0\b|1\b|-1\b|""\b|''\b)(?:['"`][^'"`]+['"`]|-?\d+)/g
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
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        if (TARGET_EXTENSIONS.includes(path.extname(dir))) {
            checkFile(dir);
        }
        return;
    }

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
        let match = null;
        // Reset regex state if global
        rule.regex.lastIndex = 0;
        
        // We iterate line by line for line numbers, though regex matches across lines could be tricky.
        // For simplicity in this script, we check line by line for the defined regexes.
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            // Skip comments and JSDoc lines
            if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) return;

            // Special exception for data access with inline type definition or nullish coalescing (modern patterns)
            if (rule.id === 'prefer-class-over-literal') {
                if (line.includes('/** @type')) return;
                // Check previous line for @type definition
                if (index > 0 && lines[index-1].trim().includes('/** @type')) return;
                
                // Also skip if it uses optional chaining or nullish coalescing which implies safe access
                if (line.includes('??') || line.includes('?.')) return;

                // Skip spread syntax
                if (line.includes('...data[')) return;
                
                // Skip condition checks
                if (line.trim().startsWith('if (data[')) return;
            }

            if (rule.regex.test(line)) {
                report(filePath, index + 1, rule.level, rule.message, line.trim());
            }
        });
    });

    // 2. Context-aware checks (JSDoc)
    // 2.1 File Naming Convention Check (Convention 5.2)
    const fileName = path.basename(filePath, path.extname(filePath));
    if (fileName !== 'index') {
        // Check for Class definition
        // Regex looks for 'class' keyword at start of line (ignoring whitespace) to avoid matching JSDoc comments
        if (/(?:^|[\r\n])\s*(?:export\s+)?class\s+\w+/.test(content)) {
            if (/^[a-z]/.test(fileName)) {
                report(filePath, 0, 'warning', `File contains 'class' definition but filename is camelCase. Rename to PascalCase (e.g. ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}.js). (Convention 5.2)`, fileName);
            }
        }
        // Check for Component definition (heuristic: PascalCase export)
        // Matches UpperThenLower (e.g. MyComponent) to exclude ALLCAPS constants (e.g. THEME)
        else if (/export\s+(?:default\s+)?(?:const|function)\s+([A-Z][a-z0-9]\w*)/.test(content)) {
             // If it exports a PascalCase symbol, it's likely a component, so filename should be PascalCase
             // Exception: sometimes we export Types/Constants from utils, but typically main export matches filename.
             // We'll stick to: if filename is camelCase, verify it doesn't export a Component-like name as default or main
             const match = content.match(/export\s+(?:default\s+)?(?:const|function)\s+([A-Z][a-z0-9]\w*)/);
             if (match && /^[a-z]/.test(fileName)) {
                 // Weak warning: might be utility exporting a constant?
                 // Let's restrict to 'default' export or strict match
                 // If export name matches filename (case-insensitive) but case differs
                 if (match[1].toLowerCase() === fileName.toLowerCase()) {
                      report(filePath, 0, 'warning', `File exports component '${match[1]}' but filename is camelCase. Rename to PascalCase. (Convention 5.2)`, fileName);
                 }
             }
        }
        // If filename is PascalCase, it should likely contain a class or component
        else if (/^[A-Z]/.test(fileName)) {
             // If no class and no PascalCase export found above...
             // Maybe check if it's just a screen or component defined differently?
             // Skipping reverse check to avoid false positives.
        }
    }

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        // Skip comments
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) return;

        // Check for double quotes (Rule: prefer-single-quotes)
        // Allow double quotes only if the string contains a single quote (to avoid escaping)
        const quoteRule = RULES.find(r => r.id === 'prefer-single-quotes');
        if (quoteRule) {
            const doubleQuoteRegex = /"((?:[^"\\]|\\.)*)"/g;
            let match;
            // We only check the code part, roughly trying to exclude trailing comments
            // This is imperfect but helps reduce false positives in comments
            const codePart = line.replace(/\/\/.*$/, ''); 
            
            while ((match = doubleQuoteRegex.exec(codePart)) !== null) {
                // If content does not contain single quote, it should be single-quoted
                if (!match[1].includes("'")) {
                    report(filePath, index + 1, quoteRule.level, quoteRule.message, match[0]);
                }
            }
        }

        // Simple heuristic for function definitions
        // Improved regex to avoid false positives on arrow functions passed as arguments (e.g. map(d => ...))
        // Matches: const foo = () =>, const foo = (a) =>, const foo = a =>
        // Does NOT match: const foo = bar.map(a =>
        // Also anchored to start of line to avoid matching inside strings/comments
        if (line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?(?:(?:\([^\)]*\))|(?:\w+))\s*=>/) || 
            line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(/) ||
            line.match(/^\s*(?:export\s+)?class\s+\w+/)) {
            
            // Look backward for JSDoc end "*/"
            let hasJSDoc = false;
            let jsDocContent = '';
            let jsDocStartFound = false;
            
            // Check previous non-empty lines
            for (let i = index - 1; i >= 0; i--) {
                const prevLine = lines[i].trim();
                if (prevLine === '') continue; // skip empty lines
                
                if (prevLine.endsWith('*/')) {
                    hasJSDoc = true;
                    // Read JSDoc content backwards
                    for (let j = i; j >= 0; j--) {
                        const docLine = lines[j].trim();
                        jsDocContent = docLine + '\n' + jsDocContent;
                        if (docLine.startsWith('/**')) {
                            jsDocStartFound = true;
                            break;
                        }
                    }
                }
                break; // only check the immediate preceding code block
            }
            
            if (!hasJSDoc) {
                // Ignore inside render/return or simple one-liners if needed, but for now report all
                // Filter out common React hooks usage which look like functions but aren't definitions needing JSDoc
                if (!line.includes('useEffect') && !line.includes('useState') && !line.includes('useContext')) {
                    report(filePath, index + 1, 'warning', 'Missing JSDoc for function/class definition. (Convention 2.1)', line.trim());
                }
            } else if (jsDocStartFound) {
                // Check for @param if function has arguments
                let args = [];
                
                // Extract arguments based on pattern
                // 1. Arrow function with parentheses: const foo = (a, b) =>
                const arrowMatchParens = line.match(/=\s*(?:async\s*)?\(([^)]*)\)\s*=>/);
                if (arrowMatchParens) {
                    args = arrowMatchParens[1].split(',').map(a => a.trim().split('=')[0].trim()).filter(a => a);
                } 
                // 2. Arrow function without parentheses: const foo = a =>
                else if (line.match(/=\s*(?:async\s*)?\w+\s*=>/)) {
                    const match = line.match(/=\s*(?:async\s*)?(\w+)\s*=>/);
                    if (match) args = [match[1]];
                }
                // 3. Regular function: function foo(a, b)
                else if (line.match(/function\s+\w+\s*\(/)) {
                    const match = line.match(/function\s+\w+\s*\(([^)]*)\)/);
                    if (match) {
                        args = match[1].split(',').map(a => a.trim().split('=')[0].trim()).filter(a => a);
                    }
                }

                // Verify @param for each arg
                args.forEach(arg => {
                    // Clean up destructuring syntax
                     let cleanArg = arg.replace(/[{}]/g, '').trim();
                    // Handle aliases in destructuring (e.g. "companyId: propCompanyId" -> "companyId")
                    cleanArg = cleanArg.split(':')[0].trim();
                    // Handle default values in function signature (e.g. "columns = 9" -> "columns")
                    cleanArg = cleanArg.split('=')[0].trim();
                    
                    if (!cleanArg) return;
                   
                   // If it was a destructuring pattern like { a, b }, we might have split it.
                   // But here we are iterating over the split results.
                   // e.g. "({ navigation, route })" -> split(",") -> ["{ navigation", " route }"]
                   // cleanArg -> "navigation", "route"
                   
                   // Check if @param exists for this arg
                    // We allow @param {Type} argName OR @param {Type} props.argName (common convention) OR params.argName
                    // Handle optional parameters like [arg] or [props.arg] or [arg=default]
                    // Updated regex to allow [] in default values (e.g. [arg=[]])
                    const paramRegex = new RegExp(`@param\\s+\\{[^}]+\\}\\s+(?:\\[\\s*)?(?:props\\.|params\\.)?${cleanArg}(?:\\s*=(?:[^\\]]|\\[\\])+)?(?:\\s*\\])?(?:\\s|$)`);
                    if (!paramRegex.test(jsDocContent)) {
                         report(filePath, index + 1, 'warning', `Missing or incomplete @param JSDoc for argument '${cleanArg}'. Expected format: @param {Type} ${cleanArg} ...`, line.trim());
                    }
                });
            }
        }
    });
}

/**
 * Report a convention violation
 * @param {string} filePath - Path to the file
 * @param {number} line - Line number
 * @param {string} level - 'error', 'warning', or 'info'
 * @param {string} message - Error message
 * @param {string} codeContext - The code snippet causing the violation
 */
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
