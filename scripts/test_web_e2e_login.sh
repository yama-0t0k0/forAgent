#!/bin/bash
# scripts/test_web_e2e_login.sh
# LPアプリから各アプリへのリダイレクトを検証するためのマルチアプリ起動スクリプト

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.maestro/bin:$PATH"

echo "🚀 Starting Multi-App E2E Test Setup (LP + Admin + Individual + Corporate)..."

# 1. ポートのクリーンアップ
kill_port() {
    lsof -ti:$1 | xargs kill -9 2>/dev/null
}

echo "🧹 Cleaning up ports 8087, 8081, 8082, 8083..."
kill_port 8087
kill_port 8081
kill_port 8082
kill_port 8083

# 起動待機関数
wait_for_port() {
    local PORT=$1
    local MAX_WAIT=120
    local COUNTER=0
    echo "⏳ Waiting for port $PORT..."
    while ! curl -s "http://localhost:$PORT" > /dev/null; do
        sleep 1
        COUNTER=$((COUNTER + 1))
        if [ $COUNTER -ge $MAX_WAIT ]; then
            echo "❌ Timeout waiting for port $PORT"
            return 1
        fi
    done
    echo "✅ Port $PORT is up!"
    return 0
}

# 2. LPアプリの起動
echo "⚡ Starting LP App on 8087..."
cd apps/lp_app || exit 1
npx expo start --web --port 8087 --clear > ../../lp_app.log 2>&1 &
LP_PID=$!
cd - > /dev/null
wait_for_port 8087 || exit 1

# 3. Adminアプリの起動
echo "⚡ Starting Admin App on 8081..."
cd apps/admin_app/expo_frontend || exit 1
export EXPO_PUBLIC_E2E_SKIP_AUTH=true
npx expo start --web --port 8081 --clear > ../../../admin_app.log 2>&1 &
ADMIN_PID=$!
cd - > /dev/null
wait_for_port 8081 || exit 1

# 4. Individualアプリの起動
echo "⚡ Starting Individual App on 8082..."
cd apps/individual_user_app/expo_frontend || exit 1
export EXPO_PUBLIC_E2E_SKIP_AUTH=true
npx expo start --web --port 8082 --clear > ../../../individual_app.log 2>&1 &
INDIVIDUAL_PID=$!
cd - > /dev/null
wait_for_port 8082 || exit 1

# 5. Corporateアプリの起動
echo "⚡ Starting Corporate App on 8083..."
cd apps/corporate_user_app/expo_frontend || exit 1
export EXPO_PUBLIC_E2E_SKIP_AUTH=true
npx expo start --web --port 8083 --clear > ../../../corporate_app.log 2>&1 &
CORPORATE_PID=$!
cd - > /dev/null
wait_for_port 8083 || exit 1

echo "✅ All apps are up! Running Playwright tests..."

# 6. エビデンス用タイムスタンプ
# 命名規則 YYYYMMDD_HHmmss を守る
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
export PLAYWRIGHT_EVIDENCE_TIMESTAMP=$TIMESTAMP
LOG_FILE="tests/evidence/lp_login_redirect_web_${TIMESTAMP}_playwright.log"

# 7. テスト実行
npx playwright test "tests/e2e_web/lp_login_redirect.spec.ts" --workers=1 2>&1 | tee "$LOG_FILE"
TEST_RESULT=${PIPESTATUS[0]}

# 8. 報告書の生成 (成功時のみ)
if [ $TEST_RESULT -eq 0 ]; then
    echo "📊 Generating test report..."
    node tests/utils/generate_report.js "$TIMESTAMP"
fi

# 8. クリーンアップ
echo "🛑 Stopping Expo Servers..."
kill $LP_PID $ADMIN_PID $INDIVIDUAL_PID $CORPORATE_PID 2>/dev/null

# 9. ローテーション
echo "🧹 Rotating old evidence and reports..."
mkdir -p tests/reports
node tests/utils/rotate_files.js tests/evidence "lp_app_web_" 5
node tests/utils/rotate_files.js tests/reports "TestReport_TC" 5

exit $TEST_RESULT
