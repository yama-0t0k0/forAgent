#!/usr/bin/env node

/**
 * scripts/create_milestone_from_md.js
 * 
 * 指定されたMarkdownファイルを解析し、GitHubマイルストーンを作成または更新するスクリプト。
 * 
 * 機能:
 * 1. MarkdownファイルのH1タイトル (# Title) をマイルストーン名として抽出
 * 2. ファイル全体の内容をマイルストーンの説明(Description)として使用
 * 3. シェルエスケープ問題を回避するため spawnSync を使用
 * 4. 既存のマイルストーンがある場合は更新(PATCH)を行う
 * 
 * 使用方法:
 * node scripts/create_milestone_from_md.js <path_to_md_file> [due_date]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');

// --- Configuration ---
const REPO_OWNER = 'yama-0t0k0';
const REPO_NAME = 'engineer-registration-app';

// --- Helpers ---

// シェルを経由せずにコマンドを実行するヘルパー
function runCommandSafe(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf-8', shell: false });
    
    if (result.error) {
        console.error(`❌ Execution failed: ${command} ${args.join(' ')}`);
        console.error(result.error);
        return null;
    }

    if (result.status !== 0) {
        console.error(`❌ Command failed with status ${result.status}: ${command} ${args.join(' ')}`);
        console.error('Stderr:', result.stderr);
        return null;
    }

    return result.stdout.trim();
}

function parseMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Find H1 title
    let title = '';
    const h1Match = lines.find(line => line.startsWith('# '));
    if (h1Match) {
        title = h1Match.replace('# ', '').trim();
    } else {
        // Fallback: Use filename
        title = path.basename(filePath, path.extname(filePath));
    }

    const description = content;
    return { title, description };
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node scripts/create_milestone_from_md.js <path_to_md_file> [due_date YYYY-MM-DD]');
        process.exit(1);
    }

    const mdPath = args[0];
    const dueDate = args[1] || null;

    if (!fs.existsSync(mdPath)) {
        console.error(`❌ File not found: ${mdPath}`);
        process.exit(1);
    }

    console.log(`🔍 Parsing ${mdPath}...`);
    const { title, description } = parseMarkdown(mdPath);

    console.log('\n--- Milestone Preview ---');
    console.log(`Title:    ${title}`);
    console.log(`Due Date: ${dueDate || 'None'}`);
    console.log(`Desc Len: ${description.length} chars`);
    console.log('-------------------------');

    // 既存マイルストーンの確認
    console.log('🔍 Checking for existing milestones...');
    // -f を使うとデフォルトで POST になるため、明示的に GET を指定する
    const milestonesJson = runCommandSafe('gh', ['api', `repos/${REPO_OWNER}/${REPO_NAME}/milestones`, '--method', 'GET', '-f', 'state=all']);
    
    if (!milestonesJson) {
        console.error('❌ Failed to fetch milestones.');
        process.exit(1);
    }

    const milestones = JSON.parse(milestonesJson);
    const existingMilestone = milestones.find(m => m.title === title);

    let action = 'create';
    if (existingMilestone) {
        console.log(`⚠️  Milestone "${title}" already exists (ID: ${existingMilestone.number}).`);
        action = 'update';
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const promptMsg = action === 'create' 
        ? 'Create this milestone on GitHub? (y/N) ' 
        : 'Update this existing milestone on GitHub? (y/N) ';

    const answer = await new Promise(resolve => {
        rl.question(promptMsg, resolve);
    });
    rl.close();

    if (!answer.match(/^[Yy]/)) {
        console.log('❌ Cancelled.');
        process.exit(0);
    }

    console.log(`\n🚀 ${action === 'create' ? 'Creating' : 'Updating'} Milestone...`);
    
    const apiPath = action === 'create' 
        ? `repos/${REPO_OWNER}/${REPO_NAME}/milestones`
        : `repos/${REPO_OWNER}/${REPO_NAME}/milestones/${existingMilestone.number}`;
    
    const method = action === 'create' ? 'POST' : 'PATCH';

    // gh api に渡す引数を構築 (spawnSync用配列)
    const ghArgs = ['api', apiPath, '--method', method];
    
    // パラメータを個別の引数として渡す（シェルエスケープ不要）
    ghArgs.push('-f', `title=${title}`);
    ghArgs.push('-f', `description=${description}`);
    
    if (dueDate) {
         if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            console.error('❌ Invalid date format. Use YYYY-MM-DD.');
            process.exit(1);
        }
        ghArgs.push('-f', `due_on=${dueDate}T00:00:00Z`);
    }

    const result = runCommandSafe('gh', ghArgs);
    
    if (result) {
        const m = JSON.parse(result);
        console.log(`✅ Milestone ${action === 'create' ? 'Created' : 'Updated'} Successfully!`);
        console.log(`   Title: ${m.title}`);
        console.log(`   URL:   ${m.html_url}`);
        console.log(`   ID:    ${m.number}`);
    } else {
        console.error(`❌ Failed to ${action} milestone.`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
