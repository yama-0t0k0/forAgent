#!/bin/bash

# tests/utils/generate_report.sh
# Appends a test result summary to docs/E2E_TestResultReport.md

REPORT_FILE="docs/E2E_TestResultReport.md"
APP_NAME=$1
TOTAL_TESTS=$2
PASSED_TESTS=$3
FAILED_TESTS=$4
DURATION=$5
STATUS=$6

DATE=$(date "+%Y-%m-%d %H:%M")

# Calculate Success Rate
if [ "$TOTAL_TESTS" -gt 0 ]; then
  SUCCESS_RATE=$(( 100 * PASSED_TESTS / TOTAL_TESTS ))
else
  SUCCESS_RATE=0
fi

# Determine Status Icon
if [ "$STATUS" == "PASS" ]; then
  STATUS_ICON="🟢 **PASS**"
else
  STATUS_ICON="🔴 **FAIL**"
fi

# Generate Markdown Content
REPORT_CONTENT="
## 📅 実行概要 (Execution Summary: $DATE)

| 項目 | 内容 |
| :--- | :--- |
| **実行日** | $DATE |
| **対象アプリ** | $APP_NAME |
| **環境** | iOS Simulator (Local) |
| **最終結果** | $STATUS_ICON |

### 📊 ステータス詳細

| メトリクス | 結果 |
| :--- | :--- |
| **全シナリオ数** | $TOTAL_TESTS ケース |
| **成功 (Passed)** | ✅ $PASSED_TESTS |
| **失敗 (Failed)** | ❌ $FAILED_TESTS |
| **成功率** | **${SUCCESS_RATE}%** |
| **総実行時間** | $DURATION |

---
"

# Append to file
echo "$REPORT_CONTENT" >> "$REPORT_FILE"
echo "📄 Report updated: $REPORT_FILE"
