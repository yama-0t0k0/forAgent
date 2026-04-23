# scripts/vet.sh
# Master E2E Script. Runs Security -> Seeding -> Golden Paths.

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.maestro/bin:$PATH"
export E2E_MODE="REAL"
export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"

echo "🚀 Starting IronClaw E2E Vet Pipeline..."

# 1. Security Rules
echo "🛡️ Running Security Rules Test..."
npm run test:security:report || { echo "❌ Security tests failed."; exit 1; }

# 2. Start Firebase Emulators
echo "🔥 Starting Firebase Emulators..."
lsof -ti:8080 -ti:9099 | xargs kill -9 2>/dev/null
npx firebase emulators:start --only firestore,auth > tests/logs/emulator.log 2>&1 &
EMULATOR_PID=$!
sleep 10

# 3. Boots simulator
echo "📱 Ensuring iOS Simulator is ready..."
BOOTED_DEVICE=$(xcrun simctl list devices | grep "Booted" | head -n 1 | sed -E 's/.*\(([-A-Z0-9]+)\).*/\1/')
if [ -z "$BOOTED_DEVICE" ]; then
    echo "⚠️ No booted simulator found. Attempting to boot 'iPhone 16'..."
    DEVICE_ID=$(xcrun simctl list devices available | grep "iPhone 16" | head -n 1 | sed -E 's/.*\(([-A-Z0-9]+)\).*/\1/')
    if [ -z "$DEVICE_ID" ]; then
        DEVICE_ID=$(xcrun simctl list devices available | grep "iPhone" | head -n 1 | sed -E 's/.*\(([-A-Z0-9]+)\).*/\1/')
    fi
    if [ -n "$DEVICE_ID" ]; then
        xcrun simctl boot "$DEVICE_ID"
        open -a Simulator
        sleep 10
    else
        echo "❌ No available iPhone simulator found."
        exit 1
    fi
fi

# We run applications one by one
APPS=("lp_app" "individual_user_app" "admin_app" "corporate_user_app")
PASSED_APPS=0
FAILED_APPS=0

TOTAL_START=$(date +%s)
mkdir -p tests/evidence

for APP in "${APPS[@]}"; do
    echo "⚙️ Configuring environment for $APP..."
    LOG_FILE="tests/logs/${APP}_vet.log"
    > "$LOG_FILE"
    
    # Check if a golden path test exists
    if [ ! -f "tests/golden_paths/${APP}_golden_path.yaml" ]; then
        echo "⚠️ No Golden Path file found for $APP. Skipping."
        continue
    fi
    
    # Start Expo
    ./scripts/start_expo.sh "$APP" >> "$LOG_FILE" 2>&1 &
    EXPO_PID=$!
    
    # Wait for Expo URL
    echo "⏳ Waiting for Expo Go Tunnel URL..."
    COUNT=0
    MAX_WAIT=180
    EXPO_URL=""
    while [ $COUNT -lt $MAX_WAIT ]; do
      if grep -q "exp://" "$LOG_FILE"; then
          EXPO_URL=$(grep -o "exp://[a-zA-Z0-9._:-]*" "$LOG_FILE" | tail -n 1)
          break
      fi
      if grep -qE "ERR_NGROK|Error:" "$LOG_FILE"; then
          echo "❌ Expo fatal error."
          break
      fi
      sleep 5
      COUNT=$((COUNT + 5))
    done
    
    if [ -z "$EXPO_URL" ]; then
        echo "❌ Timeout waiting for Expo URL for $APP"
        kill $EXPO_PID 2>/dev/null
        FAILED_APPS=$((FAILED_APPS + 1))
        continue
    fi
    
    echo "✅ Expo URL: $EXPO_URL"
    xcrun simctl openurl booted "$EXPO_URL"
    sleep 15
    
    # Seed Database & Run Maestro
    node tests/utils/capture_evidence.js before "$APP"
    node tests/utils/seed_e2e_users.js
    
    echo "🛠 Running Maestro..."
    maestro test -e EXPO_URL="$EXPO_URL" "tests/golden_paths/${APP}_golden_path.yaml"
    TEST_RESULT=$?
    
    node tests/utils/capture_evidence.js after "$APP"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo "✅ Validation Passed for $APP"
        PASSED_APPS=$((PASSED_APPS + 1))
    else
        echo "❌ Validation Failed for $APP"
        FAILED_APPS=$((FAILED_APPS + 1))
    fi
    
    kill $EXPO_PID 2>/dev/null
    sleep 2
done

kill $EMULATOR_PID 2>/dev/null

TOTAL_END=$(date +%s)
DURATION=$((TOTAL_END - TOTAL_START))
DURATION_FORMATTED="$(($DURATION / 60))m $(($DURATION % 60))s"
TOTAL_APPS=$((PASSED_APPS + FAILED_APPS))

STATUS="FAIL"
if [ "$FAILED_APPS" -eq 0 ] && [ "$TOTAL_APPS" -gt 0 ]; then
    STATUS="PASS"
fi

./tests/utils/generate_report.sh "vet_pipeline_all" "$TOTAL_APPS" "$PASSED_APPS" "$FAILED_APPS" "$DURATION_FORMATTED" "$STATUS"

echo "🎉 Vet Pipeline Completed. Status: $STATUS"
if [ "$STATUS" == "PASS" ]; then exit 0; else exit 1; fi
