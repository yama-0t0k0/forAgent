const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * IronClaw Autonomous Core - DAG Engine v3
 *
 * v3 変更点 (Issue #126: 構造改革):
 * - ホスト上で直接実行（コンテナ化を廃止し、ネットワーク問題を根絶）
 * - Ollama 呼び出しをオーケストレーター自身が行う（127.0.0.1 直結）
 * - ironclaw_core (Rust) は「出力検閲フィルタ」として pipe 呼び出し
 * - 起動時 Ollama ヘルスチェック
 * - フォールバック DAG のバグ修正 (lp_app_expert → apps_expert)
 */

const POLLING_INTERVAL_MS = 60000;
const LABEL_TO_WATCH = 'ready-for-agent';
const STATUS_FILE = path.resolve(__dirname, 'status.json');
const LOG_FILE = path.resolve(__dirname, 'daemon.log');
const PROCESSED_FILE = path.resolve(__dirname, 'processed_issues.json');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// ironclaw_core バイナリのパスを動的に解決
const IRONCLAW_BINARY = path.resolve(__dirname, '../../shared/ironclaw_core/target/release/ironclaw_core');

// 実在するエージェント名のホワイトリスト
const VALID_AGENTS = [
  'platform_shared', 'apps_expert', 'enabling_quality',
  'platform_infra', 'complex_logic', 'tech_concierge', 'pm_agent'
];

// 処理済みIssue番号をファイルベースで永続化
let processedIssues = new Set();
function loadProcessedIssues() {
  try {
    const data = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf-8'));
    processedIssues = new Set(data);
  } catch (_) { /* first run */ }
}
function saveProcessedIssues() {
  try {
    fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...processedIssues]));
  } catch (_) { /* ignore */ }
}

// ---- ログ & ステータス管理 ----

const COLORS = {
  INFO: '\x1b[36m',    // Cyan
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  SUCCESS: '\x1b[32m', // Green
  STATUS: '\x1b[35m',  // Magenta
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
    progress,
    log: LOG_FILE
  };
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (_) { /* ignore */ }
  log('STATUS', `Issue #${issueNumber} | ${phase} | ${detail} | ${progress}`);
}

// ---- Ollama 直結通信 ----

async function ollamaGenerate(prompt, format) {
  const body = {
    model: OLLAMA_MODEL,
    prompt: prompt,
    stream: false,
  };
  if (format) body.format = format;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.response;
}

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const modelNames = (data.models || []).map(m => m.name);
    if (!modelNames.some(n => n.startsWith(OLLAMA_MODEL.split(':')[0]))) {
      log('WARN', `モデル "${OLLAMA_MODEL}" が Ollama に見つかりません。利用可能: ${modelNames.join(', ')}`);
    }
    log('SUCCESS', `✅ Ollama 接続確認済み (${OLLAMA_URL}) — モデル: ${modelNames.join(', ')}`);
    return true;
  } catch (err) {
    log('ERROR', `❌ Ollama に接続できません (${OLLAMA_URL}): ${err.message}`);
    log('ERROR', '   → Ollama が起動していることを確認してください: ollama serve');
    return false;
  }
}

// ---- IronClaw 出力検閲フィルタ ----

function filterThroughIronClaw(text) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(IRONCLAW_BINARY)) {
      log('WARN', '⚠️ ironclaw_core バイナリが見つかりません。検閲をスキップします。');
      resolve(text);
      return;
    }

    const child = spawn(IRONCLAW_BINARY, ['filter'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        log('IRONCLAW', `🚨 出力検閲で遮断: ${stderr.trim()}`);
        reject(new Error(`IronClaw Security Filter blocked output: ${stderr.trim()}`));
      }
    });

    child.stdin.write(text);
    child.stdin.end();

    setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('IronClaw filter timeout (30s)'));
    }, 30000);
  });
}

function filterThroughIronClawToolValidation(text) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(IRONCLAW_BINARY)) {
      return resolve(text);
    }
    const child = spawn(IRONCLAW_BINARY, ['filter', '--validate-tool']);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());

    child.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        // Rustのエラーメッセージをそのままキャプチャする（LLM自己修復ループ用）
        reject(new Error(stderr.trim() || `Exit code ${code}`));
      }
    });

    child.stdin.write(text);
    child.stdin.end();

    setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('IronClaw JSON validation timeout (30s)'));
    }, 30000);
  });
}

// ==== Action Execution Engine ====
function validatePath(filePath) {
   // Orchestratorが動いている場所 (forAgent/.agent/orchestrator)
   const projectRoot = path.resolve(__dirname, '../../');
   const resolved = path.resolve(projectRoot, filePath);
   if (!resolved.startsWith(projectRoot)) {
       throw new Error(`Path ${filePath} is outside project root.`);
   }
   if (resolved.includes('.env') || resolved.includes('credentials')) {
       throw new Error(`Access to sensitive file ${filePath} is forbidden by ActionExecutor.`);
   }
   return resolved;
}

function validateCommand(cmd) {
   const allowlistPrefixes = ['npm test', 'npx expo config', 'git', 'cargo build', 'echo', './scripts'];
   const isAllowed = allowlistPrefixes.some(prefix => cmd.trim().startsWith(prefix));
   if (!isAllowed) {
       throw new Error(`Command "${cmd}" is not in the allowlist. Allowed prefixes: ${allowlistPrefixes.join(', ')}`);
   }
}

async function executeTool(action) {
   const { execSync } = require('child_process');
   log('INFO', `    [Tool Execution] ${action.name}`);
   try {
       if (action.name === 'write_file') {
           const safePath = validatePath(action.arguments.path);
           fs.mkdirSync(path.dirname(safePath), { recursive: true });
           fs.writeFileSync(safePath, action.arguments.content, 'utf-8');
           return `Successfully wrote to ${action.arguments.path}`;
       } else if (action.name === 'read_file') {
           const safePath = validatePath(action.arguments.path);
           if (!fs.existsSync(safePath)) return `File not found: ${action.arguments.path}`;
           const content = fs.readFileSync(safePath, 'utf-8');
           return content;
       } else if (action.name === 'run_command') {
           validateCommand(action.arguments.command);
           const cwdArg = action.arguments.cwd ? action.arguments.cwd : './';
           const safeCwd = validatePath(cwdArg);
           const output = execSync(action.arguments.command, { cwd: safeCwd, encoding: 'utf-8' });
           return output.trim() || 'Command executed successfully (no output).';
       } else if (action.name === 'github_comment') {
           const repoFull = 'yama-0t0k0/forAgent';
           const { execFileSync } = require('child_process');
           const output = execFileSync('gh', ['issue', 'comment', action.arguments.issue_number.toString(), '-R', repoFull, '-b', action.arguments.body], { encoding: 'utf-8' });
           return output.trim() || 'Comment posted successfully.';
       } else if (action.name === 'github_close_issue') {
           const repoFull = 'yama-0t0k0/forAgent';
           const { execFileSync } = require('child_process');
           const output = execFileSync('gh', ['issue', 'close', action.arguments.issue_number.toString(), '-R', repoFull], { encoding: 'utf-8' });
           return output.trim() || 'Issue closed successfully.';
       }
       return `Unknown tool: ${action.name}`;
   } catch (e) {
       return `Tool Execution Error: ${e.message}`;
   }
}

// ---- GitHub API ----

async function githubApiFetch(url) {
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
      log('ERROR', `GitHub API Error (${url}): ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    log('ERROR', `Fetch Error (${url}): ${err.message}`);
    return null;
  }
}

async function fetchTargetIssues() {
  const repoFull = 'yama-0t0k0/forAgent';
  const url = `https://api.github.com/repos/${repoFull}/issues?labels=${LABEL_TO_WATCH}&state=open`;
  return await githubApiFetch(url) || [];
}

async function fetchMilestoneContext(milestone) {
  if (!milestone) return "No milestone assigned.";
  log('INFO', `🐘 Milestone Context 取得中: "${milestone.title}"`);
  return milestone.description || "No description provided for this milestone.";
}

async function fetchRecentIssuesContext() {
  const repoFull = 'yama-0t0k0/forAgent';
  const url = `https://api.github.com/repos/${repoFull}/issues?state=closed&per_page=10`;
  log('INFO', `🐘 直近 10 件の Issue 実績 取得中...`);
  const issues = await githubApiFetch(url);
  if (!issues || !Array.isArray(issues)) return "No recent closed issues found.";

  return issues.map(i => `- Issue #${i.number}: ${i.title} (closed)`).join('\n');
}

// ---- デーモン本体 ----

async function startDaemon() {
  log('INFO', '🚀 IronClaw Autonomous Core - DAG Engine v3 started.');
  log('INFO', `   Ollama: ${OLLAMA_URL} | Model: ${OLLAMA_MODEL}`);
  log('INFO', `   Polling: every ${POLLING_INTERVAL_MS / 1000}s`);

  // Ollama ヘルスチェック
  const healthy = await checkOllamaHealth();
  if (!healthy) {
    log('ERROR', '🛑 Ollama が利用不可のため起動を中断します。');
    process.exit(1);
  }

  // IronClaw バイナリ確認
  if (fs.existsSync(IRONCLAW_BINARY)) {
    log('SUCCESS', `✅ IronClaw Safety Guard: ${IRONCLAW_BINARY}`);
  } else {
    log('WARN', '⚠️ IronClaw バイナリ未検出。出力検閲なしで動作します。');
  }

  loadProcessedIssues();
  if (processedIssues.size > 0) {
    log('INFO', `   処理済み Issue (復元): ${[...processedIssues].join(', ')}`);
  }

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

async function processIssue(issue) {
  log('INFO', `━━━ Issue #${issue.number} の処理を開始: "${issue.title}" ━━━`);

  // 0. GitHub 外部記憶のフェッチ (SSOT 連携)
  const milestoneContext = await fetchMilestoneContext(issue.milestone);
  const recentIssuesContext = await fetchRecentIssuesContext();
  const projectContext = `
--- PROJECT CONTEXT (Memory) ---
[Current Milestone Goals]
${milestoneContext}

[Recent Completed Work (Last 10 Issues)]
${recentIssuesContext}
-------------------------------
`;

  updateStatus(issue.number, 'PLANNING', '[IronClaw Core] Qwen にDAG計画を依頼中...', '0/?');

  try {
    // 1. Local LLM にDAGを計画させる
    const taskPlan = await planTaskDAG(issue, projectContext);
    const taskCount = taskPlan.tasks.length;
    log('INFO', `DAG計画を受領: ${taskCount} タスク`);
    taskPlan.tasks.forEach((t, i) => {
      log('INFO', `  Task ${i + 1}: [${t.agent}] ${t.instruction}`);
    });

    // 2. DAGエンジンの逐次実行（バケツリレー）
    updateStatus(issue.number, 'EXECUTING', `DAG実行開始 (${taskCount} タスク)`, `0/${taskCount}`);
    await executeTaskGraph(taskPlan.tasks, issue.number, projectContext);

    // 3. 成功
    log('SUCCESS', `✅ Issue #${issue.number} の全タスクが完了しました！`);
    updateStatus(issue.number, 'DONE', '全タスク完了！', `${taskCount}/${taskCount}`);
    processedIssues.add(issue.number);
    saveProcessedIssues();

  } catch (error) {
    log('ERROR', `❌ Issue #${issue.number} でエラーが発生しました。分析を開始します...`);

    // 4. 失敗分析
    const analysis = await analyzeFailure(issue, error.message);
    log('WARN', `原因分析完了:\n${analysis.reason}`);
    log('WARN', `提案解決策: ${analysis.solution}`);

    // 5. ポストモーテム連携
    if (analysis.isCritical) {
      await handleCriticalFailure(issue, analysis);
    }

    updateStatus(issue.number, 'FAILED', `失敗: ${analysis.reason}`, '-');
    processedIssues.add(issue.number); // 無限リトライ防止
    saveProcessedIssues();
  }
}

// ---- DAG実行エンジン (逐次実行版) ----

async function executeTaskGraph(tasks, issueNumber, projectContext) {
  const completed = new Set();
  const taskOutputs = {};

  while (completed.size < tasks.length) {
    const nextTask = tasks.find(t =>
      !completed.has(t.id) &&
      (!t.dependsOn || t.dependsOn.length === 0 || t.dependsOn.every(dep => completed.has(dep)))
    );

    if (!nextTask) {
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
      const output = await runAgentTask(nextTask, previousContext, projectContext);
      taskOutputs[nextTask.id] = output;
      completed.add(nextTask.id);
      log('SUCCESS', `✅ Task "${nextTask.id}" 完了`);
    } catch (childError) {
      log('ERROR', `❌ Task "${nextTask.id}" 失敗: ${childError}`);
      throw new Error(`Task "${nextTask.id}" failed: ${childError}`);
    }
  }
}

// ---- エージェントタスクの実行 (Phase 2: Execution Loop) ----

async function runAgentTask(task, previousContext, projectContext) {
  const distilledPolicyPath = path.resolve(__dirname, '../../docs/architecture/distilled_policy.md');
  const fullPolicyPath = path.resolve(__dirname, '../../docs/architecture/ironclaw_security_policy.md');
  let securityPolicy = '';
  try {
    securityPolicy = fs.readFileSync(distilledPolicyPath, 'utf-8');
  } catch (e) {
    try { securityPolicy = fs.readFileSync(fullPolicyPath, 'utf-8'); } catch (ee) {}
  }

  const skillPath = path.resolve(__dirname, `../skills/${task.agent}/SKILL.md`);
  let basePersona = '';
  try { basePersona = fs.readFileSync(skillPath, 'utf-8'); } catch (e) {}

  const schemaPath = path.resolve(__dirname, '../../docs/CodingConventions/tool_call_schema.json');
  let toolSchema = '';
  try { toolSchema = fs.readFileSync(schemaPath, 'utf-8'); } catch (e) { log('WARN', 'tool_call_schema.json not found'); }

  let loopCount = 0;
  const maxLoops = 10;
  let toolResults = "";
  let finalOutputAccumulator = "";

  while (loopCount < maxLoops) {
    loopCount++;
    const fullPrompt = [
      '[Agent Persona / Skill]',
      basePersona,
      '[Current Instruction]',
      task.instruction,
      '[Bucket Brigade Context]',
      previousContext,
      '[JSON Schema / Tools Available]',
      toolSchema,
      '[Tool Execution History]',
      toolResults || "No tools executed yet.",
      '',
      'You are now in execution mode. Analyze the history and decide the next BEST tool calls.',
      'CRITICAL RULES FOR OUTPUT:',
      '1. You MUST output a JSON object with a "tool_calls" key.',
      '2. The "tool_calls" value MUST be a JSON array of tool calls matching the schema.',
      '3. EVERY tool call object MUST have exactly two keys: "name" (string) and "arguments" (object).',
      '4. DO NOT output {"tool_name": {...}}. You MUST use exactly {"name": "...", "arguments": {...}} structure.',
      'Example: {"tool_calls": [{"name":"write_file","arguments":{"path":"...", "content":"..."}}]}',
      'If you have finished the task and no more tools are needed, return: {"tool_calls": []}'
    ].join('\n');

    log('INFO', `  [Ollama] ${OLLAMA_MODEL} にツール実行依頼中 (Loop ${loopCount})...`);
    
    // Markdownコードブロック除去用のユーティリティをインラインで定義
    const cleanOutput = (text) => {
       const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
       return m ? m[1] : text;
    };

    const rawOutput = cleanOutput(await ollamaGenerate(fullPrompt, 'json'));
    log('INFO', `  [DEBUG] LLM Raw Output: ${rawOutput.substring(0, 300)}...`);

    // 5. IronClaw Safety Guard で物理的JSONバリデーション
    log('INFO', '  [IronClaw] JSON構造・出力検閲フィルタ適用中...');
    let validatedJsonStr;
    try {
      validatedJsonStr = await filterThroughIronClawToolValidation(rawOutput);
    } catch (filterErr) {
      log('WARN', `  [IronClaw] JSON validation failed. Retrying... (Error: ${filterErr.message.substring(0, 100)}...)`);
      toolResults += `\n[IronClaw Error]: ${filterErr.message}\nPlease fix your JSON structure and try again. Output ONLY the JSON array.`;
      continue; // 自己修復ループへ
    }

    let toolCalls = [];
    try {
      toolCalls = JSON.parse(validatedJsonStr);
    } catch (e) {
      // 念のため
      toolCalls = [];
    }

    if (!toolCalls || toolCalls.length === 0) {
      log('INFO', '  No tool calls returned. Task execution completed.');
      break; // 終了条件
    }

    let loopOutput = "";
    for (const action of toolCalls) {
      const result = await executeTool(action);
      loopOutput += `Tool ${action.name} Result:\n${result}\n`;
    }

    toolResults += `\n[Loop ${loopCount} Actions Result]\n${loopOutput}`;
    finalOutputAccumulator += loopOutput;
  }

  if (loopCount >= maxLoops) {
    log('WARN', '  [Action Executor] Max loop limit reached.');
  }

  return finalOutputAccumulator;
}

// ---- Local LLM への問い合わせ (DAG計画) ----

async function planTaskDAG(issue, projectContext) {
  log('INFO', `🤖 [Ollama] Qwen に DAG計画を依頼中 (Issue #${issue.number})...`);

  const prompt = `
You are a Project Manager AI. Given the following GitHub Issue and Project Context, create a task execution plan as a JSON object.

${projectContext}

CRITICAL RULES:
- Output ONLY valid JSON. No markdown, no explanation.
- Divide work into small, atomic tasks (e.g., separate UI from backend/logic).
- **TDD ENFORCEMENT**: Every implementation task MUST include "Write tests first, then implement code to pass the tests".
- **QUALITY GATE**: Every implementation task sequence MUST be followed by an "enabling_quality" task to "Run tests and audit quality".
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
    const rawText = await ollamaGenerate(prompt, 'json');

    // Markdownコードブロック除去
    let cleanText = rawText;
    const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) cleanText = jsonMatch[1];

    let dagJson;
    try {
      dagJson = JSON.parse(cleanText.trim());
    } catch (parseErr) {
      log('ERROR', `JSON parse失敗。rawText: ${cleanText.substring(0, 200)}`);
      throw parseErr;
    }

    // 構造の正規化
    if (Array.isArray(dagJson)) {
      dagJson = { tasks: dagJson };
    } else if (!dagJson.tasks) {
      dagJson = { tasks: [dagJson] };
    }

    // 各タスクの正規化
    // 1st pass: ID とエージェント名の正規化
    dagJson.tasks.forEach((t, index) => {
      if (!t.id) t.id = `task_${index + 1}`;

      if (!t.agent || !VALID_AGENTS.includes(t.agent)) {
        const fallbacks = ['platform_shared', 'apps_expert', 'enabling_quality'];
        const fallback = fallbacks[Math.min(index, fallbacks.length - 1)];
        log('WARN', `エージェント名 "${t.agent}" は無効。"${fallback}" に置換`);
        t.agent = fallback;
      }

      if (!t.dir) t.dir = './';
      if (!t.instruction) t.instruction = `Issue の要件を ${t.agent} の担当範囲で実装せよ`;
      if (!t.dependsOn) t.dependsOn = [];
      if (!Array.isArray(t.dependsOn)) t.dependsOn = [t.dependsOn];
    });

    // 2nd pass: dependsOn の参照整合性チェック（全 ID が確定した後）
    const validIds = dagJson.tasks.map(t => t.id);
    dagJson.tasks.forEach(t => {
      t.dependsOn = t.dependsOn.filter(dep => validIds.includes(dep));
    });

    log('INFO', `DAG正規化完了: ${dagJson.tasks.length} タスク`);
    return dagJson;

  } catch (err) {
    log('ERROR', `Ollama呼び出し失敗: ${err.message}`);
    // フォールバック: 安全なDAG (v3: バグ修正済み)
    log('WARN', 'フォールバックDAGを使用します');
    return {
      tasks: [
        { id: "task_1", agent: "platform_shared", dir: "./shared",
          instruction: `Issue #${issue.number} の共通基盤設計および要件を満たすテストコードの記述`, dependsOn: [] },
        { id: "task_2", agent: "apps_expert", dir: "./apps",
          instruction: `テストをパスするためのアプリケーション実装 (TDD)`, dependsOn: ["task_1"] },
        { id: "task_3", agent: "enabling_quality", dir: "./",
          instruction: `実装されたテストの実行確認および品質監査`, dependsOn: ["task_2"] }
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
  "isCritical": boolean
}`;

  try {
    const rawText = await ollamaGenerate(prompt, 'json');
    return JSON.parse(rawText);
  } catch (err) {
    return {
      reason: errorMessage,
      solution: "手動での確認が必要です。",
      isCritical: false
    };
  }
}

async function handleCriticalFailure(issue, analysis) {
  log('WARN', '🚨 致命的な問題が検知されました。ポストモーテムに記録します...');
  const postmortemPath = path.resolve(__dirname, '../../docs/Postmortem.md');
  const ts = new Date().toISOString();
  const entry = `
## [INCIDENT] ${ts} - Issue #${issue.number}
- **事象**: ${analysis.reason}
- **原因・解決策**: ${analysis.solution}
- **自動検知**: pm_orchestrator v3
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
