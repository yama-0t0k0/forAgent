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

// --- Configuration ---
// 環境変数からパラメータを取得
const env = process.env;

const CONFIG = {
    repoUrl: env.REPO_URL || '', // 空の場合はghが自動検出
    targetBranch: env.TARGET_BRANCH || 'yama',
    prevPushHash: env.PREV_PUSH_HASH,
    currentHash: env.CURRENT_HASH,
    commitMessage: env.COMMIT_MESSAGE || '',
    
    // User Input Fields
    userPrompt: env.USER_PROMPT || '（指示内容を記述してください）',
    workPurpose: env.WORK_PURPOSE || '（変更の目的を記述してください）',
    workOutcome: env.WORK_OUTCOME || '（実行結果を記述してください）',
    contextNotes: env.CONTEXT_NOTES || '（背景・技術的制約・コンテキストを具体的に記述してください）',
    nextTasks: env.NEXT_TASKS || '（推奨される次回のタスクを具体的に記述してください）',
    
    // Optional Fields
    commandLogFile: env.COMMAND_LOG_FILE || '',
    investigationCommands: env.INVESTIGATION_COMMANDS || '',
    explicitTitle: env.EXPLICIT_TITLE || '',
    targetMilestone: env.TARGET_MILESTONE || '',
    labels: env.LABELS || '',
    
    // Flags
    dryRun: env.DRY_RUN === 'true',
    autoMode: env.AUTO_MODE === 'true'
};

// --- Helpers ---
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

// --- Main Logic ---

function main() {
    console.log('📋 Generating GitHub Issue content...');

    // 1. Determine Issue Title
    let issueTitle = CONFIG.explicitTitle;
    if (!issueTitle) {
        // Summarize from WORK_PURPOSE (Max 50 chars)
        // Remove common prefixes
        const firstLine = CONFIG.workPurpose.split('\n')[0];
        issueTitle = firstLine.replace(/^[目的指示概要]*[:：]\s*/, '').substring(0, 50);
    }
    
    // Fallback to commit message
    if (!issueTitle || issueTitle === '（変更の目的を記述してください）') {
        issueTitle = CONFIG.commitMessage.replace(/^Push: /, '').substring(0, 50);
    }
    
    // Final fallback
    if (!issueTitle) {
        issueTitle = `Update: ${new Date().toISOString().split('T')[0]}`;
    }

    // 2. Build Content Sections
    
    // Command Log
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
    const majorCommands = CONFIG.investigationCommands || '（調査に使用した主要なコマンドがあれば記述してください）';

    // Git Info
    const diffStat = getDiffStat();
    const diffLog = getDiffLog();
    const commitListSimple = getCommitListSimple();
    const author = getGitConfigUser();
    const dateStr = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }); // 簡易的な日付

    // Recent Issues (Strictly Limit to 10)
    let recentContext = "(直近のIssueは見つかりませんでした)";
    try {
        // --sort created-desc ensures latest first. --limit 10 ensures strict limit.
        // If repoUrl is provided, use it. Otherwise rely on gh context.
        const repoArg = CONFIG.repoUrl ? `--repo "${CONFIG.repoUrl}"` : '';
        const recentJson = runCommandOutput(`gh issue list ${repoArg} --state all --limit 10 --sort created --json number,title,author,createdAt,url`);
        
        if (recentJson) {
            const issues = JSON.parse(recentJson);
            if (issues.length > 0) {
                recentContext = issues.map(i => `- #${i.number} ${i.title} (${i.author.login}) ${i.createdAt} ${i.url}`).join('\n');
            }
        }
    } catch (e) {
        console.warn('⚠️ Failed to fetch recent issues:', e.message);
    }

    // 3. Construct Issue Body
    const issueBody = `## 🤖 AI Development Cycle

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
    if (CONFIG.dryRun) {
        console.log('\n[DRY RUN] Issue would be created with:');
        console.log(`Title: ${issueTitle}`);
        console.log(`Labels: ${CONFIG.labels}`);
        console.log(`Milestone: ${CONFIG.targetMilestone}`);
        console.log('--- Body ---');
        console.log(issueBody);
    } else {
        console.log('🚀 Creating GitHub Issue...');
        
        // Write body to temp file to avoid shell escaping issues
        const tempBodyFile = `/tmp/issue_body_${Date.now()}.md`;
        fs.writeFileSync(tempBodyFile, issueBody);
        
        try {
            const repoArg = CONFIG.repoUrl ? `--repo "${CONFIG.repoUrl}"` : '';
            const labelArg = CONFIG.labels ? `--label "${CONFIG.labels.split(',').join('","')}"` : '';
            const milestoneArg = CONFIG.targetMilestone ? `--milestone "${CONFIG.targetMilestone}"` : '';
            
            // gh issue create
            const cmd = `gh issue create ${repoArg} --title "${issueTitle.replace(/"/g, '\\"')}" --body-file "${tempBodyFile}" ${labelArg} ${milestoneArg}`;
            
            // Execute
            // We use execSync with inherited stdio to let gh interact if needed (though we provide all args)
            // But here we want to capture the URL.
            const issueUrl = execSync(cmd, { encoding: 'utf-8' }).trim();
            console.log(`✅ Issue created successfully: ${issueUrl}`);
            
            // Cleanup
            fs.unlinkSync(tempBodyFile);
            
        } catch (e) {
            console.error('❌ Failed to create issue:', e.message);
            if (fs.existsSync(tempBodyFile)) fs.unlinkSync(tempBodyFile);
            process.exit(1);
        }
    }
}

main();
