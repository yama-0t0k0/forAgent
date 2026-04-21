#!/bin/bash

# Configuration
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
# Podman rootless socket path (default for podman-machine-default)
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"

PROJECT_ROOT=$(pwd)
ORCHESTRATOR_PATH="$PROJECT_ROOT/.agent/orchestrator/pm_orchestrator.js"
WATCHDOG_PATH="$PROJECT_ROOT/scripts/agent_watchdog.js"
LOG_DIR="$PROJECT_ROOT/.agent/orchestrator"
DAEMON_LOG="$LOG_DIR/daemon.log"

echo "--------------------------------------------------"
echo "🚀 Starting Agent Development System..."
echo "--------------------------------------------------"

# Step 0: Ensure Container Runtime (Podman) is running
echo "Checking Container Runtime (Podman)..."
if [ -z "$(podman machine list --quiet)" ]; then
    echo "⚠️  Podman machine is not initialized. Please run 'podman machine init' manually."
    exit 1
fi

if [[ $(podman machine list --format "{{.LastUp}}") != *"Currently running"* ]]; then
    echo "⚠️  Podman machine is not running. Attempting to start..."
    podman machine start
    
    # Wait for Podman/Docker socket to be ready
    MAX_RETRIES=30
    COUNT=0
    while ! podman info >/dev/null 2>&1; do
        if [ $COUNT -ge $MAX_RETRIES ]; then
            echo "❌ Error: Podman failed to start within time limit."
            exit 1
        fi
        echo "Waiting for Podman... ($COUNT/$MAX_RETRIES)"
        sleep 2
        ((COUNT++))
    done
fi
echo "✅ Container Runtime (Podman Rootless) is READY."

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Step 1: Build the Hardened IronClaw Image
IMAGE_NAME="ironclaw-runtime"
echo "Building IronClaw Runtime image ($IMAGE_NAME)..."
/opt/homebrew/bin/podman build -t "$IMAGE_NAME" -f "$PROJECT_ROOT/Containerfile" "$PROJECT_ROOT"

# Step 2: Start the Orchestrator (in Podman)
echo "Starting PM Orchestrator in Podman..."
# 既存のコンテナがあれば停止・削除
/opt/homebrew/bin/podman stop ironclaw-active 2>/dev/null
/opt/homebrew/bin/podman rm ironclaw-active 2>/dev/null

# Determine Host IP for Ollama (macOS Podman fallback)
OLLAMA_URL="http://host.containers.internal:11434"

/opt/homebrew/bin/podman run -d \
    --name ironclaw-active \
    --env-file "$PROJECT_ROOT/.env" \
    --env OLLAMA_URL="$OLLAMA_URL" \
    -v "$PROJECT_ROOT:/app" \
    -v "$HOME/.gitconfig:/root/.gitconfig:ro" \
    -v "$HOME/.ssh:/root/.ssh:ro" \
    --add-host=host.containers.internal:host-gateway \
    "$IMAGE_NAME"

echo "✅ Orchestrator started in Podman (Container: ironclaw-active)"

# Step 3: Start the Watchdog (on Host - to monitor the volume-mapped log)
echo "Starting Agent Watchdog (Host)..."
pkill -f "node $WATCHDOG_PATH" 2>/dev/null
nohup node "$WATCHDOG_PATH" &
echo "✅ Watchdog started (PID: $!)"

echo "--------------------------------------------------"
echo "System is now RUNNING."
echo "- Main Log: $DAEMON_LOG"
echo "- Alerts: $LOG_DIR/alerts.log"
echo "- Status: $LOG_DIR/status.json"
echo "--------------------------------------------------"
echo "Tip: Use 'tail -f $DAEMON_LOG' to see activity."
