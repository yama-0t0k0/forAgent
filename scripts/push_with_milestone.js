#!/usr/bin/env node

/**
 * scripts/push_with_milestone.js
 * 
 * GitHub Milestoneと連携したPush & Issue作成スクリプト
 * 
 * 機能:
 * 1. local_ci.sh の実行
 * 2. マイルストーンの対話的選択
 * 3. Git Commit & Push
 * 4. マイルストーン付きIssueの作成
 * 
 * 使用方法:
 * node scripts/push_with_milestone.js "commit message" [options]
 * 
 * Options (safe_push.sh互換):
 * --authorized-by "Evidence"
 * --prompt "User Prompt"
 * --intent "Intent"
 * --outcome "Outcome"
 * --context "Context"
 * --next "Next Tasks"
 */

const { spawnSync, execSync } = require('child_process');
const readline = require('readline');

// --- Configuration ---
const REPO_OWNER = 'yama-0t0k0';
const REPO_NAME = 'engineer-registration-app';
const TARGET_BRANCH = 'yama';
const CI_SCRIPT = './scripts/local_ci.sh'; // パス調整

// --- Helpers ---
function runCommand(command, args, options = {}) {
    const result = spawnSync(command, args, { stdio: 'inherit', encoding: 'utf-8', ...options });
    if (result.error) {
        console.error(`❌ Execution failed: ${command} ${args.join(' ')}`);
        process.exit(1);
    }
    if (result.status !== 0) {
        console.error(`❌ Command failed with exit code ${result.status}: ${command} ${args.join(' ')}`);
        process.exit(result.status);
    }
    return result;
}

function runCommandOutput(command) {
    try {
        return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (e) {
        return null;
    }
}

// --- Argument Parsing ---
const args = process.argv.slice(2);
let commitMessage = '';
const parsedArgs = {
    authorizedBy: '',
    prompt: '',
    intent: '',
    outcome: '',
    context: '',
    next: '',
    milestone: ''
};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--authorized-by') parsedArgs.authorizedBy = args[++i];
    else if (arg === '--prompt') parsedArgs.prompt = args[++i];
    else if (arg === '--intent') parsedArgs.intent = args[++i];
    else if (arg === '--outcome') parsedArgs.outcome = args[++i];
    else if (arg === '--context') parsedArgs.context = args[++i];
    else if (arg === '--next') parsedArgs.next = args[++i];
    else if (arg === '--milestone') parsedArgs.milestone = args[++i];
    else if (!arg.startsWith('--')) commitMessage = arg;
}

if (!commitMessage) {
    console.error('❌ Commit message is required.');
    process.exit(1);
}

if (!parsedArgs.authorizedBy) {
    console.error('❌ --authorized-by is required (Strict Push Policy).');
    process.exit(1);
}

// --- Main Flow ---
async function main() {
    console.log('🚀 Push with Milestone Script');
    console.log('=============================');

    // 1. Check CI
    console.log('\n🔍 Running Local CI...');
    runCommand(CI_SCRIPT, []);

    // 2. Git Pre-checks
    console.log('\n🔍 Checking Git Status...');
    const currentBranch = runCommandOutput('git branch --show-current');
    if (currentBranch !== TARGET_BRANCH) {
        console.error(`❌ Wrong branch. Expected '${TARGET_BRANCH}', got '${currentBranch}'`);
        process.exit(1);
    }
    
    // Sync
    console.log('🔄 Syncing with remote...');
    
    // Check for dirty state
    const isDirty = !!runCommandOutput('git status --porcelain');
    let stashed = false;
    
    if (isDirty) {
        console.log('📦 Stashing changes before pull...');
        runCommand('git', ['stash']);
        stashed = true;
    }

    try {
        runCommand('git', ['pull', '--rebase', 'origin', TARGET_BRANCH]);
    } catch (e) {
        console.error('❌ Failed to pull changes.');
        if (stashed) {
             try { runCommand('git', ['stash', 'pop']); } catch (e) {} 
        }
        process.exit(1);
    }
    
    if (stashed) {
        console.log('📦 Restoring stashed changes...');
        runCommand('git', ['stash', 'pop']);
    }

    // 3. Select Milestone
    let targetMilestone = null;

    // If milestone is provided via argument, try to find it
    if (parsedArgs.milestone) {
        console.log(`\n🔍 Searching for milestone: "${parsedArgs.milestone}"...`);
        try {
            // Fetch specific milestone or filter list
            const json = runCommandOutput(`gh api repos/${REPO_OWNER}/${REPO_NAME}/milestones --method GET -f state=open`);
            const allMilestones = JSON.parse(json);
            targetMilestone = allMilestones.find(m => m.title === parsedArgs.milestone || String(m.number) === String(parsedArgs.milestone));
            
            if (!targetMilestone) {
                console.error(`❌ Milestone "${parsedArgs.milestone}" not found.`);
                process.exit(1);
            }
        } catch (e) {
            console.error('❌ Failed to fetch milestones.');
            process.exit(1);
        }
    } else {
        // Interactive Selection
        console.log('\n📅 Fetching Milestones...');
        let milestones = [];
        try {
            const json = runCommandOutput(`gh api repos/${REPO_OWNER}/${REPO_NAME}/milestones --method GET -f state=open`);
            milestones = JSON.parse(json);
        } catch (e) {
            console.error('❌ Failed to fetch milestones. Is gh installed and authenticated?');
            process.exit(1);
        }

        if (milestones.length === 0) {
            console.error('❌ No open milestones found.');
            process.exit(1);
        }

        console.log('\nSelect a milestone for this push:');
        milestones.forEach((m, idx) => {
            console.log(`${idx + 1}. ${m.title} (Due: ${m.due_on || 'No due date'})`);
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            rl.question('\nEnter number: ', resolve);
        });
        rl.close();

        const selectedIndex = parseInt(answer) - 1;
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= milestones.length) {
            console.error('❌ Invalid selection.');
            process.exit(1);
        }

        targetMilestone = milestones[selectedIndex];
    }

    console.log(`✅ Selected Milestone: ${targetMilestone.title}`);

    // 4. Git Commit & Push
    console.log('\n📦 Committing changes...');
    runCommand('git', ['add', '.']);
    
    // Check if anything to commit
    const status = runCommandOutput('git status --porcelain');
    if (status) {
        runCommand('git', ['commit', '-m', commitMessage]);
    } else {
        console.log('ℹ️  No changes to commit (might be already committed).');
    }

    console.log('\n🚀 Pushing...');
    runCommand('git', ['push', 'origin', TARGET_BRANCH], { env: { ...process.env, ALLOW_PUSH: '1' } });

    // 5. Create Issue
    console.log('\n📋 Creating Issue...');
    
    const issueBody = `
## 🤖 AI Development Cycle (Milestone: ${targetMilestone.title})

### 📝 Implementation Details / 実装内容
${parsedArgs.prompt || '（記述なし）'}

### 🎯 Mission & Intent / 目的と期待される効果
${parsedArgs.intent || '（記述なし）'}

### 🏆 Outcome & Result / 実際の結果
${parsedArgs.outcome || '（記述なし）'}

---

## 📝 Context / 文脈
### 🧠 Background / 背景・コンテキスト
${parsedArgs.context || '（記述なし）'}

### 📋 Changes in this Push
- **Date**: ${new Date().toLocaleString()}
- **Branch**: ${TARGET_BRANCH}
- **Milestone**: ${targetMilestone.title}
- **Authorized By**: ${parsedArgs.authorizedBy}

### 🚀 Recommended Next Tasks
${parsedArgs.next || '（記述なし）'}
    `.trim();

    // Determine Labels based on commit message
    const labels = [];
    const lowerMsg = commitMessage.toLowerCase();
    if (lowerMsg.includes('fix') || lowerMsg.includes('bug')) labels.push('bug');
    if (lowerMsg.includes('feat') || lowerMsg.includes('add')) labels.push('enhancement');
    if (lowerMsg.includes('refactor')) labels.push('refactoring');
    if (lowerMsg.includes('docs')) labels.push('documentation');

    const argsIssue = [
        'issue', 'create',
        '--title', commitMessage,
        '--body', issueBody,
        '--milestone', targetMilestone.title,
        '--label', labels.join(',')
    ];

    runCommand('gh', argsIssue);
    console.log('✅ Issue created successfully with milestone!');
}

main().catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
