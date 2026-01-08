#!/bin/bash

# scripts/start_expo.sh
# Usage: ./scripts/start_expo.sh <app_name>
# Supported apps: admin_app, individual_user_app, corporate_user_app, job_description, fmjs

APP_NAME=$1

# 1. Map App Names to Paths & Ports
case $APP_NAME in
    "admin_app")
        APP_PATH="apps/admin_app/expo_frontend"
        PORT=8081
        ;;
    "individual_user_app")
        APP_PATH="apps/individual_user_app/expo_frontend"
        PORT=8082
        ;;
    "corporate_user_app")
        APP_PATH="apps/corporate_user_app/expo_frontend"
        PORT=8083
        ;;
    "job_description")
        APP_PATH="apps/job_description/expo_frontend"
        PORT=8084
        ;;
    "fmjs")
        APP_PATH="apps/fmjs/expo_frontend"
        PORT=8085
        ;;
    "shared")
        echo "❌ 'shared' is a library module and cannot be run directly."
        exit 1
        ;;
    *)
        echo "❌ Unknown app name: $APP_NAME"
        echo "Usage: ./scripts/start_expo.sh <app_name>"
        echo "Available apps: admin_app, individual_user_app, corporate_user_app, job_description, fmjs"
        exit 1
        ;;
esac

echo "🚀 Starting $APP_NAME on port $PORT..."
echo "📂 Directory: $APP_PATH"

# Check if directory exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Directory not found: $APP_PATH"
    exit 1
fi

# 2. Process Cleanup
echo "🧹 Cleaning up existing processes..."

# Kill process on the target port
PID=$(lsof -t -i:$PORT)
if [ -n "$PID" ]; then
    echo "⚠️  Killing process $PID on port $PORT"
    kill -9 $PID
fi

# Kill any stray ngrok processes to allow new tunnel creation
# Note: Be careful if running multiple tunnels simultaneously. 
# For now, we assume one active dev session or compatible ngrok instances.
# If simultaneous runs are blocked by ngrok free tier limiting, cleanup is safer.
pkill -f ngrok || true

# 3. Start Expo
echo "⚡ Starting Expo Server (Tunnel Mode)..."

# Ensure Monorepo Workspace resolution is enabled
export EXPO_USE_METRO_WORKSPACE=1

cd "$APP_PATH"

# Avoid EPERM errors by using local cache and fake HOME
mkdir -p .cache
mkdir -p .home
export XDG_CACHE_HOME="$(pwd)/.cache"
export HOME="$(pwd)/.home"

# Run in background to allow script to query ngrok API
# CI=1 is used to force non-interactive mode, but we need to ensure it doesn't suppress URL generation.
# Based on previous attempts, standard non-interactive might hide the QR. 
# We will rely on ngrok API for the URL.
npx expo start --tunnel --port $PORT > /tmp/expo_${APP_NAME}.log 2>&1 &
EXPO_PID=$!

echo "⏳ Waiting for tunnel to establish..."

# 4. Extract URL
# Loop to check for URL via ngrok API or Log File
MAX_RETRIES=30
COUNT=0
URL=""
LOG_FILE="/tmp/expo_${APP_NAME}.log"

while [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    
    # Method A: Deterministic Construction (Most Reliable for Anonymous Tunnel)
    # Check .expo/settings.json for urlRandomness
    SETTINGS_FILE=".expo/settings.json"
    if [ -f "$SETTINGS_FILE" ]; then
        # Extract randomness (e.g. "J7gLLTA")
        RANDOMNESS=$(grep -o '"urlRandomness":[[:space:]]*"[^"]*"' "$SETTINGS_FILE" | cut -d'"' -f4)
        if [ -n "$RANDOMNESS" ]; then
            # Convert to lowercase
            RANDOMNESS_LOWER=$(echo "$RANDOMNESS" | tr '[:upper:]' '[:lower:]')
            # Construct URL
            URL="exp://${RANDOMNESS_LOWER}-anonymous-${PORT}.exp.direct"
            break
        fi
    fi

    # Method B: Ngrok API (Fallback)
    # Check default ngrok port 4040, then 4041
    TUNNELS_JSON=$(curl -s --max-time 1 http://localhost:4040/api/tunnels || true)
    URL=$(echo "$TUNNELS_JSON" | grep -o 'exp://[^"]*')
    
    if [ -n "$URL" ]; then
        break
    fi

    TUNNELS_JSON_ALT=$(curl -s --max-time 1 http://localhost:4041/api/tunnels || true)
    URL=$(echo "$TUNNELS_JSON_ALT" | grep -o 'exp://[^"]*')

    if [ -n "$URL" ]; then
        break
    fi

    # Method C: Log Parsing
    # Sometimes CI=1 suppresses it, but just in case
    if [ -f "$LOG_FILE" ]; then
        URL=$(grep -o "exp://[a-zA-Z0-9\.\-]*" "$LOG_FILE" | head -n 1)
        if [ -n "$URL" ]; then
            break
        fi
    fi
    
    echo -n "."
    COUNT=$((COUNT+1))
done

echo ""

if [ -n "$URL" ]; then
    echo "=================================================="
    echo "✅ Start up successful."
    echo "Here is the URL for Expo Go:"
    echo ""
    echo "   $URL"
    echo ""
    echo "You can enter this URL manually in the Expo Go app."
    echo "=================================================="
    
    # Wait for the Expo process to finish (keep script running)
    echo "Press [CTRL+C] to stop the server."
    wait $EXPO_PID
else
    echo "❌ Failed to retrieve Expo URL. Check logs at $LOG_FILE"
    # Kill the background process since it failed to produce a URL
    kill $EXPO_PID
    exit 1
fi
