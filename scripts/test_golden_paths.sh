#!/bin/bash
# scripts/test_golden_paths.sh
# 立ち上がっている環境に対してMaestroを叩く軽量スクリプト

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.maestro/bin:$PATH"
APP=$1
EXPO_URL=$2

if [ -z "$APP" ] || [ -z "$EXPO_URL" ]; then
    echo "Usage: ./scripts/test_golden_paths.sh <app_name> <expo_url>"
    exit 1
fi

GOLDEN_PATH="tests/golden_paths/${APP}_golden_path.yaml"

if [ ! -f "$GOLDEN_PATH" ]; then
    echo "❌ Golden Path test not found: $GOLDEN_PATH"
    exit 1
fi

echo "📸 Capturing BEFORE state..."
node tests/utils/capture_evidence.js before "$APP"

echo "🌱 Seeding data..."
node tests/utils/seed_e2e_users.js

echo "🛠 Running Maestro test ($GOLDEN_PATH) on $EXPO_URL..."
LOG_FILE="tests/evidence/maestro_${APP}.log"
maestro test -e EXPO_URL="$EXPO_URL" "$GOLDEN_PATH" > "$LOG_FILE" 2>&1
TEST_RESULT=$?
cat "$LOG_FILE"  # Still show output in console

echo "📸 Capturing AFTER state and Evidence..."
node tests/utils/capture_evidence.js after "$APP" "$TEST_RESULT"

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Golden Path Execution Successful!"
    exit 0
else
    echo "❌ Golden Path Execution Failed!"
    exit 1
fi
