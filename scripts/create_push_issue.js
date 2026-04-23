#!/usr/bin/env node

/**
 * scripts/create_push_issue.js
 * 
 * GitHub Issue作成専用スクリプト
 * safe_push.sh から呼び出されることを想定
 * 
 * 機能:
 * 1. 環境変数からコンテキスト情報を取得
 * 2. 直近のIssueを取得（厳密に10件に制限）
 * 3. Issue本文を構築
 * 4. ghコマンドを使用してIssueを作成
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// --- Configuration ---
// --- 設定 ---
// 環境変数からパラメータを取得
const env = process.env;

const CONFIG = {
    repoUrl: env.REPO_URL || '', // 空の場合はghが自動検出
    targetBranch: env.TARGET_BRANCH || 'yama',
    prevPushHash: env.PREV_PUSH_HASH,
    currentHash: env.CURRENT_HASH,
    commitMessage: env.COMMIT_MESSAGE || '',

    issueBodyFile: env.ISSUE_BODY_FILE || '',
    
    // User Input Fields
    // ユーザー入力フィールド
    userPrompt: env.USER_PROMPT || '（指示内容を記述してください）',
    workPurpose: env.WORK_PURPOSE || '（変更の目的を記述してください）',
    workOutcome: env.WORK_OUTCOME || '（実行結果を記述してください）',
    contextNotes: env.CONTEXT_NOTES || '（背景・技術的制約・コンテキストを具体的に記述してください）',
    nextTasks: env.NEXT_TASKS || '（推奨される次回のタスクを具体的に記述してください）',
    
    // Optional Fields
    // オプションフィールド
    commandLogFile: env.COMMAND_LOG_FILE || '',
    investigationCommands: env.INVESTIGATION_COMMANDS || '',
    explicitTitle: env.EXPLICIT_TITLE || '',
    targetMilestone: env.TARGET_MILESTONE || '',
    labels: env.LABELS || '',
    
    // Flags
    // フラグ
    autoMode: env.AUTO_MODE === 'true'
};

// --- Helpers ---
// --- ヘルパー関数 ---

function runCommandOutput(command) {
    try {
        return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (e) {
        return null;
    }
}

function getGitConfigUser() {
    return runCommandOutput('git config user.name') || 'Unknown';
}

function getDiffStat() {
    if (!CONFIG.prevPushHash || !CONFIG.currentHash) return '(差分情報なし)';
    return runCommandOutput(`git diff --stat ${CONFIG.prevPushHash}..${CONFIG.currentHash}`) || '(差分なし)';
}

function getDiffLog() {
    if (!CONFIG.prevPushHash || !CONFIG.currentHash) return '(このPushに新しいコミットはありません)';
    const log = runCommandOutput(`git log --pretty=format:"- %h %s (%an)" ${CONFIG.prevPushHash}..${CONFIG.currentHash}`);
    return log || '(このPushに新しいコミットはありません)';
}

function getCommitListSimple() {
    if (!CONFIG.prevPushHash || !CONFIG.currentHash) return '(No new commits)';
    const log = runCommandOutput(`git log --pretty=format:"- %s" ${CONFIG.prevPushHash}..${CONFIG.currentHash}`);
    return log || '(No new commits)';
}

function detectLabels(commitMessage, userPrompt) {
    let labels = [];
    const content = (commitMessage + ' ' + userPrompt).toLowerCase();

    // Bug/Fix
    // バグ/修正
    if (content.match(/fix|bug|resolve|error|fail|修正|バグ|エラー/)) {
        labels.push('bug');
    }

    // Enhancement/Feature
    // 機能追加/改善
    if (content.match(/feat|add|new|create|implement|update|improve|追加|機能|作成|実装|更新|改善/)) {
        labels.push('enhancement');
    }

    // Documentation
    // ドキュメント
    if (content.match(/doc|readme|postmortem|ドキュメント|資料/)) {
        labels.push('documentation');
    }

    // Refactoring
    // リファクタリング
    if (content.match(/refactor|clean|optimize|simplify|restructure|リファクタ|整理|最適化/)) {
        labels.push('refactoring');
    }

    // Testing
    // テスト
    if (content.match(/test|spec|coverage|テスト|検証/)) {
        labels.push('testing');
    }

    return labels.join(',');
}

function getRepoSlug(repoUrl) {
    if (!repoUrl) return '';
    const trimmed = String(repoUrl).trim();
    const match = trimmed.match(/github\.com\/([^\/]+)\/([^\/\s]+?)(?:\.git)?$/);
    if (!match) return trimmed;
    return `${match[1]}/${match[2]}`;
}

function getAvailableLabels(repoSlug) {
    const repoArg = repoSlug ? `--repo "${repoSlug}"` : '';
    const json = runCommandOutput(`gh label list ${repoArg} --limit 200 --json name`);
    if (!json) return null;
    try {
        const items = JSON.parse(json);
        return new Set(items.map(i => i.name).filter(Boolean));
    } catch (e) {
        return null;
    }
}

function ensureFallbackLabelExists(repoSlug, fallbackLabel) {
    if (!repoSlug || !fallbackLabel) return false;
    const repoArg = `--repo "${repoSlug}"`;
    try {
        execSync(`gh label create "${fallbackLabel.replace(/"/g, '\\"')}" ${repoArg} --color "ededed" --description "どの分類にも該当しない場合のラベル"`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function writeIssueBodyToTempFile(issueBody) {
    const timestamp = Date.now();
    const candidates = [
        path.join(process.cwd(), '.agent', 'logs', `issue_body_${timestamp}.md`),
        path.join(os.tmpdir(), `issue_body_${timestamp}.md`),
        path.join(process.cwd(), `issue_body_${timestamp}.md`)
    ];

    let lastError = null;
    for (const candidate of candidates) {
        try {
            fs.mkdirSync(path.dirname(candidate), { recursive: true });
            fs.writeFileSync(candidate, issueBody);
            return candidate;
        } catch (e) {
            lastError = e;
        }
    }

    throw lastError || new Error('Failed to create temp file for issue body');
}

function readIssueBodyFileIfProvided() {
    const filePath = String(CONFIG.issueBodyFile || '').trim();
    if (!filePath) return null;
    if (!fs.existsSync(filePath)) {
        throw new Error(`ISSUE_BODY_FILE not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
}

// --- Main Logic ---
// --- メインロジック ---

function main() {
    console.log('📋 Generating GitHub Issue content...');

    // 1. Determine Issue Title
    // 1. Issueタイトルの決定
    let issueTitle = CONFIG.explicitTitle;
    if (!issueTitle) {
        // Summarize from WORK_PURPOSE (Max 50 chars)
        // Remove common prefixes
        // WORK_PURPOSEから要約（最大50文字）、一般的なプレフィックスを削除
        const firstLine = CONFIG.workPurpose.split('\n')[0];
        issueTitle = firstLine.replace(/^[目的指示概要]*[:：]\s*/, '').substring(0, 50);
    }
    
    // Fallback to commit message
    // コミットメッセージへのフォールバック
    if (!issueTitle || issueTitle === '（変更の目的を記述してください）') {
        issueTitle = CONFIG.commitMessage.replace(/^Push: /, '').substring(0, 50);
    }
    
    // Final fallback
    // 最終フォールバック
    if (!issueTitle) {
        issueTitle = `Update: ${new Date().toISOString().split('T')[0]}`;
    }

    // 2. Build Content Sections
    // 2. コンテンツセクションの構築
    
    // Command Log
    // コマンドログ
    let commandLogSection = '';
    if (CONFIG.commandLogFile && fs.existsSync(CONFIG.commandLogFile)) {
        try {
            const logContent = fs.readFileSync(CONFIG.commandLogFile, 'utf-8');
            commandLogSection = `\n### 💻 Command Execution Log / 実行コマンドログ\n\`\`\`bash\n${logContent}\n\`\`\`\n`;
        } catch (e) {
            console.warn(`⚠️ Failed to read command log file: ${e.message}`);
        }
    }

    // Major Commands
    // 主要コマンド
    const majorCommands = CONFIG.investigationCommands || '（調査に使用した主要なコマンドがあれば記述してください）';

    // Git Info
    // Git情報
    const diffStat = getDiffStat();
    const diffLog = getDiffLog();
    const commitListSimple = getCommitListSimple();
    const author = getGitConfigUser();
    const dateStr = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }); // 簡易的な日付

    // Recent Issues (Strictly Limit to 10)
    // 直近のIssue（厳密に10件に制限）
    let recentContext = "(直近のIssueは見つかりませんでした)";
    try {
        // --limit 10 ensures strict limit. Default sort is Newest first.
        // If repoUrl is provided, use it. Otherwise rely on gh context.
        // --limit 10 で厳密に制限。デフォルトのソートは最新順。
        // repoUrlが提供されている場合はそれを使用。それ以外はghのコンテキストに依存。
        const repoArg = CONFIG.repoUrl ? `--repo "${CONFIG.repoUrl}"` : '';
        const recentJson = runCommandOutput(`gh issue list ${repoArg} --state all --limit 10 --json number,title,author,createdAt,url`);
        
        if (recentJson) {
            const issues = JSON.parse(recentJson);
            if (issues.length > 0) {
                recentContext = issues.map(i => `- #${i.number} ${i.title} (${i.author.login}) ${i.createdAt} ${i.url}`).join('\n');
            }
        }
    } catch (e) {
        console.warn('⚠️ Failed to fetch recent issues:', e.message);
    }

    // Detect Labels if not provided
    // ラベルが提供されていない場合は検出
    let finalLabels = CONFIG.labels;
    if (!finalLabels) {
        finalLabels = detectLabels(CONFIG.commitMessage, CONFIG.userPrompt);
        if (finalLabels) {
            console.log(`🏷️  Auto-detected labels: ${finalLabels}`);
        }
    }
    
    const fallbackLabel = 'その他';
    const repoSlug = getRepoSlug(CONFIG.repoUrl);
    const availableLabels = getAvailableLabels(repoSlug);
    let labelsToApply = (finalLabels || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    if (labelsToApply.length === 0) labelsToApply = [fallbackLabel];
    if (availableLabels) {
        labelsToApply = labelsToApply.filter(l => availableLabels.has(l));
        if (labelsToApply.length === 0) {
            if (availableLabels.has(fallbackLabel)) {
                labelsToApply = [fallbackLabel];
            } else {
                const first = Array.from(availableLabels)[0];
                labelsToApply = first ? [first] : [fallbackLabel];
            }
        }
    } else {
        if (labelsToApply.length === 0) labelsToApply = [fallbackLabel];
    }

    // 3. Construct Issue Body
    // 3. Issue本文の構築
    const externalIssueBody = readIssueBodyFileIfProvided();
    const issueBody = externalIssueBody ?? `## 🤖 AI Development Cycle

### 📝 Implementation Details / 実装内容
${CONFIG.userPrompt}
${commandLogSection}

### 🔍 Major Commands / 調査に使用した主要コマンド
${majorCommands}

**Included Commits:**
${commitListSimple}

### 🎯 Mission & Intent / 目的と期待される効果
${CONFIG.workPurpose}

### 🏆 Outcome & Result / 実際の結果
${CONFIG.workOutcome}

---

## 📝 Context / 文脈
### 🧠 Background / 背景・コンテキスト
${CONFIG.contextNotes}

### 📋 Changes in this Push / 今回の配布内容
- **Date / 日時**: ${dateStr}
- **Branch / ブランチ**: ${CONFIG.targetBranch}
- **Author / 作成者**: ${author}
- **Previous Hash / 前回ハッシュ**: \`${CONFIG.prevPushHash || 'N/A'}\`
- **Current Hash / 今回ハッシュ**: \`${CONFIG.currentHash || 'N/A'}\`

#### Commits / コミットログ
${diffLog}

#### Changed Files / 変更ファイル
\`\`\`
${diffStat}
\`\`\`

### 🚀 Recommended Next Tasks / 推奨される次回のタスク
${CONFIG.nextTasks}

### 📚 Recent Issues (Latest 10) / 直近のIssue(10件)
${recentContext}
`;

    // 4. Validate Content (Placeholder Check)
    // 4. コンテンツの検証（プレースホルダーチェック）
    const validationBody = `${CONFIG.userPrompt} ${CONFIG.workPurpose} ${CONFIG.workOutcome} ${CONFIG.contextNotes} ${CONFIG.nextTasks}`;
    const hasPlaceholders = validationBody.includes('記述してください') || 
                           validationBody.includes('特になし') ||
                           validationBody.includes('No prompt summary provided');
    
    if (hasPlaceholders) {
        console.log('\n⚠️  Quality Control: Issue body contains placeholder text.');
        if (CONFIG.autoMode) {
            console.log('🤖 Auto mode detected. Proceeding despite placeholders.');
        } else {
            console.log('   To ensure quality, please refine the issue description.');
            // Note: Interactive editing is hard to support when calling node from bash in this way,
            // or rather, we should just let safe_push.sh handle the interaction BEFORE calling this script.
            // But since safe_push.sh already collects input, we assume it's passed here.
            // We'll just warn here.
        }
    }

    // 5. Create Issue
    // 5. Issueの作成
    console.log('🚀 Creating GitHub Issue...');
    
    // Write body to temp file to avoid shell escaping issues
    // シェルエスケープの問題を回避するため、本文を一時ファイルに書き込む
    const tempBodyFile = writeIssueBodyToTempFile(issueBody);
        
        const repoArg = repoSlug ? `--repo "${repoSlug}"` : '';
        const milestoneArg = CONFIG.targetMilestone ? `--milestone "${CONFIG.targetMilestone}"` : '';
        const titleArg = `--title "${issueTitle.replace(/"/g, '\\"')}"`;
        const bodyArg = `--body-file "${tempBodyFile}"`;

        const createIssue = (labels) => {
            const uniqueLabels = Array.from(new Set((labels || []).map(l => String(l).trim()).filter(Boolean)));
            if (uniqueLabels.length === 0) throw new Error('No labels to apply');
            const labelArgs = uniqueLabels.map(l => `--label "${l.replace(/"/g, '\\"')}"`).join(' ');
            const cmd = `gh issue create ${repoArg} ${titleArg} ${bodyArg} ${labelArgs} ${milestoneArg}`;
            return execSync(cmd, { encoding: 'utf-8' }).trim();
        };

        try {
            const issueUrl = createIssue(labelsToApply);
            console.log(`✅ Issue created successfully: ${issueUrl}`);
            return;
        } catch (e) {
            const message = e?.message || String(e);
            if (message.includes('could not add label')) {
                const created = ensureFallbackLabelExists(repoSlug, fallbackLabel);
                if (created) {
                    try {
                        const issueUrl = createIssue([fallbackLabel]);
                        console.log(`✅ Issue created successfully: ${issueUrl}`);
                        return;
                    } catch (retryError) {
                        console.error('❌ Failed to create issue:', retryError?.message || String(retryError));
                        process.exit(1);
                    }
                }
            }
            console.error('❌ Failed to create issue:', message);
            process.exit(1);
        } finally {
            try {
                if (fs.existsSync(tempBodyFile)) fs.unlinkSync(tempBodyFile);
            } catch (e) {}
        }
}

main();
