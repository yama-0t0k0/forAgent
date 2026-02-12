#!/bin/bash

# スピーディな簡易テスト（smokeでのアプリ生存確認）専用（Sandbox可）
# tests/Easy_e2e.sh
export E2E_MODE="SANDBOX"
# Lightweight E2E Smoke Verification Suite for Expo Apps
# Usage: ./tests/Easy_e2e.sh <app_name>
# Supported apps: admin_app, individual_user_app

# Ensure Java is available (Maestro dependency)
export PATH="/usr/local/opt/openjdk/bin:$HOME/.maestro/bin:$PATH"
export JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"

APP_NAME=$1

# 0. Validate Arguments & Configuration
if [ -z "$APP_NAME" ]; then
  echo "❌ Error: App name argument is required."
  echo "Usage: ./tests/Easy_e2e.sh <app_name>"
  exit 1
fi

LOG_DIR="tests/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${APP_NAME}_easy_expo_output.log"

case $APP_NAME in
  admin_app)
    echo "⚙️  Configuring Smoke Tests for Admin App..."
    TEST_FILES=(
      "tests/jobs/smoke_check_errors.yaml"
      "tests/jobs/smoke_check_ui.yaml"
      "tests/jobs/smoke_test.yaml"
    )
    ;;
  individual_user_app)
    echo "⚙️  Configuring Smoke Tests for Individual User App..."
    TEST_FILES=(
      "tests/jobs/individual_smoke_test.yaml"
    )
    ;;
  *)
    echo "❌ Unknown app: $APP_NAME"
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

echo "🚀 Starting Easy E2E (Smoke) Suite for [$APP_NAME]..."
START_TIME=$(date +%s)
PASSED_TESTS=0
FAILED_TESTS=0

# 📦 Step 1: Bundle Integrity Check
echo "📦 Step 1: Checking Bundle Integrity (Static Analysis)..."
./tests/verify_bundle.sh
if [ $? -ne 0 ]; then
  echo "❌ Bundle verification failed. Aborting."
  exit 1
fi

# 🌐 Step 2: Start Expo Server
echo "🌐 Step 2: Starting Expo Server for $APP_NAME..."
> "$LOG_FILE" 
./scripts/start_expo.sh "$APP_NAME" >> "$LOG_FILE" 2>&1 &
EXPO_PID=$!

echo "⏳ Waiting for Expo Go Tunnel URL..."
COUNT=0
MAX_WAIT=180
while [ $COUNT -lt $MAX_WAIT ] && ! grep -q "exp://" "$LOG_FILE"; do
  if ! kill -0 $EXPO_PID 2>/dev/null; then
    echo "❌ Expo process died unexpectedly."
    exit 1
  fi
  sleep 5
  COUNT=$((COUNT + 5))
done

if ! grep -q "exp://" "$LOG_FILE"; then
  echo "❌ Expo server failed to provide a tunnel URL (timeout)."
  exit 1
fi

EXPO_URL=$(grep -o "exp://[a-zA-Z0-9._:-]*" "$LOG_FILE" | tail -n 1)
echo "✅ Expo Go URL detected: $EXPO_URL"

# 📱 Step 3: Device Readiness
echo "📱 Step 3: Ensuring Simulator is ready..."
if ! xcrun simctl list devices | grep -q "Booted"; then
    open -a Simulator
    sleep 10
fi

# 🔗 Step 4: Launch and Run Tests
echo "🔗 Step 4: Launching App & Running Tests..."
xcrun simctl openurl booted "$EXPO_URL"
sleep 15

if command -v maestro &> /dev/null; then
  for TEST_FILE in "${TEST_FILES[@]}"; do
    echo "🛠 Running Smoke Test: $TEST_FILE"
    maestro test -e EXPO_URL="$EXPO_URL" "$TEST_FILE"
    TEST_EXIT=$?
    
    if [ $TEST_EXIT -ne 0 ]; then
      echo "❌ Smoke Test failed: $TEST_FILE"
      FAILED_TESTS=$((FAILED_TESTS + 1))
      exit 1
    fi
    echo "✅ Smoke Test passed: $TEST_FILE"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  done

  echo "🎉 ALL SMOKE TESTS PASSED for $APP_NAME!"
  exit 0
else
  echo "⚠️ 'maestro' not found."
  exit 1
fi
