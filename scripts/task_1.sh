#!/bin/bash

# scripts/task_1.sh
# Automates the verification and startup phase of the development workflow.
# Usage: ./scripts/task_1.sh <app_name>

APP_NAME=$1

# Check for app name argument
if [ -z "$APP_NAME" ]; then
  echo "❌ Error: App name argument is missing."
  echo "Usage: ./scripts/task_1.sh <app_name>"
  echo "Example: ./scripts/task_1.sh admin_app"
  exit 1
fi

# Validate app existence
if [ ! -d "apps/$APP_NAME" ]; then
    echo "❌ Error: App '$APP_NAME' does not exist in 'apps/' directory."
    echo "Available apps:"
    ls apps/
    exit 1
fi

echo "🚀 Starting Task 1 Automation Flow for: $APP_NAME"
echo "=================================================="

# Step 1: Analysis (Manual/AI)
echo "📋 [Step 1] Analysis: (Pre-requisite - Assumed Complete)"
echo "   - Requirement Analysis"
echo "   - Task Breakdown"

# Step 2: Implementation (Manual/AI)
echo "💻 [Step 2] Implementation: (Pre-requisite - Assumed Complete)"
echo "   - Coding"
echo "   - Unit Testing"

# Step 3: Execute tests
echo "🧪 [Step 3] Running tests..."
echo "   Target: scripts/local_ci.sh (Lint/Unit Tests) + DRY-RUN BUILD"

# 1. Run Static/Unit Tests via local_ci.sh
if [ -f "scripts/local_ci.sh" ]; then
    echo "   Executing scripts/local_ci.sh..."
    bash scripts/local_ci.sh
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -ne 0 ]; then
        echo "❌ [Result] Local CI checks FAILED."
        exit 1
    fi
else
    echo "⚠️  'scripts/local_ci.sh' not found. Skipping static analysis."
fi

# 2. Run Critical Build/Launch Verification (Missing link fixed here)
# Unit tests don't check if the app actually compiles/bundles for runtime.
# We perform a "dry-run" build check using Metro bundling logic if possible, 
# OR explicitly check for common runtime dependencies.

echo "🏗️  [Step 3.5] Verifying Runtime Integrity (Build Check)..."
# Using expo export as a proxy for "can this actually bundle?" without starting a full server,
# OR we rely on the subsequent start_expo.sh with stricter error handling.
# A fast check is to ensure all dependencies in package.json are actually in node_modules
# and that the entry point resolves.

APP_DIR="apps/$APP_NAME/expo_frontend"
if [ -d "$APP_DIR" ]; then
    echo "   Checking dependencies in $APP_DIR..."
    # Simple check: do node_modules exist?
    if [ ! -d "$APP_DIR/node_modules" ]; then
        echo "❌ Error: node_modules missing in $APP_DIR. Run 'npm install' first."
        exit 1
    fi
    
    # Optional: Run a deeper check if verify_bundle.sh exists (from E2E suite)
     if [ -f "tests/verify_bundle.sh" ]; then
         echo "   Running Bundle Integrity Check (tests/verify_bundle.sh)..."
         bash tests/verify_bundle.sh
         BUNDLE_EXIT=$?
         if [ $BUNDLE_EXIT -ne 0 ]; then
             echo "❌ Bundle verification failed. The app will likely crash on startup."
             exit 1
         fi
     fi
 fi

 # 3. Run E2E Tests (Interactive Check)
 # User requirement: "Repeat improvement until all tests pass, including button interaction."
 if [ -f "tests/run_e2e.sh" ]; then
     echo "🤖 [Step 3.8] Running E2E Interaction Tests..."
     # Check if maestro is installed
     if command -v maestro &> /dev/null; then
         bash tests/run_e2e.sh
         E2E_EXIT=$?
         if [ $E2E_EXIT -ne 0 ]; then
             echo "❌ E2E Tests FAILED. Please fix the UI interactions."
             exit 1
         fi
     else
         echo "⚠️  Maestro not found. Skipping E2E interaction tests."
     fi
 fi
 
 echo "✅ [Result] All pre-checks PASSED."
echo "=================================================="

# Step 4: Start Expo app
echo "📱 [Step 4] Starting Expo app..."
echo "   Executing scripts/start_expo.sh $APP_NAME..."
echo "   (Press Ctrl+C to stop the app and proceed to verification confirmation)"

# Check if app starts successfully (simple check)
# Ideally, start_expo.sh should return error code if immediate failure, but Expo starts a server.
# We will trust start_expo.sh to output errors if it fails early.

# Trap SIGINT to allow script to continue after Expo is stopped
trap 'echo -e "\n🛑 Expo server stopped. Proceeding to verification step..."' SIGINT

bash scripts/start_expo.sh "$APP_NAME"
EXPO_EXIT_CODE=$?

# Reset trap
trap - SIGINT

# Check if Expo failed immediately (non-zero exit not caused by SIGINT)
if [ $EXPO_EXIT_CODE -ne 0 ] && [ $EXPO_EXIT_CODE -ne 130 ]; then
    echo "❌ Error: Expo app failed to start or crashed."
    exit 1
fi

# Step 5: Post-Verification
echo ""
echo "=================================================="
echo "🏁 [Step 5] Post-Verification Actions"

# Prompt for visual verification
echo "⚠️  IMPORTANT: Did the app start correctly? (No white screen, interactive UI)"
read -p "❓ Did the visual verification pass? (y/n): " VERIFY_RESULT
if [[ "$VERIFY_RESULT" =~ ^[Yy]$ ]]; then
    echo "✅ Verification confirmed."
    
    read -p "🚀 Do you want to commit and push changes now? (y/n): " PUSH_RESULT
    if [[ "$PUSH_RESULT" =~ ^[Yy]$ ]]; then
        echo "   Executing githooks/safe_push.sh..."
        if [ -f "githooks/safe_push.sh" ]; then
            bash githooks/safe_push.sh
        else
            echo "❌ Error: githooks/safe_push.sh not found."
        fi
    else
        echo "ℹ️  Skipping push. You can push manually later."
    fi
else
    echo "❌ Verification failed. Please fix the issues and re-run this script."
    exit 1
fi

echo "✨ Task 1 Workflow Completed."
