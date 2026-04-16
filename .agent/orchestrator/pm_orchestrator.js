const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PM Agent Orchestrator (Resident Daemon) - DAG Engine
 *
 * 役割：
 * pm_agent が定義した「タスクのJSONグラフ（DAG）」をパースし、
 * 各専門家エージェント（IronClaw経由）を依存順序に従って起動する。
 * 前タスクの出力を次のタスクの入力（システムプロンプト）に注入し、「バケツリレー」を実現する。
 */

const POLLING_INTERVAL_MS = 60000;
const LABEL_TO_WATCH = 'ready-for-agent';

async function startDaemon() {
  console.log(`[Daemon] PM Orchestrator DAG Engine started. Polling every 60s...`);
  setInterval(async () => {
    try {
      const issues = await fetchTargetIssues();
      for (const issue of issues) {
        await processIssue(issue);
      }
    } catch (err) {
      console.error('[Daemon] 🔴 Error during polling:', err);
    }
  }, POLLING_INTERVAL_MS);
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
      console.error(`[Daemon] 🔴 GitHub API Error: ${res.statusText}`);
      return [];
    }
    const issues = await res.json();
    return issues;
  } catch(err) {
    console.error(`[Daemon] 🔴 Fetch Error:`, err.message);
    return [];
  }
}

async function processIssue(issue) {
  try {
    // 1. pm_agent人格を使用して、Issueからタスク依存グラフ（DAG）を作成
    const taskPlan = await consultPMAgent(issue);

    // 2. DAGエンジンの実行（バケツリレー）
    await executeTaskGraph(taskPlan.tasks, issue.number);

    console.log(`[Daemon] ✅ Task for Issue #${issue.number} completed successfully.`);
    // TODO: Create Draft PR via API

  } catch (error) {
    console.error(`[Daemon] ❌ Fatal error on Issue #${issue.number}.`, error);
  }
}

/**
 * 依存グラフ（DAG）を解析し、順次・並列にタスクを実行するエンジン関数
 */
async function executeTaskGraph(tasks, issueNumber) {
  const completed = new Set();
  const taskOutputs = {}; // バケツの受け皿（各タスクのエラー内容やコミット差分を保存）

  let allCompleted = false;

  while (!allCompleted) {
    // 未完了かつ、依存タスク(dependsOn)が全てcompletedに入っているタスクを探す
    const executableTasks = tasks.filter(t =>
      !completed.has(t.id) && 
      (!t.dependsOn || t.dependsOn.every(dep => completed.has(dep)))
    );

    if (executableTasks.length === 0) {
      if (completed.size === tasks.length) {
        allCompleted = true; // 全タスク完了
        break;
      } else {
        throw new Error("[DAG] Deadlock detected! Unmet dependencies in task graph.");
      }
    }

    // 実行可能なタスク群を並列起動
    const promises = executableTasks.map(async (task) => {
      // 👉 【バケツリレー】: 依存している前タスクの出力結果（コンテキスト）を集約
      let previousContext = "";
      if (task.dependsOn && task.dependsOn.length > 0) {
        previousContext += "\n--- PREVIOUS TASK CONTEXT ---\n";
        task.dependsOn.forEach(dep => {
          previousContext += `[Task: ${dep}] Output:\n${taskOutputs[dep]}\n`;
        });
      }

      console.log(`[DAG] 🚀 Starting ${task.id} (${task.agent}) in ${task.dir}`);
      
      try {
        const output = await runIronClawJob(task, previousContext);
        taskOutputs[task.id] = output; // 出力をバケツに貯める
        completed.add(task.id);
      } catch (childError) {
        console.error(`[DAG] ❌ Task ${task.id} failed! Initiating self-healing loop...`);
        // 自己修復の実行（原因となった前タスクにエラー文脈を渡して再実行させる）
        await handleSelfHealing(task, childError, taskOutputs, issueNumber);
        
        // 修復ループで全体がやり直しになるため、一旦処理を停止する
        throw new Error(`Task halted for self-healing: ${task.id}`);
      }
    });

    // 同じ階層（依存度）のタスク群をすべて完了するまで待つ
    await Promise.all(promises);
  }
}

/**
 * 自己修復ループ（Self-Healing Loop）
 * enabling_quality（監査エージェント）等でLinterや規約エラーが発生した場合、
 * 書いた本人（直前の実装担当エージェント）にエラー内容を差し戻す。
 */
async function handleSelfHealing(failedTask, errorData, currentOutputs, issueNumber) {
  // 制作者（直前のタスク）を特定する
  const authorTaskId = failedTask.dependsOn ? failedTask.dependsOn[0] : null;

  console.log(`[Healing] 🩹 Feedback sent back to: ${authorTaskId || 'None (root task)'}`);
  
  // TODO: PM Agentを再度呼び出し、
  // 「前回の出力(currentOutputs[authorTaskId])」と「今回発生したエラー(errorData)」を合成。
  // そのエラーを修正するための新しいDAGタスクを1〜2個作成して再実行キューに投入するロジックを実装。
}

/**
 * IronClaw サンドボックスプロセスの起動およびバケツリレー注入
 */
function runIronClawJob(task, previousContext) {
  return new Promise((resolve, reject) => {
    // 1. 最終厳守ポリシー (ガードレール) の取得
    const policyPath = path.resolve(__dirname, '../../docs/architecture/ironclaw_security_policy.md');
    let securityPolicy = '';
    try {
      securityPolicy = fs.readFileSync(policyPath, 'utf-8');
    } catch (e) {
      console.warn(`[Daemon] ⚠️ Security policy not found at ${policyPath}`);
    }

    // 2. 各専門家エージェントのスキル（規約・人格）を取得
    const skillPath = path.resolve(__dirname, `../skills/${task.agent}/SKILL.md`);
    let basePersona = '';
    try {
      basePersona = fs.readFileSync(skillPath, 'utf-8');
    } catch (e) {
      console.warn(`[Daemon] ⚠️ SKILL.md not found for ${task.agent}.`);
    }

    // 3. ポリシー + SKILL.md + バケツリレー文脈 を結合し、究極のシステムプロンプトを作成
    const injectedSystemPrompt = `
[IronClaw Security Guardrails]
${securityPolicy}

[Agent Persona / Skill]
${basePersona}

[Bucket Brigade Context]
${previousContext}

[Current Instruction]
${task.instruction}
    `;

    // 3. IronClaw Wasm Sandboxを起動
    const child = spawn('ironclaw', [
      'run',
      '--agent', task.agent,
      '--allow-read-write', task.dir
    ], {
      env: { ...process.env, SYSTEM_PROMPT: injectedSystemPrompt }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log(`[${task.agent}] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`[${task.agent}] ERROR: ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
      if (code === 0) resolve(stdoutData);
      else reject(stderrData || stdoutData);
    });
  });
}

/**
 * ローカルの Gemma 4 を呼び出し、タスク分割JSON（DAG）を取得するスタブ
 */
async function consultPMAgent(issue) {
  // 実際は Ollama経由で pm_agent の SKILL.md と Issueテキストを結合してJSONを出力させる
  return {
    tasks: [
      { 
        id: "task_1", agent: "platform_shared", dir: "./packages/shared", 
        instruction: "実装要求を元に必要な共通UIやInterfaceを追加せよ。", 
        dependsOn: [] 
      },
      { 
        id: "task_2", agent: "lp_app_expert", dir: "./apps/lp_app", 
        instruction: "追加された共通UIを用いて要件の画面を実装せよ。", 
        dependsOn: ["task_1"] 
      },
      { 
        id: "task_3", agent: "enabling_quality", dir: "./", 
        instruction: "変更されたコードの品質監査とPR作成前のテストを行え。", 
        dependsOn: ["task_2"] 
      }
    ]
  };
}

if (require.main === module) {
  startDaemon();
}
