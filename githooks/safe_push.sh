#!/bin/bash

# Universal Safe Push Script for UI-centric Development Project
# This script ensures safe git operations across the entire project
# Usage: ./safe_push.sh [commit_message] [--auto]
# Note: Auto mode is enabled by default. Use without --auto flag for automatic operation.

set -e  # Exit on any error

# Global variables
AUTO_MODE=true
TARGET_BRANCH="yama"
DRY_RUN=false

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE=true
                shift
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
collect_issue_info() {
    if [ "$AUTO_MODE" = true ]; then
        # Check for mandatory arguments in Auto Mode
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

        if [ "$missing_args" = true ]; then
            echo "🤖 Auto mode is active but mandatory arguments are missing."
            echo "   Attempting interactive input (Timeout: 10s)..."
            
            # Attempt interactive input with timeout to prevent CI freeze
            if [ -z "$PROMPT_SUMMARY" ]; then
                echo "Please enter the summary of the prompt/instruction:"
                if ! read -t 10 -r PROMPT_SUMMARY; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi
            
            if [ -z "$INTENT_DESCRIPTION" ]; then
                echo "Please enter the intent/purpose of this work:"
                if ! read -t 10 -r INTENT_DESCRIPTION; then
                    echo "❌ Input timed out."
                    exit 1
                fi
            fi
            
            if [ -z "$OUTCOME_SUMMARY" ]; then
                echo "Please enter the outcome/result of this work:"
                if ! read -t 10 -r OUTCOME_SUMMARY; then
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
    
    if [ -z "$PROMPT_SUMMARY" ]; then
        echo "Please enter the summary of the prompt/instruction for this work:"
        read -r PROMPT_SUMMARY
        if [ -z "$PROMPT_SUMMARY" ]; then
            PROMPT_SUMMARY="No prompt summary provided."
        fi
    fi
    
    if [ -z "$NEXT_TASKS" ]; then
        echo "Please enter recommended next tasks:"
        read -r NEXT_TASKS
        if [ -z "$NEXT_TASKS" ]; then
            NEXT_TASKS="No specific next tasks."
        fi
    fi
    
    if [ -z "$INTENT_DESCRIPTION" ]; then
        echo "Please enter the intent/purpose of this work:"
        read -r INTENT_DESCRIPTION
        if [ -z "$INTENT_DESCRIPTION" ]; then
            INTENT_DESCRIPTION="No intent provided."
        fi
    fi
    
    if [ -z "$CONTEXT_NOTES" ]; then
        echo "Please enter background/context details:"
        read -r CONTEXT_NOTES
        if [ -z "$CONTEXT_NOTES" ]; then
            CONTEXT_NOTES="（背景・技術的制約・コンテキストを具体的に記述してください）"
        fi
    fi
}

# Function to detect labels based on content
detect_labels() {
    LABELS=""
    local content="${COMMIT_MESSAGE} ${PROMPT_SUMMARY}"
    # Convert to lowercase for case-insensitive matching
    local lower_content=$(echo "$content" | tr '[:upper:]' '[:lower:]')
    
    # Check for bug/fix
    if [[ "$lower_content" =~ "fix" ]] || \
       [[ "$lower_content" =~ "bug" ]] || \
       [[ "$lower_content" =~ "resolve" ]] || \
       [[ "$lower_content" =~ "error" ]] || \
       [[ "$lower_content" =~ "fail" ]] || \
       [[ "$lower_content" =~ "修正" ]] || \
       [[ "$lower_content" =~ "バグ" ]] || \
       [[ "$lower_content" =~ "エラー" ]]; then
        LABELS="${LABELS}bug,"
    fi
    
    # Check for enhancement/feature
    if [[ "$lower_content" =~ "feat" ]] || \
       [[ "$lower_content" =~ "add" ]] || \
       [[ "$lower_content" =~ "new" ]] || \
       [[ "$lower_content" =~ "create" ]] || \
       [[ "$lower_content" =~ "implement" ]] || \
       [[ "$lower_content" =~ "update" ]] || \
       [[ "$lower_content" =~ "improve" ]] || \
       [[ "$lower_content" =~ "追加" ]] || \
       [[ "$lower_content" =~ "機能" ]] || \
       [[ "$lower_content" =~ "作成" ]] || \
       [[ "$lower_content" =~ "実装" ]] || \
       [[ "$lower_content" =~ "更新" ]] || \
       [[ "$lower_content" =~ "改善" ]]; then
        LABELS="${LABELS}enhancement,"
    fi
    
    # Check for documentation
    if [[ "$lower_content" =~ "doc" ]] || \
       [[ "$lower_content" =~ "readme" ]] || \
       [[ "$lower_content" =~ "postmortem" ]] || \
       [[ "$lower_content" =~ "ドキュメント" ]] || \
       [[ "$lower_content" =~ "資料" ]]; then
        LABELS="${LABELS}documentation,"
    fi
    
    # Check for refactoring
    if [[ "$lower_content" =~ "refactor" ]] || \
       [[ "$lower_content" =~ "clean" ]] || \
       [[ "$lower_content" =~ "optimize" ]] || \
       [[ "$lower_content" =~ "simplify" ]] || \
       [[ "$lower_content" =~ "restructure" ]] || \
       [[ "$lower_content" =~ "リファクタ" ]] || \
       [[ "$lower_content" =~ "整理" ]] || \
       [[ "$lower_content" =~ "最適化" ]]; then
        LABELS="${LABELS}refactoring,"
    fi

    # Check for testing
    if [[ "$lower_content" =~ "test" ]] || \
       [[ "$lower_content" =~ "spec" ]] || \
       [[ "$lower_content" =~ "coverage" ]] || \
       [[ "$lower_content" =~ "テスト" ]] || \
       [[ "$lower_content" =~ "検証" ]]; then
        LABELS="${LABELS}testing,"
    fi
    
    # Remove trailing comma
    LABELS=${LABELS%,}
    
    if [ -n "$LABELS" ]; then
        echo "🏷️  Detected labels: $LABELS"
    else
        echo "ℹ️  No specific labels detected."
    fi
}

echo "🚀 Universal Safe Push Script for UI-centric Development"
echo "=================================================="
if [ "$AUTO_MODE" = true ]; then
    echo "🤖 Running in automatic mode"
fi

# Function to ensure we're on the yama branch
ensure_yama_branch() {
    echo "🔍 Checking current branch..."
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
        echo "⚠️  Currently on branch '$CURRENT_BRANCH', switching to '$TARGET_BRANCH'"
        
        # Check if yama branch exists
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
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ Error: Not in a git repository"
        exit 1
    fi
}

# Function to synchronize with remote
sync_remote() {
    echo "� Synchronizing with remote..."
    git fetch origin "$TARGET_BRANCH"
    
    LOCAL_HASH=$(git rev-parse HEAD)
    REMOTE_HASH=$(git rev-parse "origin/$TARGET_BRANCH")
    BASE_HASH=$(git merge-base HEAD "origin/$TARGET_BRANCH")
    
    if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
        echo "✅ Local branch is up to date with remote"
    elif [ "$LOCAL_HASH" = "$BASE_HASH" ]; then
        echo "⚠️  Local branch is behind remote. Pulling changes..."
        if git pull --rebase origin "$TARGET_BRANCH"; then
            echo "✅ Successfully pulled and rebased changes"
        else
            echo "❌ Error: Failed to pull changes. Please resolve conflicts manually."
            exit 1
        fi
    elif [ "$REMOTE_HASH" = "$BASE_HASH" ]; then
        echo "✅ Local branch is ahead of remote (safe to push)"
    else
        echo "⚠️  Branches have diverged. Pulling changes..."
        if git pull --rebase origin "$TARGET_BRANCH"; then
            echo "✅ Successfully pulled and rebased changes"
        else
            echo "❌ Error: Failed to pull changes. Please resolve conflicts manually."
            exit 1
        fi
    fi
}

# Function to handle all changes (untracked, modified, deleted)
handle_changes() {
    echo "🔍 Checking working directory status..."
    git status
    echo ""
    
    if [ -z "$(git status --porcelain)" ]; then
        echo "✅ Working directory clean"
        return 0
    fi

    echo "📦 Preparing changes..."
    if [ "$AUTO_MODE" = true ]; then
        git add -A
        echo "✅ All changes (including deletions and untracked files) staged (auto mode)"
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
    git status
    echo ""
}


# Function to check for staged changes
check_staged_changes() {
    echo "🔍 Checking for staged changes..."
    
    STAGED_FILES=$(git diff --cached --name-only)
    
    if [ -z "$STAGED_FILES" ]; then
        echo "⚠️  No staged changes found. Continuing (always-on Issue creation)."
        return 0
    fi
    
    echo "✅ Found staged changes:"
    echo "$STAGED_FILES"
}

# Function to commit changes
commit_changes() {
    echo ""
    echo "📝 Ready to commit changes"
    
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
    else
        git commit -m "$COMMIT_MESSAGE"
        echo "✅ Changes committed successfully"
    fi
}

# Function to push changes
push_changes() {
    echo ""
    echo "🚀 Pushing changes to remote repository..."
    
    if [ "$AUTO_MODE" = true ]; then
        ALLOW_PUSH=1 git push origin "$TARGET_BRANCH"
        echo "✅ Changes pushed successfully to '$TARGET_BRANCH' (auto mode)"
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
create_push_issue() {
    echo ""
    echo "📋 GitHub Issue を作成しています..."

    # Check if gh command exists
    if ! command -v gh &> /dev/null; then
        echo "⚠️  'gh' コマンドが見つかりません。Issue作成をスキップします。"
        return
    fi

    # Check if logged in to gh
    if ! gh auth status &> /dev/null; then
        echo "⚠️  GitHub CLI にログインしていません。Issue作成をスキップします。"
        return
    fi

    # Use captured PREV_PUSH_HASH
    if [ -z "$PREV_PUSH_HASH" ]; then
         PREV_PUSH_HASH=$(git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)
    fi

    CURRENT_HASH=$(git rev-parse HEAD)

    # Use defaults if not provided (should be provided by AI agent in practice)
    USER_PROMPT=${PROMPT_SUMMARY:-"（指示内容を記述してください）"}
    WORK_PURPOSE=${INTENT_DESCRIPTION:-"（変更の目的を記述してください）"}
    WORK_OUTCOME=${OUTCOME_SUMMARY:-"（実行結果を記述してください）"}

    # Refine Title: 
    # 1. Use explicit --title if provided
    # 2. Otherwise, summarize from WORK_PURPOSE (Max 50 chars)
    if [ -n "$EXPLICIT_TITLE" ]; then
        ISSUE_TITLE=$(echo "$EXPLICIT_TITLE" | cut -c 1-50)
    else
        # Remove common prefixes and get the first line, then trim to 50 chars
        ISSUE_TITLE=$(echo "$WORK_PURPOSE" | head -n 1 | sed 's/^[目的指示概要]*：//' | cut -c 1-50)
    fi
    
    # Fallback to commit message if title is still empty or default
    if [ "$ISSUE_TITLE" = "（変更の目的を記述してください）" ] || [ -z "$ISSUE_TITLE" ]; then
        ISSUE_TITLE=$(echo "$COMMIT_MESSAGE" | sed 's/^Push: // ' | cut -c 1-50)
    fi

    # Diff Stat
    DIFF_STAT=$(git diff --stat ${PREV_PUSH_HASH}..${CURRENT_HASH})
    # Diff Log
    DIFF_LOG=$(git log --pretty=format:"- %h %s (%an)" ${PREV_PUSH_HASH}..${CURRENT_HASH})
    
    if [ -z "$DIFF_LOG" ]; then
         DIFF_LOG="(このPushに新しいコミットはありません)"
    fi

    # Recent issues (latest 20) for context building
    RECENT_CONTEXT=$(gh issue list --repo "$REPO_URL" --state all --limit 20 --json number,title,author,createdAt,url --jq '.[] | "- #" + (.number|tostring) + " " + .title + " (" + .author.login + ") " + .createdAt + " " + .url' 2>/dev/null)
    if [ -z "$RECENT_CONTEXT" ]; then
        RECENT_CONTEXT="(直近のIssueは見つかりませんでした)"
    fi

    ISSUE_BODY="## 🤖 AI Development Cycle

### 📝 Implementation Details / 実装内容
$USER_PROMPT

### 🎯 Mission & Intent / 目的と期待される効果
$WORK_PURPOSE

### 🏆 Outcome & Result / 実際の結果
$WORK_OUTCOME

---

## 📝 Context / 文脈
### 🧠 Background / 背景・コンテキスト
${CONTEXT_NOTES:-"修正したモジュール、技術的な制約、依存関係などの背景情報。"}

### 📋 Changes in this Push / 今回の配布内容
- **Date / 日時**: $(date '+%Y-%m-%d %H:%M:%S')
- **Branch / ブランチ**: $TARGET_BRANCH
- **Author / 作成者**: $(git config user.name)
- **Previous Hash / 前回ハッシュ**: \`$PREV_PUSH_HASH\`
- **Current Hash / 今回ハッシュ**: \`$CURRENT_HASH\`

#### Commits / コミットログ
$DIFF_LOG

#### Changed Files / 変更ファイル
\`\`\`
${DIFF_STAT:-"(差分なし)"}
\`\`\`

### 🚀 Recommended Next Tasks / 推奨される次回のタスク
${NEXT_TASKS:-"CI/CDパイプラインの確認、デプロイ後の動作検証など。"}

### 📚 Recent Issues (Latest 20) / 直近のIssue(20件)
$RECENT_CONTEXT
"

    # --- Validation & Interactive Edit ---
    # Construct a validation body that excludes auto-generated context (like Recent Issues)
    # to prevent false positives where past issue titles trigger the placeholder check.
    VALIDATION_BODY="${USER_PROMPT} ${WORK_PURPOSE} ${WORK_OUTCOME} ${CONTEXT_NOTES} ${NEXT_TASKS}"
    
    # Check for placeholders or default/lazy text
    if [[ "$VALIDATION_BODY" == *"記述してください"* ]] || \
       [[ "$VALIDATION_BODY" == *"特になし"* ]] || \
       [[ "$VALIDATION_BODY" == *"No prompt summary provided"* ]] || \
       [[ "$VALIDATION_BODY" == *"No context provided"* ]] || \
       [[ "$VALIDATION_BODY" == *"Automated update via safe_push.sh"* ]]; then
        
        echo ""
        echo "⚠️  Quality Control: Issue body contains placeholder text."
        
        if [ "$AUTO_MODE" = true ]; then
             echo "🤖 Auto mode detected with placeholder text."
             echo "❌ Error: You must provide description arguments in auto mode."
             echo "   Usage example: ./safe_push.sh --prompt 'Add feature X' --intent 'Improve UX' --outcome 'Better performance'"
             echo "   'ポカ避け' triggered: Aborting issue creation to maintain documentation quality."
             exit 1
        else
            echo "   To ensure quality, please refine the issue description."
            echo "   Opening default editor..."
            sleep 2
            
            TEMP_BASE=$(mktemp /tmp/safe_push_issue.XXXXXX)
            TEMP_FILE="${TEMP_BASE}.md"
            mv "$TEMP_BASE" "$TEMP_FILE"
            echo "$ISSUE_BODY" > "$TEMP_FILE"
            
            # Open editor (fallback to nano if EDITOR is not set)
            ${EDITOR:-nano} "$TEMP_FILE"
            
            # Read back the edited content
            ISSUE_BODY=$(cat "$TEMP_FILE")
            rm "$TEMP_FILE"
            
            # Strict Re-validation
            if [[ "$ISSUE_BODY" == *"記述してください"* ]] || \
               [[ "$ISSUE_BODY" == *"Automated update via safe_push.sh"* ]]; then
                 echo ""
                 echo "❌ Error: Placeholder text still present after edit."
                 echo "   'ポカ避け' triggered: Aborting process to maintain documentation quality."
                 exit 1
            fi
            
            echo "✅ Issue content refined."
        fi
    fi
    # -------------------------------------

    echo "Issue を作成しています... ($REPO_URL)"
    
    # Repository URL specified by user
    REPO_URL="https://github.com/yama-0t0k0/engineer-registration-app"
    
    # Detect labels
    detect_labels
    
    if [ "$DRY_RUN" = true ]; then
        echo ""
        echo "🔎 Issue プレビュー (ドライラン)"
        echo "Title: $ISSUE_TITLE"
        echo "----------------------------------------"
        echo "$ISSUE_BODY"
        echo "----------------------------------------"
        return
    fi

    if [ -n "$LABELS" ]; then
        if gh issue create --repo "$REPO_URL" --title "$ISSUE_TITLE" --body "$ISSUE_BODY" --label "$LABELS"; then
            echo "✅ Issue が正常に作成されました"
        else
            echo "❌ Issue の作成に失敗しました"
        fi
    else
        if gh issue create --repo "$REPO_URL" --title "$ISSUE_TITLE" --body "$ISSUE_BODY"; then
            echo "✅ Issue が正常に作成されました"
        else
            echo "❌ Issue の作成に失敗しました"
        fi
    fi
}

# Function to check if we are in the correct project directory
check_project_dir() {
    echo "🔍 Checking project directory..."
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

# Main execution
main() {
    parse_arguments "$@"
    check_project_dir
    
    # Run Local CI Pipeline
    if [ -x "./scripts/local_ci.sh" ]; then
        echo "🛡️  Running Local CI Pipeline..."
        ./scripts/local_ci.sh
    elif [ -f "./scripts/local_ci.sh" ]; then
        echo "🛡️  Running Local CI Pipeline..."
        bash ./scripts/local_ci.sh
    else
        echo "⚠️  scripts/local_ci.sh not found. Skipping CI checks."
    fi

    check_git_repo
    ensure_yama_branch
    sync_remote
    handle_changes
    check_staged_changes
    collect_issue_info
    commit_changes
    
    # Capture remote hash before pushing
    PREV_PUSH_HASH=$(git rev-parse "origin/$TARGET_BRANCH")
    
    if [ "$DRY_RUN" = true ]; then
        create_push_issue
    else
        push_changes
        create_push_issue
    fi
    
    echo ""
    echo "🎉 Safe push completed successfully!"
    echo "=================================================="
}

# Run main function with all command line arguments
main "$@"
