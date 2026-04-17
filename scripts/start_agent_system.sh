#!/bin/bash

# Configuration
export PATH="/usr/local/bin:$PATH"
PROJECT_ROOT=$(pwd)
ORCHESTRATOR_PATH="$PROJECT_ROOT/.agent/orchestrator/pm_orchestrator.js"
WATCHDOG_PATH="$PROJECT_ROOT/scripts/agent_watchdog.js"
LOG_DIR="$PROJECT_ROOT/.agent/orchestrator"
DAEMON_LOG="$LOG_DIR/daemon.log"

echo "--------------------------------------------------"
echo "🚀 Starting Agent Development System..."
echo "--------------------------------------------------"

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
