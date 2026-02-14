#!/bin/bash

# Local CI/CD Pipeline Script for Dart Projects
# Executes a series of checks to ensure Dart project integrity.
# Stages:
# 1. Dependency Resolution
# 2. Static Analysis (dart analyze)
# 3. Unit Testing (dart test)
# 4. Coding Convention Check (check_dart_coding_conventions.dart)

set -e # Exit immediately if any command fails

# Resolve the project root relative to the script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "🚀 Starting Local CI/CD Pipeline for Dart..."
echo "=================================================="

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

# --- Dart Projects Check ---
echo ""
echo "=================================================="
echo "🎯 Dart Projects Check"
echo "=================================================="

# Ensure Dart dependencies are installed (Workspace root)
echo "📦 Resolving Dart dependencies (dart pub get)..."
if dart pub get; then
    echo "   ✅ Dart dependencies resolved"
else
    echo "   ❌ Dart dependencies failed"
    exit 1
fi

DART_PROJECTS=(
    "apps/backend"
    "apps/admin_app/dart_backend"
    "shared/common_logic"
    "shared/domain_models"
    "infrastructure/firebase/functions"
)

for project in "${DART_PROJECTS[@]}"; do
    PROJECT_DIR="$PROJECT_ROOT/$project"
    echo ""
    echo "🔍 Processing Dart Project: $project"
    
    if [ ! -d "$PROJECT_DIR" ]; then
        echo "   ⚠️  Directory not found, skipping..."
        continue
    fi
    
    if [ ! -f "$PROJECT_DIR/pubspec.yaml" ]; then
        echo "   ⚠️  pubspec.yaml not found, skipping..."
        continue
    fi

    cd "$PROJECT_DIR"

    # Stage 1: Static Analysis
    run_stage "Dart Analysis" "dart analyze" "false"

    # Stage 2: Testing
    if [ -d "test" ]; then
        run_stage "Dart Testing" "dart test" "false"
    else
        echo "   ℹ️  No test directory found, skipping tests..."
    fi

    # Stage 3: Coding Convention Check (Custom)
    if [ -f "$PROJECT_ROOT/scripts/check_dart_coding_conventions.dart" ]; then
         run_stage "Dart Coding Convention Check" "dart run $PROJECT_ROOT/scripts/check_dart_coding_conventions.dart ." "true"
    fi

    cd "$PROJECT_ROOT"
done

echo ""
echo "=================================================="
echo "🎉 Dart CI/CD Pipeline Completed Successfully!"
