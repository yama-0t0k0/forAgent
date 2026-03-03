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
    "auth_portal")
        # 【共通認証基盤】全ユーザー(Admin/Corporate/Individual)が利用する共通ログイン画面
        # ※Expo起動のために便宜上 admin_app を実行コンテナとして利用しています
        APP_PATH="apps/admin_app/expo_frontend"
        PORT=8086
        ;;
    "lp_app")
    APP_PATH="apps/lp_app"
    PORT=8087
    EXTRA_FLAGS="$EXTRA_FLAGS --clear"
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

# Export PORT so it can be accessed by app.config.js
export PORT

# Check if directory exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Directory not found: $APP_PATH"
    exit 1
fi

# Function to check .env file and essential variables
check_env() {
    local app_dir="$1"
    local env_file="$app_dir/.env"

    echo "🔍 Checking environment configuration..."

    if [ ! -f "$env_file" ]; then
        echo "❌ Error: .env file not found in $app_dir"
        echo "   Please create .env file with necessary Firebase configuration."
        echo "   You can copy it from another working app or ask the administrator."
        exit 1
    fi

    # List of required variables
    REQUIRED_VARS=(
        "EXPO_PUBLIC_FIREBASE_API_KEY"
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
        "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
        "EXPO_PUBLIC_FIREBASE_APP_ID"
    )

    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "$var" "$env_file"; then
            MISSING_VARS+=("$var")
        fi
    done

    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        echo "❌ Error: Missing required environment variables in $env_file:"
        for var in "${MISSING_VARS[@]}"; do
            echo "   - $var"
        done
        echo "   Please ensure your .env file contains all valid Firebase configuration keys."
        exit 1
    fi
    
    echo "✅ Environment configuration verified."
}

# Run environment check
check_env "$APP_PATH"

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

# Add --web flag only for admin_app
EXTRA_FLAGS=""
if [ "$APP_NAME" == "admin_app" ]; then
    EXTRA_FLAGS="--web"
fi

# Ensure strict adherence to Commit 4332902 standards:
# Force a fresh start for Method A by removing stale settings.
# This ensures the new tunnel and settings.json are synchronized.
if [ -f "$APP_PATH/.expo/settings.json" ]; then
    rm "$APP_PATH/.expo/settings.json"
fi

# Inject EXPO_PUBLIC_APP_MODE into .env for the Expo bundler
# Expo reads EXPO_PUBLIC_* from .env files at bundle time
ENV_FILE="./.env"
INJECTED_MODE=""
if [ -n "$EXPO_PUBLIC_APP_MODE" ]; then
    export EXPO_PUBLIC_APP_MODE
    # Ensure .env file exists
    touch "$ENV_FILE"
    # Remove any existing EXPO_PUBLIC_APP_MODE line, then append
    grep -v "^EXPO_PUBLIC_APP_MODE=" "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
    echo "EXPO_PUBLIC_APP_MODE=$EXPO_PUBLIC_APP_MODE" >> "$ENV_FILE"
    INJECTED_MODE="true"
    echo "🔧 APP_MODE: $EXPO_PUBLIC_APP_MODE (injected into .env)"
    # Use --clear to force Metro to re-read env
    EXTRA_FLAGS="$EXTRA_FLAGS --clear"
fi

# Cleanup: remove injected mode from .env on exit
cleanup_env() {
    if [ "$INJECTED_MODE" = "true" ] && [ -f "$ENV_FILE" ]; then
        # Use a temporary file for cleanup to avoid sed -i issues across platforms
        grep -v "^EXPO_PUBLIC_APP_MODE=" "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null && mv "${ENV_FILE}.tmp" "$ENV_FILE"
        echo "🧹 Cleaned up .env (removed APP_MODE)"
    fi
}
trap cleanup_env EXIT

npx expo start --tunnel $EXTRA_FLAGS --port $PORT > /tmp/expo_${APP_NAME}.log 2>&1 &
EXPO_PID=$!

echo "⏳ Waiting for tunnel to establish..."
sleep 5 # Wait for process to stabilize

# 4. Extract URL
# Loop to check for URL via ngrok API or Log File
MAX_RETRIES=90
COUNT=0
URL=""
LOG_FILE="/tmp/expo_${APP_NAME}.log"

while [ $COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    
    # Method A: Deterministic Construction (Priority 1)
    # Check .expo/settings.json for urlRandomness
    # CRITICAL FIX: Only trust settings.json if the tunnel is actually ready (verified via logs)
    # This prevents returning a stale URL before the new tunnel is established.
    if [ -f "$LOG_FILE" ] && grep -q "Tunnel ready" "$LOG_FILE"; then
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
    fi

    # Method B: Ngrok API (Priority 2)
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
