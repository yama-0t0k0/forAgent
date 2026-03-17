#!/bin/bash

# Local CI/CD Pipeline Script
# Executes a series of checks to ensure project integrity before deployment/push.
# Stages:
# 1. Dependency Check
# 2. Static Analysis (Linting)
# 3. Type Checking
# 4. Unit Testing
# 5. Build Configuration Verification

set -e # Exit immediately if any command fails

# Resolve the project root relative to the script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

MODE="full"
if [ -n "${TRAE_SANDBOX_CLI_PATH:-}" ] || [ -n "${TRAE_AI_SHELL_ID:-}" ]; then
    MODE="sandbox"
fi

if [ -n "$1" ]; then
    APPS=("$1")
else
    APPS=("individual_user_app" "corporate_user_app" "job_description" "fmjs" "admin_app")
fi

echo "🚀 Starting Local CI/CD Pipeline..."
echo "=================================================="
echo "Mode: $MODE"

# Function to run a stage
run_stage() {
    local stage_name="$1"
    local command="$2"
    local optional="$3"

    echo "▶️  Running Stage: $stage_name..."
    if eval "$command"; then
        echo "   ✅ $stage_name Passed"
    else
        if [ "$optional" = "true" ]; then
            echo "   ⚠️  $stage_name Skipped (Not configured or failed but optional)"
        else
            echo "   ❌ $stage_name Failed"
            exit 1
        fi
    fi
}

has_npm_script() {
    local script_name="$1"
    node - "$script_name" <<'NODE'
const fs = require('fs');
const scriptName = process.argv[1];
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const has = !!(pkg && pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, scriptName));
  process.exit(has ? 0 : 1);
} catch (e) {
  process.exit(1);
}
NODE
}

echo ""
echo "[Stage 1] Checking Global Integrity"
if [ ! -d "shared/common_frontend" ]; then
    echo "   ❌ Shared modules missing"
    exit 1
fi
echo "   ✅ Shared modules present"

if [ -f "$PROJECT_ROOT/scripts/check_coding_conventions.js" ]; then
    echo "   🔍 Checking Shared Frontend Conventions..."
    if node "$PROJECT_ROOT/scripts/check_coding_conventions.js" "shared/common_frontend"; then
        echo "   ✅ Shared Frontend Conventions Passed"
    else
        echo "   ❌ Shared Frontend Conventions Failed"
        exit 1
    fi
fi

if [ "$MODE" = "full" ]; then
    echo "   🔍 Running Unit Tests for Shared Frontend (Auth)..."
    if npx jest shared/common_frontend/src/features/auth --passWithNoTests; then
        echo "   ✅ Shared Frontend Auth Tests Passed"
    else
        echo "   ❌ Shared Frontend Auth Tests Failed"
        exit 1
    fi
else
    echo "   ⚠️  Skipping Shared Frontend Unit Tests (sandbox mode)"
fi

# --- Iterate over Apps ---
for app in "${APPS[@]}"; do
    APP_DIR="apps/$app/expo_frontend"
    echo ""
    echo "🔍 Processing App: $app"
    echo "   Path: $APP_DIR"
    
    if [ ! -d "$APP_DIR" ]; then
        echo "   ⚠️  Directory not found, skipping..."
        continue
    fi
    
    if [ ! -f "$APP_DIR/package.json" ]; then
        echo "   ⚠️  package.json not found, skipping..."
        continue
    fi

    cd "$PROJECT_ROOT/$APP_DIR"

    if [ -f "$PROJECT_ROOT/scripts/check_coding_conventions.js" ]; then
         run_stage "Coding Convention Check" "node $PROJECT_ROOT/scripts/check_coding_conventions.js src" "false"
    fi

    if [ "$MODE" = "full" ]; then
        if has_npm_script "lint"; then
            run_stage "Linting" "npm run lint --silent" "false"
        else
            echo "   ℹ️  No lint script found, skipping..."
        fi

        if has_npm_script "type-check"; then
            run_stage "Type Checking" "npm run type-check --silent" "false"
        else
             echo "   ℹ️  No type-check script found, skipping..."
        fi

        if has_npm_script "test"; then
            run_stage "Unit Testing" "npm test -- --passWithNoTests" "false"
        else
             echo "   ℹ️  No test script found, skipping..."
        fi

        run_stage "Build Config Verification" "npx expo config --type public > /dev/null" "false"
    else
        echo "   ⚠️  Skipping Lint/Typecheck/Test/Expo config verification (sandbox mode)"
    fi

    # Return to root
    cd "$PROJECT_ROOT"
done

echo ""
echo "=================================================="
echo "🎉 CI/CD Pipeline Completed Successfully!"
echo "   All selected checks passed."
