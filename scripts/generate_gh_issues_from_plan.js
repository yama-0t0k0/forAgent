// 役割（機能概要）:
// - docs/RefactoringPlan.md を解析し、未完了のタスクを抽出する
// - 抽出したタスクをGitHub CLI (gh) でIssue化するためのコマンドを生成して表示する
// - GitHub Milestone機能と連携して、計画書に基づいた進捗管理を効率化するための支援ツール
//
// ディレクトリ構造:
// ├── scripts/
// │   ├── generate_gh_issues_from_plan.js (本ファイル)
// │   └── ...
// ├── docs/
// │   └── RefactoringPlan.md (解析対象)
//
// 実行方法:
// node scripts/generate_gh_issues_from_plan.js
//
// 前提条件:
// - GitHub CLI (gh) がインストールされ、認証されていること (gh auth login)
// - docs/RefactoringPlan.md が存在すること

const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, '../docs/RefactoringPlan.md');

function parsePlan(content) {
  const lines = content.split('\n');
  const tasks = [];
  let currentSection = '';
  let currentTask = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // セクション見出し (##, ###)
    if (trimmed.startsWith('##')) {
      // 前のタスクがあれば保存
      if (currentTask) {
        tasks.push(currentTask);
        currentTask = null;
      }
      currentSection = trimmed.replace(/^#+\s*/, '').trim();
      return;
    }

    // タスク定義 (数字付きリスト "1. **タイトル**")
    const taskMatch = trimmed.match(/^\d+\.\s*\*\*(.*?)\*\*/);
    if (taskMatch) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      currentTask = {
        title: taskMatch[1],
        section: currentSection,
        status: 'pending', // デフォルト
        description: []
      };
      return;
    }

    // タスクの内容・ステータス解析
    if (currentTask) {
      if (trimmed.includes('✅ 完了') || trimmed.includes('Status: ✅ Completed')) {
        currentTask.status = 'completed';
      }
      // 空行以外を説明として追加
      if (trimmed.length > 0) {
        currentTask.description.push(trimmed);
      }
    }
  });

  // 最後のタスクを追加
  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

function generateCommands(tasks) {
  console.log('\n🔍 docs/RefactoringPlan.md から未完了タスクを検出しました:\n');
  
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  
  if (pendingTasks.length === 0) {
    console.log('🎉 すべてのタスクが完了しています！Issue作成は不要です。');
    return;
  }

  console.log('以下のコマンドを実行すると、これらをGitHub Issueとして一括登録できます:');
  console.log('---------------------------------------------------------');
  console.log('# まずマイルストーンを作成 (既存の場合はスキップ可)');
  console.log('gh api repos/:owner/:repo/milestones -f title="Refactoring Plan Phase 2" -f state="open" || echo "Milestone likely exists"');
  console.log('');
  
  pendingTasks.forEach((task, index) => {
    const title = `[Refactoring] ${task.title}`;
    // 説明文を整形 (箇条書きなどはそのまま)
    const body = `## 背景\n${task.section}\n\n## 詳細\n${task.description.join('\n')}\n\nReference: docs/RefactoringPlan.md`;
    
    // エスケープ処理 (簡易版)
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedBody = body.replace(/"/g, '\\"').replace(/`/g, '\\`');

    console.log(`# Task ${index + 1}: ${task.title}`);
    console.log(`gh issue create --title "${escapedTitle}" --body "${escapedBody}" --label "refactoring" --label "enhancement"`);
    console.log('');
  });
  console.log('---------------------------------------------------------');
  console.log('※ 必要に応じて --milestone "Refactoring Plan Phase 2" オプションを追加してください。');
}

function main() {
  try {
    if (!fs.existsSync(PLAN_FILE)) {
      console.error(`Error: File not found at ${PLAN_FILE}`);
      process.exit(1);
    }

    const content = fs.readFileSync(PLAN_FILE, 'utf-8');
    const tasks = parsePlan(content);
    generateCommands(tasks);

  } catch (error) {
    console.error('Failed to process plan:', error);
    process.exit(1);
  }
}

main();
