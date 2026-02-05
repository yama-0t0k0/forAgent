#!/bin/bash

# Universal Safe Push Script for UI-centric Development Project
# UI中心開発プロジェクト向けユニバーサルセーフプッシュスクリプト
# This script ensures safe git operations across the entire project
# プロジェクト全体で安全なGit操作を保証します
# Usage: ./safe_push.sh [commit_message] [--auto]
# 使用法: ./safe_push.sh [コミットメッセージ] [--auto]
# Note: Auto mode is enabled by default. Use without --auto flag for automatic operation.
# 注意: 自動モードはデフォルトで有効です。--autoフラグなしでも自動的に動作します。

set -e  # Exit on any error / エラー発生時に終了

# Global variables / グローバル変数
AUTO_MODE=true
TARGET_BRANCH="yama"
DRY_RUN=false
AUTHORIZATION_EVIDENCE=""
TARGET_MILESTONE=""

# Capture original arguments for delegation
# 委譲用に元の引数を保持
ORIGINAL_ARGS=("$@")

# Parse command line arguments
# コマンドライン引数の解析
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE=true
                shift
                ;;
            --authorized-by)
                AUTHORIZATION_EVIDENCE="$2"
                shift 2
                ;;
            --milestone)
                TARGET_MILESTONE="$2"
                shift 2
                ;;
            --prompt)
                PROMPT_SUMMARY="$2"
                shift 2
                ;;
            --title)
                EXPLICIT_TITLE="$2"
                shift 2
                ;;
            --outcome)
                OUTCOME_SUMMARY="$2"
                shift 2
                ;;
            --next)
                NEXT_TASKS="$2"
                shift 2
                ;;
            --intent)
                INTENT_DESCRIPTION="$2"
                shift 2
                ;;
            --context)
                CONTEXT_NOTES="$2"
                shift 2
                ;;
            --command-log)
                COMMAND_LOG_FILE="$2"
                shift 2
                ;;
            --main-commands)
                INVESTIGATION_COMMANDS="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                if [ -z "$COMMIT_MESSAGE" ]; then
                    COMMIT_MESSAGE="$1"
                fi
                shift
                ;;
        esac
    done
}

# Function to collect additional information for Issue
# Issue用の追加情報を収集する関数
collect_issue_info() {
    if [ "$AUTO_MODE" = true ]; then
        # Check for mandatory arguments in Auto Mode
        # 自動モードでの必須引数チェック
        local missing_args=false
        
        if [ -z "$PROMPT_SUMMARY" ]; then
            echo "⚠️  Missing argument: --prompt (User Prompt)"
            missing_args=true
        fi
        if [ -z "$INTENT_DESCRIPTION" ]; then
            echo "⚠️  Missing argument: --intent (Work Purpose)"
            missing_args=true
        fi
        if [ -z "$OUTCOME_SUMMARY" ]; then
            echo "⚠️  Missing argument: --outcome (Work Outcome)"
            missing_args=true
        fi

        if [ -z "$NEXT_TASKS" ]; then
            echo "⚠️  Missing argument: --next (Next Tasks)"
            missing_args=true
        fi
        if [ -z "$CONTEXT_NOTES" ]; then
            echo "⚠️  Missing argument: --context (Context)"
            missing_args=true
        fi

        if [ "$missing_args" = true ]; then
            echo "🤖 Auto mode is active but mandatory arguments are missing."
            echo "   自動モードが有効ですが、必須引数が不足しています。"
            echo "   Attempting interactive input (Timeout: 10s)..."
            echo "   対話入力を試行します（タイムアウト: 10秒）..."
            
            # Attempt interactive input with timeout to prevent CI freeze
            # CIフリーズ防止のためタイムアウト付きで対話入力を試行
            if [ -z "$PROMPT_SUMMARY" ]; then
                echo "Please enter the summary of the prompt/instruction:"
                echo "指示内容の要約を入力してください:"
                if ! read -t 10 -r PROMPT_SUMMARY; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi
            
            if [ -z "$INTENT_DESCRIPTION" ]; then
                echo "Please enter the intent/purpose of this work:"
                echo "作業の目的を入力してください:"
                if ! read -t 10 -r INTENT_DESCRIPTION; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi
            
            if [ -z "$OUTCOME_SUMMARY" ]; then
                echo "Please enter the outcome/result of this work:"
                echo "作業の結果を入力してください:"
                if ! read -t 10 -r OUTCOME_SUMMARY; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi

            if [ -z "$NEXT_TASKS" ]; then
                echo "Please enter recommended next tasks:"
                echo "推奨される次回のタスクを入力してください:"
                if ! read -t 10 -r NEXT_TASKS; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi

            if [ -z "$CONTEXT_NOTES" ]; then
                echo "Please enter background/context details:"
                echo "背景/コンテキストの詳細を入力してください:"
                if ! read -t 10 -r CONTEXT_NOTES; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi
        fi

        if [ -z "$NEXT_TASKS" ]; then
            NEXT_TASKS="（推奨される次回のタスクを具体的に記述してください）"
        fi
        if [ -z "$CONTEXT_NOTES" ]; then
            CONTEXT_NOTES="（背景・技術的制約・コンテキストを具体的に記述してください）"
        fi
        return
    fi

    echo ""
    echo "📝 Collecting additional information for Issue..."
    echo "📝 Issue用の追加情報を収集しています..."
    
    if [ -z "$PROMPT_SUMMARY" ]; then
        echo "Please enter the summary of the prompt/instruction for this work:"
        echo "この作業の指示内容の要約を入力してください:"
        read -r PROMPT_SUMMARY
        if [ -z "$PROMPT_SUMMARY" ]; then
            PROMPT_SUMMARY="No prompt summary provided."
        fi
    fi
    
    if [ -z "$NEXT_TASKS" ]; then
        echo "Please enter recommended next tasks:"
        echo "推奨される次回のタスクを入力してください:"
        read -r NEXT_TASKS
        if [ -z "$NEXT_TASKS" ]; then
            NEXT_TASKS="No specific next tasks."
        fi
    fi
    
    if [ -z "$INTENT_DESCRIPTION" ]; then
        echo "Please enter the intent/purpose of this work:"
        echo "作業の目的を入力してください:"
        read -r INTENT_DESCRIPTION
        if [ -z "$INTENT_DESCRIPTION" ]; then
            INTENT_DESCRIPTION="No intent provided."
        fi
    fi
    
    if [ -z "$CONTEXT_NOTES" ]; then
        echo "Please enter background/context details:"
        echo "背景/コンテキストの詳細を入力してください:"
        read -r CONTEXT_NOTES
        if [ -z "$CONTEXT_NOTES" ]; then
            CONTEXT_NOTES="（背景・技術的制約・コンテキストを具体的に記述してください）"
        fi
    fi
}

echo "🚀 Universal Safe Push Script for UI-centric Development"
echo "=================================================="

if [ "$AUTO_MODE" = true ]; then
    echo "🤖 Running in automatic mode"
    echo "🤖 自動モードで実行中"
fi

# Function to ensure we're on the yama branch
# yamaブランチにいることを確認する関数
ensure_yama_branch() {
    echo "🔍 Checking current branch..."
    echo "🔍 現在のブランチを確認中..."
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
        echo "⚠️  Currently on branch '$CURRENT_BRANCH', switching to '$TARGET_BRANCH'"
        echo "⚠️  現在は '$CURRENT_BRANCH' です。 '$TARGET_BRANCH' に切り替えます"
        
        # Check if yama branch exists
        # yamaブランチが存在するか確認
        if git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
            git checkout $TARGET_BRANCH
            echo "✅ Switched to branch '$TARGET_BRANCH'"
        else
            echo "❌ Error: Branch '$TARGET_BRANCH' does not exist"
            exit 1
        fi
    else
        echo "✅ Already on branch '$TARGET_BRANCH'"
    fi
}

# Function to check if we're in a git repository
# Gitリポジトリ内にいるか確認する関数
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ Error: Not in a git repository"
        exit 1
    fi
}

# Function to synchronize with remote
# リモートと同期する関数
sync_remote() {
    echo "🔄 Synchronizing with remote..."
    echo "🔄 リモートと同期中..."
    git fetch origin "$TARGET_BRANCH"
    
    LOCAL_HASH=$(git rev-parse HEAD)
    REMOTE_HASH=$(git rev-parse "origin/$TARGET_BRANCH")
    BASE_HASH=$(git merge-base HEAD "origin/$TARGET_BRANCH")
    
    if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
        echo "✅ Local branch is up to date with remote"
        echo "✅ ローカルブランチはリモートと最新の状態です"
    elif [ "$LOCAL_HASH" = "$BASE_HASH" ]; then
        echo "⚠️  Local branch is behind remote. Pulling changes..."
        echo "⚠️  ローカルブランチが遅れています。変更をプルします..."
        if git pull --rebase origin "$TARGET_BRANCH"; then
            echo "✅ Successfully pulled and rebased changes"
        else
            echo "❌ Error: Failed to pull changes. Please resolve conflicts manually."
            exit 1
        fi
    elif [ "$REMOTE_HASH" = "$BASE_HASH" ]; then
        echo "✅ Local branch is ahead of remote (safe to push)"
        echo "✅ ローカルブランチが進んでいます（プッシュ可能）"
    else
        echo "⚠️  Branches have diverged. Pulling changes..."
        echo "⚠️  ブランチが分岐しています。変更をプルします..."
        if git pull --rebase origin "$TARGET_BRANCH"; then
            echo "✅ Successfully pulled and rebased changes"
        else
            echo "❌ Error: Failed to pull changes. Please resolve conflicts manually."
            exit 1
        fi
    fi
}

# Function to handle all changes (untracked, modified, deleted)
# 全ての変更（未追跡、変更、削除）を処理する関数
handle_changes() {
    echo "🔍 Checking working directory status..."
    echo "🔍 作業ディレクトリの状態を確認中..."
    git status
    echo ""
    
    if [ -z "$(git status --porcelain)" ]; then
        echo "✅ Working directory clean"
        echo "✅ 作業ディレクトリはクリーンです"
        return 0
    fi

    echo "📦 Preparing changes..."
    echo "📦 変更を準備中..."
    if [ "$AUTO_MODE" = true ]; then
        git add -A
        echo "✅ All changes (including deletions and untracked files) staged (auto mode)"
        echo "✅ 全ての変更（削除や未追跡ファイルを含む）がステージされました（自動モード）"
    else
        read -p "Stage ALL changes (including deletions)? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            echo "✅ All changes staged"
        else
            echo "❌ Manual staging requested. Exiting safe push."
            exit 1
        fi
    fi
    
    echo "🔍 Verifying staged changes..."
    echo "🔍 ステージされた変更を確認中..."
    git status
    echo ""
}


# Function to check for staged changes
# ステージされた変更があるか確認する関数
check_staged_changes() {
    echo "🔍 Checking for staged changes..."
    echo "🔍 ステージされた変更を確認中..."
    
    STAGED_FILES=$(git diff --cached --name-only)
    
    if [ -z "$STAGED_FILES" ]; then
        echo "⚠️  No staged changes found. Continuing (always-on Issue creation)."
        echo "⚠️  ステージされた変更が見つかりません。続行します（Issue作成は常時実行）。"
        return 0
    fi
    
    echo "✅ Found staged changes:"
    echo "$STAGED_FILES"
}

# Function to commit changes
# 変更をコミットする関数
commit_changes() {
    echo ""
    echo "📝 Ready to commit changes"
    echo "📝 コミットの準備ができました"
    
    if [ -z "$COMMIT_MESSAGE" ]; then
        if [ "$AUTO_MODE" = true ]; then
            COMMIT_MESSAGE="Auto commit: $(date '+%Y-%m-%d %H:%M:%S')"
            echo "✅ Using auto-generated commit message: $COMMIT_MESSAGE"
        else
            read -p "Enter commit message: " COMMIT_MESSAGE
        fi
    fi
    
    if [ -z "$COMMIT_MESSAGE" ]; then
        echo "❌ Commit message cannot be empty"
        exit 1
    fi
    
    if git diff --cached --quiet; then
        echo "ℹ️  No staged changes to commit. Skipping commit step."
        echo "ℹ️  コミットすべきステージ済みの変更がありません。コミット手順をスキップします。"
    else
        git commit -m "$COMMIT_MESSAGE"
        echo "✅ Changes committed successfully"
        echo "✅ 変更が正常にコミットされました"
    fi
}

# Function to push changes
# 変更をプッシュする関数
push_changes() {
    echo ""
    echo "🚀 Pushing changes to remote repository..."
    echo "🚀 リモートリポジトリに変更をプッシュ中..."
    
    if [ "$AUTO_MODE" = true ]; then
        ALLOW_PUSH=1 git push origin "$TARGET_BRANCH"
        echo "✅ Changes pushed successfully to '$TARGET_BRANCH' (auto mode)"
        echo "✅ '$TARGET_BRANCH' へのプッシュが成功しました（自動モード）"
    else
        read -p "Push to branch '$TARGET_BRANCH'? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            ALLOW_PUSH=1 git push origin "$TARGET_BRANCH"
            echo "✅ Changes pushed successfully to '$TARGET_BRANCH'"
        else
            echo "❌ Push cancelled"
            exit 1
        fi
    fi
}

# Function to capture diff info and create GitHub Issue
# 差分情報を取得しGitHub Issueを作成する関数
create_push_issue() {
    echo ""
    echo "📋 GitHub Issue を作成しています (Delegating to node script)..."
    echo "📋 GitHub Issueを作成しています（Nodeスクリプトへ委譲）..."

    # Check if node exists
    # nodeコマンドの存在確認
    if ! command -v node &> /dev/null; then
        echo "❌ Error: 'node' command not found. Cannot run issue creation script."
        return 1
    fi

    # Repository URL specified by user
    # ユーザー指定のリポジトリURL
    export REPO_URL="https://github.com/yama-0t0k0/engineer-registration-app"
    
    # Export variables for node script
    # Nodeスクリプト用に変数をエクスポート
    export TARGET_BRANCH
    export PREV_PUSH_HASH
    export CURRENT_HASH=$(git rev-parse HEAD)
    export COMMIT_MESSAGE
    export USER_PROMPT="$PROMPT_SUMMARY"
    export WORK_PURPOSE="$INTENT_DESCRIPTION"
    export WORK_OUTCOME="$OUTCOME_SUMMARY"
    export CONTEXT_NOTES
    export NEXT_TASKS
    export COMMAND_LOG_FILE
    export INVESTIGATION_COMMANDS
    export EXPLICIT_TITLE
    export TARGET_MILESTONE
    export DRY_RUN
    export AUTO_MODE

    # Run the node script
    # Nodeスクリプトを実行
    echo "🔄 Running scripts/create_push_issue.js..."
    if node scripts/create_push_issue.js; then
        echo "✅ Issue creation process completed."
        echo "✅ Issue作成プロセスが完了しました。"
    else
        echo "❌ Issue creation failed."
        echo "❌ Issue作成に失敗しました。"
        # Non-critical failure, do not exit script
        # 致命的なエラーではないため、スクリプトを終了しない
    fi
}

# Function to check if we are in the correct project directory
# 正しいプロジェクトディレクトリにいるか確認する関数
check_project_dir() {
    echo "🔍 Checking project directory..."
    echo "🔍 プロジェクトディレクトリを確認中..."
    if [ ! -f "package.json" ]; then
        echo "❌ Error: package.json not found. Are you in the project root?"
        exit 1
    fi
    
    PROJECT_NAME=$(grep -m 1 '"name":' package.json | cut -d '"' -f 4)
    if [ "$PROJECT_NAME" != "engineer-registration-app-yama" ]; then
        echo "❌ Error: Incorrect project name '$PROJECT_NAME'. This script is for 'engineer-registration-app-yama'."
        exit 1
    fi
    echo "✅ Correct project directory verified"
}

# Function to verify explicit user instruction
# ユーザーの明示的な指示を検証する関数
verify_user_instruction() {
    # Check if we have explicit authorization evidence
    # 明示的な承認エビデンスがあるか確認
    if [ -n "$AUTHORIZATION_EVIDENCE" ]; then
        echo "🛡️  Authorization Evidence: \"$AUTHORIZATION_EVIDENCE\""
        return 0
    fi

    echo "🛑 SAFETY CHECK: Has the user EXPLICITLY requested this push?"
    echo "🛑 安全確認: ユーザーはこのプッシュを明示的に要求しましたか？"
    echo "   (Check chat history. Do not assume 'proceed' or 'fix' means 'push'.)"
    echo "   (チャット履歴を確認してください。'proceed'や'fix'が'push'を意味すると仮定しないでください。)"

    if [ "$AUTO_MODE" = true ]; then
        echo "❌ Error: Missing --authorized-by argument in auto mode."
        echo "❌ エラー: 自動モードで --authorized-by 引数が不足しています。"
        echo "   You must provide the EXACT command/text from the user that authorized this push."
        echo "   プッシュを承認したユーザーの正確なコマンド/テキストを提供する必要があります。"
        echo "   Example: ./safe_push.sh --authorized-by \"Please push the changes\" ..."
        echo "   (This prevents 'brain-dead' confirmation by requiring evidence extraction)"
        echo "   (これにより、エビデンス抽出を要求することで、思考停止による確認を防ぎます)"
        exit 1
    else
        read -p "Please type the keyword that authorized this push (e.g. 'push'): " AUTH_INPUT
        if [ -z "$AUTH_INPUT" ]; then
            echo "❌ Push cancelled: No authorization evidence provided."
            exit 1
        fi
        AUTHORIZATION_EVIDENCE="$AUTH_INPUT"
    fi
}

# Main execution
# メイン実行
main() {
    parse_arguments "$@"

    # Ensure we are in the project root before attempting delegation
    # 委譲を試みる前にプロジェクトルートにいることを確認
    check_project_dir

    # --- Milestone Branching Logic ---
    # --- マイルストーン分岐ロジック ---
    # Case 1: Milestone explicitly provided via argument
    # ケース1: マイルストーンが引数で明示的に提供された場合
    if [ -n "$TARGET_MILESTONE" ]; then
        echo "🔄 Delegating to Milestone Push Script (Milestone: $TARGET_MILESTONE)..."
        echo "🔄 マイルストーンプッシュスクリプトに委譲中 (マイルストーン: $TARGET_MILESTONE)..."
        exec node scripts/push_with_milestone.js "${ORIGINAL_ARGS[@]}"
    fi

    # Case 2: Interactive mode - Ask user
    # ケース2: 対話モード - ユーザーに確認
    if [ "$AUTO_MODE" = false ]; then
        echo "❓ Is this task related to a GitHub Milestone? (y/N)"
        read -n 1 -r REPLY
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Delegating to Milestone Push Script..."
            exec node scripts/push_with_milestone.js "${ORIGINAL_ARGS[@]}"
        fi
    fi
    # ---------------------------------
    
    # 1. Permission Check (Poka-yoke)
    # 1. 許可チェック（ポカヨケ）
    verify_user_instruction

    # Run Local CI Pipeline
    # ローカルCIパイプラインの実行
    if [ -x "./scripts/local_ci.sh" ]; then
        echo "🛡️  Running Local CI Pipeline..."
        echo "🛡️  ローカルCIパイプラインを実行中..."
        ./scripts/local_ci.sh
    elif [ -f "./scripts/local_ci.sh" ]; then
        echo "🛡️  Running Local CI Pipeline..."
        echo "🛡️  ローカルCIパイプラインを実行中..."
        bash ./scripts/local_ci.sh
    else
        echo "⚠️  scripts/local_ci.sh not found. Skipping CI checks."
        echo "⚠️  scripts/local_ci.sh が見つかりません。CIチェックをスキップします。"
    fi

    check_git_repo
    ensure_yama_branch
    handle_changes
    check_staged_changes
    collect_issue_info
    commit_changes
    sync_remote
    
    # Capture remote hash before pushing
    # プッシュ前にリモートハッシュを取得
    PREV_PUSH_HASH=$(git rev-parse "origin/$TARGET_BRANCH")
    
    if [ "$DRY_RUN" = true ]; then
        create_push_issue
    else
        push_changes
        create_push_issue
    fi
    
    echo ""
    echo "🎉 Safe push completed successfully!"
    echo "🎉 セーフプッシュが正常に完了しました！"
    echo "=================================================="
}

# Run main function with all command line arguments
# 全てのコマンドライン引数でmain関数を実行
main "$@"