#!/bin/bash

# run_e2e.sh
# 1. Verifies bundle integrity for multiple apps
# 2. Starts Expo server with tunnel health checks
# 3. Runs Maestro Runtime Sanity Check (Render Errors, module resolution)
# 4. Runs Full Coverage Maestro Tests

cleanup() {
  echo "🧹 Cleaning up..."
  kill $EXPO_PID 2>/dev/null
}
trap cleanup EXIT

# Set up local Maestro environment
# export MAESTRO_DIR="$(pwd)/.maestro_local"
# export PATH="/usr/local/opt/openjdk/bin:$MAESTRO_DIR/bin:$PATH"

echo "🚀 Starting Enhanced E2E Verification Suite..."

# 📦 Step 1: Bundle Integrity Check
echo "📦 Step 1: Checking Bundle Integrity (Static Analysis)..."
./tests/verify_bundle.sh
if [ $? -ne 0 ]; then
  echo "❌ Bundle verification failed. Aborting."
  exit 1
fi

# 🌐 Step 2: Start Expo Server
echo "🌐 Step 2: Starting Expo Server..."
./scripts/start_expo.sh admin_app > expo_output.log 2>&1 &
EXPO_PID=$!

# Wait for URL to appear (up to 80s for tunnel stability)
echo "⏳ Waiting for Expo Go Tunnel URL..."
COUNT=0
MAX_WAIT=80
while [ $COUNT -lt $MAX_WAIT ] && ! grep -q "exp://" expo_output.log; do
  sleep 2
  COUNT=$((COUNT + 2))
done

if ! grep -q "exp://" expo_output.log; then
  echo "❌ Expo server failed to provide a tunnel URL (timeout). Logs:"
  tail -n 30 expo_output.log
  exit 1
fi

EXPO_URL=$(grep -o "exp://[a-zA-Z0-9.-]*" expo_output.log | head -n 1)
echo "✅ Expo Go URL detected: $EXPO_URL"

# 📱 Step 3: Device Readiness
echo "📱 Step 3: Ensuring Simulator is ready..."
if ! xcrun simctl list devices | grep -q "Booted"; then
    xcrun simctl boot "iPhone 16 Pro" || echo "⚠️ Falling back to default boot"
    open -a Simulator
    sleep 10
fi

# 🔗 Step 4: Launch and Initial Sanity Check
echo "🔗 Step 4: Launching App & Checking for Runtime Errors (Rendering/Module Resolution)..."
xcrun simctl openurl booted "$EXPO_URL"
sleep 60 # Wait for bundle to fully load and render

if command -v maestro &> /dev/null; then
  # 🤖 4a: Runtime Sanity Check
  echo "🛠 Running Smoke Check for Render Errors/Module Resolution..."
  maestro test -e EXPO_URL="$EXPO_URL" tests/jobs/smoke_check_errors.yaml
  if [ $? -ne 0 ]; then
    echo "❌ CRITICAL: App launched but detected Render Error or 'Unable to resolve module' at runtime."
    exit 1
  fi
  echo "✅ Runtime sanity check passed!"

  # 🚀 4b: Full Coverage Test
  echo "🚀 Running Full Coverage Tests..."
  maestro test -e EXPO_URL="$EXPO_URL" tests/jobs/full_coverage_test.yaml
  MAESTRO_EXIT=$?
  
  if [ $MAESTRO_EXIT -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    exit 0
  else
    echo "❌ E2E regression detected. Check Maestro artifacts."
    exit 1
  fi
else
  echo "⚠️ 'maestro' not found. Only bundle verification was performed."
  exit 0
fi
