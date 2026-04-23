#!/bin/bash
# scripts/test_web_e2e.sh
# Web版 E2E テスト (Playwright) 実行用スクリプト

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.maestro/bin:$PATH"

APP=$1


if [ -z "$APP" ]; then
    echo "Usage: ./scripts/test_web_e2e.sh <app_name>"
    exit 1
fi

echo "🚀 Setting up Web E2E Test for $APP..."

# 1. 対象アプリの実行パスとポートを解決
APP_DIR=""
PORT=""

case $APP in
    "admin_app")
        APP_DIR="apps/admin_app/expo_frontend"
        PORT=8081
        ;;
    "individual_user_app")
        APP_DIR="apps/individual_user_app/expo_frontend"
        PORT=8082
        ;;
    "corporate_user_app")
        APP_DIR="apps/corporate_user_app/expo_frontend"
        PORT=8083
        ;;
    "job_description")
        APP_DIR="apps/job_description/expo_frontend"
        PORT=8084
        ;;
    "fmjs")
        APP_DIR="apps/fmjs/expo_frontend"
        PORT=8085
        ;;
    "auth_portal")
        APP_DIR="apps/admin_app/expo_frontend"
        PORT=8086
        ;;
    "lp_app")
        APP_DIR="apps/lp_app"
        PORT=8087
        ;;
    *)
        echo "❌ Unknown app: $APP"
        exit 1
        ;;
esac

export PLAYWRIGHT_BASE_URL="http://localhost:$PORT"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ App directory not found: $APP_DIR"
    exit 1
fi

# 2. 既存の Expo プロセスを掃除
echo "🧹 Cleaning up existing Expo processes on port $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null

# 3. バックグラウンドで Expo の Web モードを起動
echo "⚡ Starting Expo Web mode for $APP..."
cd "$APP_DIR" || exit 1
# Clearing clear before start can prevent cache issues
npx expo start --web --port $PORT --clear > /dev/null 2>&1 &
EXPO_PID=$!
cd - > /dev/null

# 4. ポートのオープン待機（最大30秒）
echo "⏳ Waiting for Expo Web Server to be ready on http://localhost:$PORT..."
MAX_WAIT=30
WAIT_COUNTER=0
while ! curl -s "http://localhost:$PORT" > /dev/null; do
    sleep 1
    WAIT_COUNTER=$((WAIT_COUNTER + 1))
    if [ $WAIT_COUNTER -ge $MAX_WAIT ]; then
        echo "❌ Timeout waiting for Expo Web Server"
        kill $EXPO_PID 2>/dev/null
        exit 1
    fi
done

echo "✅ Expo Web Server is up! Running Playwright tests..."

# 5. エビデンス用タイムスタンプ生成 (YYYYMMDD_HHmmss)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
export PLAYWRIGHT_EVIDENCE_TIMESTAMP=$TIMESTAMP

LOG_FILE="tests/evidence/${APP}_web_${TIMESTAMP}_playwright.log"

# 特定のアプリ向けのテストを実行し、ログを保存しつつターミナルにも出力
npx playwright test "tests/e2e_web/${APP}.spec.ts" 2>&1 | tee "$LOG_FILE"
TEST_RESULT=${PIPESTATUS[0]}

# 6. クリーンアップ
echo "🛑 Stopping Expo Web Server (PID: $EXPO_PID)..."
kill $EXPO_PID 2>/dev/null

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Web E2E ($APP) Execution Successful!"
else
    echo "❌ Web E2E ($APP) Execution Failed!"
fi

# 7. エビデンスと報告書のローテーション (最新5件)
echo "🧹 Rotating old evidence and reports..."
mkdir -p tests/reports
node tests/utils/rotate_files.js tests/evidence "${APP}_web_" 5
node tests/utils/rotate_files.js tests/reports "TestReport_TC" 5

exit $TEST_RESULT
