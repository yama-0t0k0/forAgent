const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PM Agent Orchestrator (Resident Daemon) - DAG Engine v2
 *
 * 役割：
 * pm_agent が定義した「タスクのJSONグラフ（DAG）」をパースし、
 * 各専門家エージェント（IronClaw経由）を依存順序に従って起動する。
 * 前タスクの出力を次のタスクの入力（システムプロンプト）に注入し、「バケツリレー」を実現する。
 *
 * v2 変更点:
 * - 進捗ダッシュボード（status.json）によるリアルタイム可視化
 * - エージェント名ホワイトリストによるDAG正規化
 * - IronClawシングルインスタンス制約への対応（逐次実行）
 * - 処理済みIssueの重複処理防止
 */

const POLLING_INTERVAL_MS = 60000;
const LABEL_TO_WATCH = 'ready-for-agent';
const STATUS_FILE = path.resolve(__dirname, 'status.json');
const LOG_FILE = path.resolve(__dirname, 'daemon.log');

// 実在するエージェント名のホワイトリスト
const VALID_AGENTS = [
  'platform_shared', 'apps_expert', 'enabling_quality',
  'platform_infra', 'complex_logic', 'tech_concierge', 'pm_agent'
];

// 処理済みIssue番号を追跡（再起動でリセット）
const processedIssues = new Set();

// ---- ログ & ステータス管理 (ANSIカラー対応) ----

const COLORS = {
  INFO: '\x1b[36m',    // Cyan
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  SUCCESS: '\x1b[32m', // Green
  STATUS: '\x1b[35m',  // Magenta (Status updates)
  IRONCLAW: '\x1b[34m',// Blue
  RESET: '\x1b[0m'
};

function log(level, message) {
  const ts = new Date().toISOString();
  const color = COLORS[level] || COLORS.RESET;
  const line = `[${ts}] [${level}] ${message}`;
  console.log(`${color}${line}${COLORS.RESET}`);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) { /* ignore */ }
}

function updateStatus(issueNumber, phase, detail, progress) {
  const status = {
    updatedAt: new Date().toISOString(),
    issueNumber,
    phase,
    detail,
    progress, // e.g. "2/3"
    log: LOG_FILE
  };
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (_) { /* ignore */ }
  log('STATUS', `Issue #${issueNumber} | ${phase} | ${detail} | ${progress}`);
}

// ---- デーモン本体 ----

async function startDaemon() {
  log('INFO', '🚀 PM Orchestrator DAG Engine v2 started. Polling every 60s...');
  updateStatus('-', 'IDLE', 'ポーリング待機中...', '-');

  // 初回即時実行
  await pollOnce();

  setInterval(async () => {
    await pollOnce();
  }, POLLING_INTERVAL_MS);
}

async function pollOnce() {
  try {
    const issues = await fetchTargetIssues();
    const newIssues = issues.filter(i => !processedIssues.has(i.number));
    if (newIssues.length === 0) {
      updateStatus('-', 'IDLE', `ポーリング完了。新規タスクなし (処理済み: ${[...processedIssues].join(', ') || 'なし'})`, '-');
      return;
    }
    for (const issue of newIssues) {
      await processIssue(issue);
    }
  } catch (err) {
    log('ERROR', `ポーリング中のエラー: ${err.message}`);
  }
}

async function fetchTargetIssues() {
  const repoFull = 'yama-0t0k0/forAgent';
  const url = `https://api.github.com/repos/${repoFull}/issues?labels=${LABEL_TO_WATCH}&state=open`;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'PM-Orchestrator-Daemon'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      log('ERROR', `GitHub API Error: ${res.statusText}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    log('ERROR', `Fetch Error: ${err.message}`);
    return [];
  }
}

async function processIssue(issue) {
  log('INFO', `━━━ Issue #${issue.number} の処理を開始: "${issue.title}" ━━━`);
  updateStatus(issue.number, 'PLANNING', 'Qwen 2.5 3B にタスク分割を依頼中...', '0/?');

  try {
    // 1. PM Agent (Local LLM) にDAGを作らせる
    const taskPlan = await consultPMAgent(issue);
    const taskCount = taskPlan.tasks.length;
    log('INFO', `DAG計画を受領: ${taskCount} タスク`);
    taskPlan.tasks.forEach((t, i) => {
      log('INFO', `  Task ${i + 1}: [${t.agent}] ${t.instruction}`);
    });

    // 2. DAGエンジンの逐次実行（バケツリレー）
    updateStatus(issue.number, 'EXECUTING', `DAG実行開始 (${taskCount} タスク)`, `0/${taskCount}`);
    await executeTaskGraph(taskPlan.tasks, issue.number);

    // 3. 成功
    log('SUCCESS', `✅ Issue #${issue.number} の全タスクが完了しました！`);
    updateStatus(issue.number, 'DONE', '全タスク完了！', `${taskCount}/${taskCount}`);
    processedIssues.add(issue.number);

  } catch (error) {
    log('ERROR', `❌ Issue #${issue.number} でエラーが発生しました。分析を開始します...`);
    
    // 4. 失敗分析
    const analysis = await analyzeFailure(issue, error.message);
    log('WARN', `原因分析完了:\n${analysis.reason}`);
    log('WARN', `提案解決策: ${analysis.solution}`);

    // 5. ポストモーテム連携（重大な場合）
    if (analysis.isCritical) {
      await handleCriticalFailure(issue, analysis);
    }

    updateStatus(issue.number, 'FAILED', `失敗: ${analysis.reason}`, '-');
    processedIssues.add(issue.number); // 無限リトライ防止
  }
}

// ---- DAG実行エンジン (逐次実行版) ----

async function executeTaskGraph(tasks, issueNumber) {
  const completed = new Set();
  const taskOutputs = {};

  while (completed.size < tasks.length) {
    // 実行可能なタスクを1つ探す（依存が全て解決済みのもの）
    const nextTask = tasks.find(t =>
      !completed.has(t.id) &&
      (!t.dependsOn || t.dependsOn.length === 0 || t.dependsOn.every(dep => completed.has(dep)))
    );

    if (!nextTask) {
      // 全未完了タスクの依存が解決不能 => デッドロック
      const remaining = tasks.filter(t => !completed.has(t.id)).map(t => `${t.id}(deps:${t.dependsOn})`);
      throw new Error(`[DAG] Deadlock! 残タスク: ${remaining.join(', ')}`);
    }

    // バケツリレー: 前タスクの出力を集約
    let previousContext = "";
    if (nextTask.dependsOn && nextTask.dependsOn.length > 0) {
      previousContext += "\n--- PREVIOUS TASK CONTEXT ---\n";
      nextTask.dependsOn.forEach(dep => {
        previousContext += `[Task: ${dep}] Output:\n${taskOutputs[dep] || '(no output)'}\n`;
      });
    }

    const taskIndex = tasks.indexOf(nextTask) + 1;
    const progressStr = `${taskIndex}/${tasks.length}`;
    log('INFO', `🚀 [${progressStr}] Task "${nextTask.id}" を開始 (agent: ${nextTask.agent})`);
    updateStatus(issueNumber, 'EXECUTING', `Task ${taskIndex}/${tasks.length}: [${nextTask.agent}] ${nextTask.instruction.substring(0, 60)}...`, progressStr);

    try {
      const output = await runIronClawJob(nextTask, previousContext);
      taskOutputs[nextTask.id] = output;
      completed.add(nextTask.id);
      log('SUCCESS', `✅ Task "${nextTask.id}" 完了`);
    } catch (childError) {
      log('ERROR', `❌ Task "${nextTask.id}" 失敗: ${childError}`);
      // スキップせずに停止する
      throw new Error(`Task "${nextTask.id}" failed: ${childError}`);
    }
  }
}

// ---- IronClaw サンドボックス起動 ----

function runIronClawJob(task, previousContext) {
  return new Promise((resolve, reject) => {
    // 1. セキュリティポリシーの取得
    const policyPath = path.resolve(__dirname, '../../docs/architecture/ironclaw_security_policy.md');
    let securityPolicy = '';
    try {
      securityPolicy = fs.readFileSync(policyPath, 'utf-8');
    } catch (e) {
      log('WARN', `セキュリティポリシー未検出: ${policyPath}`);
    }

    // 2. エージェントスキル(SKILL.md)の取得
    const skillPath = path.resolve(__dirname, `../skills/${task.agent}/SKILL.md`);
    let basePersona = '';
    try {
      basePersona = fs.readFileSync(skillPath, 'utf-8');
    } catch (e) {
      log('WARN', `SKILL.md 未検出: ${task.agent}`);
    }

    // 3. 統合プロンプト構築
    const injectedSystemPrompt = [
      '[IronClaw Security Guardrails]',
      securityPolicy,
      '[Agent Persona / Skill]',
      basePersona,
      '[Bucket Brigade Context]',
      previousContext,
      '[Current Instruction]',
      task.instruction
    ].join('\n');

    // 4. stale PID fileをクリーンアップしてからIronClawを起動
    const pidFile = path.join(process.env.HOME || '', '.ironclaw', 'ironclaw.pid');
    try { fs.unlinkSync(pidFile); } catch (_) { /* ignore */ }

    log('INFO', `  ironclaw run -m "..." を起動中...`);

    const child = spawn('ironclaw', [
      'run',
      '--cli-only',
      '--auto-approve',
      '--no-onboard',
      '-m', injectedSystemPrompt
    ], {
      env: { ...process.env }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      const text = data.toString().trim();
      stdoutData += data.toString();
      if (text) log('IRONCLAW', `[${task.agent}] ${text}`);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString().trim();
      stderrData += data.toString();
      if (text) log('IRONCLAW_ERR', `[${task.agent}] ${text}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdoutData);
      } else {
        reject(stderrData || stdoutData || `exit code ${code}`);
      }
    });

    // 10分タイムアウト (モデルロードや推論遅延を考慮)
    setTimeout(() => {
      child.kill('SIGTERM');
      reject('Timeout: 10分以内にタスクが完了しませんでした');
    }, 10 * 60 * 1000);
  });
}

// ---- Local LLM (PM Agent) への問い合わせ ----

async function consultPMAgent(issue) {
  log('INFO', `🤖 Qwen 2.5 3B に DAG計画を依頼中 (Issue #${issue.number})...`);

  const skillPath = path.resolve(__dirname, '../skills/pm_agent/SKILL.md');
  let pmPersona = '';
  try {
    pmPersona = fs.readFileSync(skillPath, 'utf-8');
  } catch (e) {
    log('WARN', 'PM Agent SKILL.md not found');
  }

  // プロンプトにホワイトリストを明示的に含める
  const prompt = `
You are a Project Manager AI. Given the following GitHub Issue, create a task execution plan as a JSON object.

CRITICAL RULES:
- Output ONLY valid JSON. No markdown, no explanation.
- Divide work into small, atomic tasks (e.g., separate UI from backend/logic).
- The JSON must have a "tasks" array.
- Each task object must have: "id" (string), "agent" (string), "dir" (string), "instruction" (string), "dependsOn" (array of id strings).
- "agent" MUST be one of these exact values: ${VALID_AGENTS.map(a => `"${a}"`).join(', ')}
- "dir" must be a relative path like "./packages/shared" or "./"
- "dependsOn" for the first task must be an empty array [].
- Use sequential dependencies (task_2 depends on task_1, task_3 depends on task_2, etc).

GitHub Issue #${issue.number}: ${issue.title}

${issue.body}

Output JSON:`;

  try {
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }
    const data = await res.json();

    // Markdownコードブロック除去
    let rawText = data.response;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) rawText = jsonMatch[1];

    let dagJson;
    try {
      dagJson = JSON.parse(rawText.trim());
    } catch (parseErr) {
      log('ERROR', `JSON parse失敗。rawText: ${rawText.substring(0, 200)}`);
      throw parseErr;
    }

    // 構造の正規化
    if (Array.isArray(dagJson)) {
      dagJson = { tasks: dagJson };
    } else if (!dagJson.tasks) {
      dagJson = { tasks: [dagJson] };
    }

    // 各タスクの正規化
    dagJson.tasks = dagJson.tasks.map((t, index) => {
      // ID正規化
      if (!t.id) t.id = `task_${index + 1}`;

      // エージェント名正規化: ホワイトリストに無い場合はデフォルトに置換
      if (!t.agent || !VALID_AGENTS.includes(t.agent)) {
        const fallbacks = ['platform_shared', 'apps_expert', 'enabling_quality'];
        const fallback = fallbacks[Math.min(index, fallbacks.length - 1)];
        log('WARN', `エージェント名 "${t.agent}" は無効。"${fallback}" に置換`);
        t.agent = fallback;
      }

      // dir 正規化
      if (!t.dir) t.dir = './';

      // instruction 正規化
      if (!t.instruction) t.instruction = `Issue の要件を ${t.agent} の担当範囲で実装せよ`;

      // dependsOn 正規化
      if (!t.dependsOn) t.dependsOn = [];
      if (!Array.isArray(t.dependsOn)) t.dependsOn = [t.dependsOn];

      // 存在しないIDへの依存を除去
      const validIds = dagJson.tasks.map(tt => tt.id || `task_${dagJson.tasks.indexOf(tt) + 1}`);
      t.dependsOn = t.dependsOn.filter(dep => validIds.includes(dep));

      return t;
    });

    log('INFO', `DAG正規化完了: ${dagJson.tasks.length} タスク`);
    return dagJson;

  } catch (err) {
    log('ERROR', `Ollama呼び出し失敗: ${err.message}`);
    // フォールバック: 手動で安全なDAGを生成
    log('WARN', 'フォールバックDAGを使用します');
    return {
      tasks: [
        { id: "task_1", agent: "platform_shared", dir: "./packages/shared",
          instruction: `Issue #${issue.number} "${issue.title}" の共通基盤設計と実装`, dependsOn: [] },
        { id: "task_2", agent: "lp_app_expert", dir: "./apps/lp_app",
          instruction: `Issue #${issue.number} の要件に基づくフロントエンド実装`, dependsOn: ["task_1"] },
        { id: "task_3", agent: "enabling_quality", dir: "./",
          instruction: `変更コードの品質監査とテスト`, dependsOn: ["task_2"] }
      ]
    };
  }
}

// ---- 失敗分析 & ポストモーテム連携 ----

async function analyzeFailure(issue, errorMessage) {
  log('INFO', '🤖 失敗原因を分析中...');
  const prompt = `
あなたはシニア開発者・監視エージェントです。
以下のエージェント実行エラーが発生しました。原因を分析し、解決策を提示してください。

Issue: #${issue.number} ${issue.title}
Error: ${errorMessage}

出力形式(JSON):
{
  "reason": "短い失敗理由（日本語）",
  "solution": "具体的な解決策（日本語）",
  "isCritical": boolean (アーキテクチャやシステム全体の設計に関連する致命的な問題であればtrue)
}
`;

  try {
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return JSON.parse(data.response);
  } catch (err) {
    return {
      reason: errorMessage,
      solution: "手動での確認が必要です。",
      isCritical: false
    };
  }
}

async function handleCriticalFailure(issue, analysis) {
  log('WARN', '🚨 致命的な問題が検知されました。ポストモーテムの作成を準備します...');
  // enabling_quality エージェントのコンテキストを使用して Postmortem.md に追記
  const postmortemPath = path.resolve(__dirname, '../../docs/Postmortem.md');
  const ts = new Date().toISOString();
  const entry = `
## [INCIDENT] ${ts} - Issue #${issue.number}
- **事象**: ${analysis.reason}
- **原因・解決策**: ${analysis.solution}
- **自動検知**: pm_orchestrator
`;
  try {
    fs.appendFileSync(postmortemPath, entry);
    log('INFO', '✅ Postmortem.md にインシデント情報を記録しました。');
  } catch (e) {
    log('ERROR', `Postmortem.md への書き込みに失敗: ${e.message}`);
  }
}

if (require.main === module) {
  startDaemon();
}
