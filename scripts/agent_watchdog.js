const fs = require('fs');
const path = require('path');
const readline = require('readline');

// パス設定
const LOG_FILE = path.resolve(__dirname, '../.agent/orchestrator/daemon.log');
const ALERT_LOG = path.resolve(__dirname, '../.agent/orchestrator/alerts.log');

// ANSIカラー定数
const RED = '\x1b[1;31m';
const YELLOW = '\x1b[1;33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

console.log(`${BOLD}🚀 Agent Watchdog started. Monitoring: ${LOG_FILE}${RESET}`);

// アラートパターンの定義
const PATTERNS = [
  { regex: /iteration limit reached/i, label: 'LOOP DETECTED', color: RED },
  { regex: /Timeout/i, label: 'TIMEOUT', color: YELLOW },
  { regex: /ResponseError/i, label: 'LLM ERROR (NO CONTENT)', color: RED },
  { regex: /API error/i, label: 'API ERROR', color: RED }
];

function logAlert(label, message) {
  const ts = new Date().toISOString();
  const alert = `[${ts}] [${label}] ${message}`;
  
  // ターミナル出力 (目立つように)
  console.log(`\n${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${RED}${BOLD}‼ ALERT: ${label}${RESET}`);
  console.log(`${alert}`);
  console.log(`${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

  // ファイル記録
  try {
    fs.appendFileSync(ALERT_LOG, alert + '\n');
  } catch (e) {
    console.error(`Failed to write to alerts.log: ${e.message}`);
  }
}

// 既存のログの末尾から監視を開始
let fileSize = 0;
try {
  fileSize = fs.statSync(LOG_FILE).size;
} catch (e) {
  // ファイルがない場合は作成
  fs.writeFileSync(LOG_FILE, '');
}

// ファイルの変更を監視
fs.watch(LOG_FILE, (event) => {
  if (event === 'change') {
    const newSize = fs.statSync(LOG_FILE).size;
    if (newSize > fileSize) {
      const stream = fs.createReadStream(LOG_FILE, { start: fileSize, end: newSize });
      const rl = readline.createInterface({ input: stream });

      rl.on('line', (line) => {
        for (const pattern of PATTERNS) {
          if (pattern.regex.test(line)) {
            logAlert(pattern.label, line);
          }
        }
      });

      fileSize = newSize;
    } else if (newSize < fileSize) {
      // ログのローテーションやクリアに対応
      fileSize = newSize;
    }
  }
});
