#!/bin/bash
# scripts/test_env_up.sh
# ゼロから環境を立ち上げるスクリプト

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.maestro/bin:$PATH"
echo "🚀 Starting Test Environment Setup..."

export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"

echo "📱 Ensuring iOS Simulator is ready..."
BOOTED_DEVICE=$(xcrun simctl list devices | grep "Booted" | head -n 1 | sed -E 's/.*\(([-A-Z0-9]+)\).*/\1/')
if [ -z "$BOOTED_DEVICE" ]; then
    echo "⚠️ No booted simulator found. Attempting to boot an available iPhone..."
    DEVICE_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | sed -E 's/.*\(([-A-Z0-9]+)\).*/\1/')
    if [ -n "$DEVICE_ID" ]; then
        xcrun simctl boot "$DEVICE_ID"
        open -a Simulator
        sleep 10
    else
        echo "❌ No available iPhone simulator found."
    fi
fi

echo "🔥 Starting Firebase Emulators in background..."
lsof -ti:8080 -ti:9099 | xargs kill -9 2>/dev/null
npx firebase emulators:start --only firestore,auth > tests/logs/emulator.log 2>&1 &
EMULATOR_PID=$!
sleep 10

echo "✅ Test Environment is UP. Emulators running on PID: $EMULATOR_PID"
echo "You can now run 'bash scripts/start_expo.sh <app_name>' manually, and then './scripts/test_golden_paths.sh <app_name> <expo_url>'"
