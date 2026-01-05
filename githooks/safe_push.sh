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
        if [ -z "$PROMPT_SUMMARY" ]; then
            PROMPT_SUMMARY="Automated update via safe_push.sh"
        fi
        if [ -z "$NEXT_TASKS" ]; then
            NEXT_TASKS="Check CI/CD pipeline and verify deployment."
        fi
        if [ -z "$INTENT_DESCRIPTION" ]; then
            INTENT_DESCRIPTION="Describe the purpose and reasoning behind this change."
        fi
        if [ -z "$CONTEXT_NOTES" ]; then
            CONTEXT_NOTES="Key context: modules touched, constraints, stakeholder needs, and dependencies."
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
            CONTEXT_NOTES="No context provided."
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
        echo "❌ No staged changes found. Nothing to commit."
        exit 1
    else
        echo "✅ Found staged changes:"
        echo "$STAGED_FILES"
    fi
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
    
    git commit -m "$COMMIT_MESSAGE"
    echo "✅ Changes committed successfully"
}

# Function to push changes
push_changes() {
    echo ""
    echo "🚀 Pushing changes to remote repository..."
    
    if [ "$AUTO_MODE" = true ]; then
        git push origin "$TARGET_BRANCH"
        echo "✅ Changes pushed successfully to '$TARGET_BRANCH' (auto mode)"
    else
        read -p "Push to branch '$TARGET_BRANCH'? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git push origin "$TARGET_BRANCH"
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
    echo "📋 Creating GitHub Issue for this push..."

    # Compute since date (last 30 days) for context listing
    if date -v-30d '+%Y-%m-%d' >/dev/null 2>&1; then
        SINCE_DATE=$(date -v-30d '+%Y-%m-%d')
    else
        SINCE_DATE=$(date -d '30 days ago' '+%Y-%m-%d')
    fi

    # Check if gh command exists
    if ! command -v gh &> /dev/null; then
        echo "⚠️  'gh' command not found. Skipping issue creation."
        return
    fi

    # Check if logged in to gh
    if ! gh auth status &> /dev/null; then
        echo "⚠️  Not logged in to GitHub CLI. Skipping issue creation."
        return
    fi

    # Use captured PREV_PUSH_HASH
    if [ -z "$PREV_PUSH_HASH" ]; then
         PREV_PUSH_HASH=$(git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)
    fi

    CURRENT_HASH=$(git rev-parse HEAD)

    if [ "$PREV_PUSH_HASH" = "$CURRENT_HASH" ] && [ "$DRY_RUN" != true ]; then
        echo "ℹ️  No new commits pushed (Hashes match). Skipping issue creation."
        return
    fi
    
    # Diff Stat
    DIFF_STAT=$(git diff --stat ${PREV_PUSH_HASH}..${CURRENT_HASH})
    # Diff Log
    DIFF_LOG=$(git log --pretty=format:"- %h %s (%an)" ${PREV_PUSH_HASH}..${CURRENT_HASH})
    
    if [ -z "$DIFF_LOG" ]; then
         echo "ℹ️  Diff log is empty. Skipping issue creation."
         return
    fi

    ISSUE_TITLE="Push: $COMMIT_MESSAGE"
    # Recent issues in last 30 days for context building
    RECENT_CONTEXT=$(gh issue list --repo "$REPO_URL" --state all --limit 50 --search "created:>=$SINCE_DATE" --json number,title,author,createdAt,url --jq '.[] | "- #" + (.number|tostring) + " " + .title + " (" + .author.login + ") " + .createdAt + " " + .url' 2>/dev/null)
    if [ -z "$RECENT_CONTEXT" ]; then
        RECENT_CONTEXT="(No recent issues found since $SINCE_DATE)"
    fi
    ISSUE_BODY="## 📝 Context
### 💡 Prompt Summary
$PROMPT_SUMMARY

### 🧭 Intent / 目的・意図
$INTENT_DESCRIPTION

### 🧠 Background / 背景・コンテキスト
$CONTEXT_NOTES

### 📋 Changes in this Push
- **Date**: $(date '+%Y-%m-%d %H:%M:%S')
- **Branch**: $TARGET_BRANCH
- **Author**: $(git config user.name)
- **Previous Hash**: \`$PREV_PUSH_HASH\`
- **Current Hash**: \`$CURRENT_HASH\`

#### Commits
$DIFF_LOG

#### Changed Files
\`\`\`
$DIFF_STAT
\`\`\`

### 🚀 Recommended Next Tasks
$NEXT_TASKS

### 📚 Recent Issues (Last 30 days)
$RECENT_CONTEXT
"

    echo "Creating issue on yama-0t0k0/engineer-registration-app..."
    
    # Repository URL specified by user
    REPO_URL="https://github.com/yama-0t0k0/engineer-registration-app"
    
    # Detect labels
    detect_labels
    
    # Escape quotes in ISSUE_TITLE and ISSUE_BODY for safe eval
    # Note: Complex multiline strings with eval are risky. 
    # Better approach is to build the command arguments array or use printf.
    # However, for simplicity in shell script without arrays (sh compatibility) or with arrays (bash):
    
    # Using gh directly with arguments is safer than eval.
    
    if [ "$DRY_RUN" = true ]; then
        echo ""
        echo "🔎 Issue Preview (dry-run)"
        echo "Title: $ISSUE_TITLE"
        echo "$ISSUE_BODY"
        return
    fi

    if [ -n "$LABELS" ]; then
        if gh issue create --repo "$REPO_URL" --title "$ISSUE_TITLE" --body "$ISSUE_BODY" --label "$LABELS"; then
            echo "✅ Issue created successfully"
        else
            echo "❌ Failed to create issue"
        fi
    else
        if gh issue create --repo "$REPO_URL" --title "$ISSUE_TITLE" --body "$ISSUE_BODY"; then
            echo "✅ Issue created successfully"
        else
            echo "❌ Failed to create issue"
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
