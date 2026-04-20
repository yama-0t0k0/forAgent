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

# Step 1: Start the Orchestrator (in background)
echo "Starting PM Orchestrator..."
# 既存のプロセスがあれば停止（簡易版）
pkill -f "node $ORCHESTRATOR_PATH" 2>/dev/null
nohup node "$ORCHESTRATOR_PATH" >> "$DAEMON_LOG" 2>&1 &
echo "✅ Orchestrator started (PID: $!)"

# Step 2: Start the Watchdog (in background to provide terminal alerts)
echo "Starting Agent Watchdog..."
pkill -f "node $WATCHDOG_PATH" 2>/dev/null
# Watchdogはターミナルに直接出力させたいので、バックグラウンドにするがstdoutは維持
nohup node "$WATCHDOG_PATH" &
echo "✅ Watchdog started (PID: $!)"

echo "--------------------------------------------------"
echo "System is now RUNNING."
echo "- Main Log: $DAEMON_LOG"
echo "- Alerts: $LOG_DIR/alerts.log"
echo "- Status: $LOG_DIR/status.json"
echo "--------------------------------------------------"
echo "Tip: Use 'tail -f $DAEMON_LOG' to see activity."
