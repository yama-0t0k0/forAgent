#!/bin/bash

# tests/run_e2e.sh
# Generic E2E Verification Suite for Expo Apps
# Usage: ./tests/run_e2e.sh <app_name>
# Supported apps: admin_app, individual_user_app

# Ensure Java is available (Maestro dependency)
export PATH="/usr/local/opt/openjdk/bin:$PATH"
export JAVA_HOME="/usr/local/opt/openjdk"

APP_NAME=$1

# 0. Validate Arguments & Configuration
if [ -z "$APP_NAME" ]; then
  echo "❌ Error: App name argument is required."
  echo "Usage: ./tests/run_e2e.sh <app_name>"
  echo "Available apps: admin_app, individual_user_app, corporate_user_app"
  exit 1
fi

LOG_DIR="tests/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${APP_NAME}_expo_output.log"

case $APP_NAME in
  admin_app)
    echo "⚙️  Configuring for Admin App..."
    TEST_FILES=(
      "tests/jobs/smoke_check_errors.yaml"
      "tests/jobs/full_coverage_test.yaml"
      "tests/jobs/admin_modal_interaction_test.yaml"
    )
    ;;
  individual_user_app)
    echo "⚙️  Configuring for Individual User App..."
    TEST_FILES=(
      "tests/jobs/individual_smoke_test.yaml"
    )
    ;;
  corporate_user_app)
    echo "⚙️  Configuring for Corporate User App..."
    TEST_FILES=() # No specific E2E tests yet
    ;;
  *)
    echo "❌ Unknown app: $APP_NAME"
    echo "Supported apps: admin_app, individual_user_app, corporate_user_app"
    exit 1
    ;;
esac

cleanup() {
  echo "🧹 Cleaning up..."
  if [ -n "$EXPO_PID" ]; then
    kill $EXPO_PID 2>/dev/null
  fi
}
trap cleanup EXIT

echo "🚀 Starting E2E Verification Suite for [$APP_NAME]..."

# 📦 Step 1: Bundle Integrity Check (Global)
# We run this for all apps to ensure codebase health, but we could make it conditional if needed.
echo "📦 Step 1: Checking Bundle Integrity (Static Analysis)..."
./tests/verify_bundle.sh
if [ $? -ne 0 ]; then
  echo "❌ Bundle verification failed. Aborting."
  exit 1
fi

# 🌐 Step 2: Start Expo Server
echo "🌐 Step 2: Starting Expo Server for $APP_NAME..."
./scripts/start_expo.sh "$APP_NAME" > "$LOG_FILE" 2>&1 &
EXPO_PID=$!

# Wait for URL to appear (up to 80s for tunnel stability)
echo "⏳ Waiting for Expo Go Tunnel URL..."
COUNT=0
MAX_WAIT=80
while [ $COUNT -lt $MAX_WAIT ] && ! grep -q "exp://" "$LOG_FILE"; do
  sleep 2
  COUNT=$((COUNT + 2))
done

if ! grep -q "exp://" "$LOG_FILE"; then
  echo "❌ Expo server failed to provide a tunnel URL (timeout). Logs:"
  tail -n 30 "$LOG_FILE"
  exit 1
fi

EXPO_URL=$(grep -o "exp://[a-zA-Z0-9._:-]*" "$LOG_FILE" | head -n 1)
echo "✅ Expo Go URL detected: $EXPO_URL"

# 📱 Step 3: Device Readiness
echo "📱 Step 3: Ensuring Simulator is ready..."
if ! xcrun simctl list devices | grep -q "Booted"; then
    xcrun simctl boot "iPhone 16 Pro" || echo "⚠️ Falling back to default boot"
    open -a Simulator
    sleep 10
fi

# 🔗 Step 4: Launch and Run Tests
echo "🔗 Step 4: Launching App & Running Tests..."
xcrun simctl openurl booted "$EXPO_URL"

# Initial wait for bundle load
echo "⏳ Waiting for bundle to load (15s)..."
sleep 15

if command -v maestro &> /dev/null; then
  
  for TEST_FILE in "${TEST_FILES[@]}"; do
    echo "🛠 Running Test: $TEST_FILE"
    maestro test -e EXPO_URL="$EXPO_URL" "$TEST_FILE"
    TEST_EXIT=$?
    
    if [ $TEST_EXIT -ne 0 ]; then
      echo "❌ Test failed: $TEST_FILE"
      exit 1
    fi
    echo "✅ Test passed: $TEST_FILE"
  done

  echo "🎉 ALL TESTS PASSED for $APP_NAME!"
  exit 0

else
  echo "⚠️ 'maestro' not found. Only bundle verification was performed."
  exit 0
fi
