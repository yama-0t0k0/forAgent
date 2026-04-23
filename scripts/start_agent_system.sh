#!/bin/bash

# IronClaw Autonomous Core — System Startup Script (v3)
#
# v3: ホスト上で直接実行する方式に移行。
# コンテナはセキュリティ隔離（将来のエージェント実行）用途に限定。
# オーケストレーター自体はホスト上の Node.js で稼働し、
# Ollama への通信は localhost 直結で安定性を確保。

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PROJECT_ROOT=$(pwd)
ORCHESTRATOR_PATH="$PROJECT_ROOT/.agent/orchestrator/pm_orchestrator.js"
WATCHDOG_PATH="$PROJECT_ROOT/scripts/agent_watchdog.js"
LOG_DIR="$PROJECT_ROOT/.agent/orchestrator"
DAEMON_LOG="$LOG_DIR/daemon.log"
IRONCLAW_BINARY="$PROJECT_ROOT/shared/ironclaw_core/target/release/ironclaw_core"

echo "--------------------------------------------------"
echo "🚀 Starting IronClaw Autonomous Core v3..."
echo "--------------------------------------------------"

# Step 0: 前回のプロセスをクリーンアップ
pkill -f "node $ORCHESTRATOR_PATH" 2>/dev/null
pkill -f "node $WATCHDOG_PATH" 2>/dev/null

# Step 1: Ollama ヘルスチェック
echo "Checking Ollama..."
if ! curl -sf http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama が起動していません。"
    echo "   → 'ollama serve' を実行してから再試行してください。"
    exit 1
fi
echo "✅ Ollama is READY."

# Step 2: IronClaw Safety Guard バイナリ確認
if [ -f "$IRONCLAW_BINARY" ]; then
    echo "✅ IronClaw Safety Guard: $IRONCLAW_BINARY"
else
    echo "⚠️  IronClaw バイナリ未検出。ビルドします..."
    (cd "$PROJECT_ROOT/shared/ironclaw_core" && cargo build --release)
    if [ $? -ne 0 ]; then
        echo "❌ IronClaw ビルド失敗"
        exit 1
    fi
    echo "✅ IronClaw Safety Guard ビルド完了"
fi

# Step 3: ログディレクトリ確保
mkdir -p "$LOG_DIR"

# Step 4: オーケストレーターをホスト上で起動（バックグラウンド）
echo "Starting PM Orchestrator (Host)..."

# .env から GITHUB_TOKEN を読み込み（存在すれば）
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep GITHUB_TOKEN | xargs)
fi

nohup node "$ORCHESTRATOR_PATH" >> /dev/null 2>&1 &
ORCH_PID=$!
echo "✅ Orchestrator started (PID: $ORCH_PID)"

# Step 5: Watchdog をホスト上で起動
echo "Starting Agent Watchdog (Host)..."
nohup node "$WATCHDOG_PATH" >> /dev/null 2>&1 &
echo "✅ Watchdog started (PID: $!)"

echo "--------------------------------------------------"
echo "System is now RUNNING (Host-native mode)."
echo "- Main Log: $DAEMON_LOG"
echo "- Alerts: $LOG_DIR/alerts.log"
echo "- Status: $LOG_DIR/status.json"
echo "--------------------------------------------------"
echo "Tip: Use 'tail -f $DAEMON_LOG' to see activity."
echo "     Use 'kill $ORCH_PID' to stop."
