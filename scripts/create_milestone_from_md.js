#!/usr/bin/env node

/**
 * scripts/create_milestone_from_md.js
 * 
 * RefactoringPlan.md を解析し、セクションごとにGitHubマイルストーンを作成し、
 * 各タスクをIssueとして作成・紐付け・ステータス同期を行うスクリプト。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');

// --- Configuration ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'yama-0t0k0';
const REPO_NAME = 'forAgent';

// --- Helpers ---

function runCommandSafe(command, args) {
    // console.log(`DEBUG: ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, { encoding: 'utf-8', shell: false });
    
    if (result.error) {
        console.error(`❌ Execution failed: ${command} ${args.join(' ')}`);
        return null;
    }

    if (result.status !== 0) {
        console.error(`❌ Command failed with status ${result.status}: ${command} ${args.join(' ')}`);
        console.error('Stderr:', result.stderr);
        return null;
    }

    return result.stdout.trim();
}

// --- Main Logic ---

function parseMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const milestones = [];
    let currentMilestone = null;
    let currentTask = null;

    lines.forEach(line => {
        const h2Match = line.match(/^##\s+(.+)/);
        const h3Match = line.match(/^###\s+(.+)/);
        
        // H2または特定のH3をマイルストーンとして扱う
        // ユーザー要望により "🔮" を含むH3もマイルストーン候補とする
        let milestoneTitle = null;
        if (h2Match) {
            milestoneTitle = h2Match[1].trim();
        } else if (h3Match && line.includes('🔮')) {
            milestoneTitle = h3Match[1].trim();
        }

        if (milestoneTitle) {
            currentMilestone = {
                title: milestoneTitle,
                description: line + '\n', // タイトル行も含める
                tasks: [],
                isCompleted: false // セクション全体の完了フラグ
            };
            milestones.push(currentMilestone);
            currentTask = null;
            return;
        }

        if (currentMilestone) {
            currentMilestone.description += line + '\n';

            // タスク検出: "1. **タイトル**" 形式
            const taskMatch = line.match(/^\s*\d+\.\s+\*\*(.+?)\*\*/);
            if (taskMatch) {
                currentTask = {
                    title: taskMatch[1].trim(),
                    isCompleted: false
                };
                currentMilestone.tasks.push(currentTask);
            }

            // 完了ステータス検出
            if (line.includes('✅ 完了')) {
                if (currentTask) {
                    currentTask.isCompleted = true;
                } else {
                    currentMilestone.isCompleted = true;
                }
            }
        }
    });

    return milestones;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node scripts/create_milestone_from_md.js <path_to_md_file>');
        process.exit(1);
    }

    const mdPath = args[0];
    if (!fs.existsSync(mdPath)) {
        console.error(`❌ File not found: ${mdPath}`);
        process.exit(1);
    }

    console.log(`🔍 Parsing ${mdPath}...`);
    const milestonesData = parseMarkdown(mdPath);
    console.log(`Found ${milestonesData.length} milestones.`);

    // Preview
    milestonesData.forEach(m => {
        console.log(`\n📌 Milestone: ${m.title}`);
        console.log(`   Completed: ${m.isCompleted}`);
        console.log(`   Tasks (${m.tasks.length}):`);
        if (m.tasks.length === 0) {
             console.log(`     - (No sub-tasks, will create Issue for milestone itself)`);
        } else {
            m.tasks.forEach(t => console.log(`     - [${t.isCompleted ? 'x' : ' '}] ${t.title}`));
        }
    });

    // Confirm
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => rl.question('\nProceed to sync with GitHub? (y/N) ', resolve));
    rl.close();
    if (!answer.match(/^[Yy]/)) {
        console.log('Cancelled.');
        process.exit(0);
    }

    // 1. Fetch existing milestones
    console.log('Fetching existing milestones...');
    const msJson = runCommandSafe('gh', ['api', `repos/${REPO_OWNER}/${REPO_NAME}/milestones`, '--method', 'GET', '-f', 'state=all', '--paginate']);
    const existingMilestones = msJson ? JSON.parse(msJson) : [];

    // 2. Fetch all issues (to avoid duplicates)
    console.log('Fetching existing issues...');
    const issuesJson = runCommandSafe('gh', ['issue', 'list', '--state', 'all', '--limit', '1000', '--json', 'title,number,state,milestone']);
    const existingIssues = issuesJson ? JSON.parse(issuesJson) : [];

    for (const mData of milestonesData) {
        // --- Milestone Sync ---
        let milestone = existingMilestones.find(m => m.title === mData.title);
        
        if (!milestone) {
            console.log(`Creating Milestone: ${mData.title}`);
            const res = runCommandSafe('gh', ['api', `repos/${REPO_OWNER}/${REPO_NAME}/milestones`, '--method', 'POST', '-f', `title=${mData.title}`, '-f', `description=${mData.description.slice(0, 1000)}...`]); // Description length limit precaution
            if (res) milestone = JSON.parse(res);
        } else {
            console.log(`Updating Milestone: ${mData.title}`);
            runCommandSafe('gh', ['api', `repos/${REPO_OWNER}/${REPO_NAME}/milestones/${milestone.number}`, '--method', 'PATCH', '-f', `description=${mData.description.slice(0, 1000)}...`]);
        }

        if (!milestone) continue;

        // --- Issue Sync ---
        // タスクがある場合はタスクごとにIssue作成、なければマイルストーン自体を1つのIssueとする
        const tasksToProcess = mData.tasks.length > 0 
            ? mData.tasks 
            : [{ title: `Implement: ${mData.title}`, isCompleted: mData.isCompleted }];

        for (const task of tasksToProcess) {
            // Find existing issue by title
            let issue = existingIssues.find(i => i.title === task.title);
            
            // Issue Body にセクション全体の説明を含める
            const issueBody = `Generated from RefactoringPlan.md\n\n${mData.description}`;

            if (!issue) {
                console.log(`  Creating Issue: ${task.title}`);
                const createArgs = [
                    'issue', 'create',
                    '--title', task.title,
                    '--body', issueBody,
                    '--milestone', mData.title,
                    '--label', 'refactoring_plan'
                ];
                const res = runCommandSafe('gh', createArgs);
                
                if (task.isCompleted) {
                    if (res) {
                        const match = res.match(/\/issues\/(\d+)$/);
                        if (match) {
                            console.log(`  Closing Issue #${match[1]}`);
                            runCommandSafe('gh', ['issue', 'close', match[1]]);
                        }
                    }
                }
            } else {
                // Issue exists
                console.log(`  Issue exists: ${task.title} (#${issue.number})`);
                
                // Check Milestone Link
                if (!issue.milestone || issue.milestone.title !== milestone.title) {
                    console.log(`    Linking to milestone...`);
                    runCommandSafe('gh', ['issue', 'edit', issue.number.toString(), '--milestone', milestone.title]);
                }

                // Update Body to reflect latest MD content
                // runCommandSafe('gh', ['issue', 'edit', issue.number.toString(), '--body', issueBody]);

                // Check Status
                const shouldBeClosed = task.isCompleted;
                const isClosed = issue.state === 'closed';

                if (shouldBeClosed && !isClosed) {
                    console.log(`    Closing...`);
                    runCommandSafe('gh', ['issue', 'close', issue.number.toString()]);
                } else if (!shouldBeClosed && isClosed) {
                    console.log(`    Re-opening...`);
                    runCommandSafe('gh', ['issue', 'reopen', issue.number.toString()]);
                }
            }
        }
    }
    
    console.log('\n✅ Sync Completed!');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
