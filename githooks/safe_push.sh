#!/bin/bash

# Universal Safe Push Script for UI-centric Development Project
# This script ensures safe git operations across the entire project
# Usage: ./safe_push.sh [commit_message] [--auto]
# Note: Auto mode is enabled by default. Use without --auto flag for automatic operation.

set -e  # Exit on any error

# Global variables
AUTO_MODE=true
TARGET_BRANCH="yama"

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE=true
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

# Function to check for untracked files
check_untracked_files() {
    echo "🔍 Checking for untracked files..."
    
    UNTRACKED_FILES=$(git ls-files --others --exclude-standard)
    
    if [ -n "$UNTRACKED_FILES" ]; then
        echo "⚠️  Found untracked files:"
        echo "$UNTRACKED_FILES"
        echo ""
        
        if [ "$AUTO_MODE" = true ]; then
            git add .
            echo "✅ All files added to staging area (auto mode)"
        else
            read -p "Add all untracked files? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git add .
                echo "✅ All files added to staging area"
            else
                echo "❌ Please handle untracked files manually"
                exit 1
            fi
        fi
    else
        echo "✅ No untracked files found"
    fi
}

# Function to check for unstaged changes
check_unstaged_changes() {
    echo "🔍 Checking for unstaged changes..."
    
    MODIFIED_FILES=$(git diff --name-only)
    
    if [ -n "$MODIFIED_FILES" ]; then
        echo "⚠️  Found unstaged changes:"
        echo "$MODIFIED_FILES"
        echo ""
        
        if [ "$AUTO_MODE" = true ]; then
            git add .
            echo "✅ All changes staged (auto mode)"
        else
            read -p "Stage all changes? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git add .
                echo "✅ All changes staged"
            else
                echo "❌ Please stage changes manually"
                exit 1
            fi
        fi
    else
        echo "✅ No unstaged changes found"
    fi
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
    check_untracked_files
    check_unstaged_changes
    check_staged_changes
    commit_changes
    push_changes
    
    echo ""
    echo "🎉 Safe push completed successfully!"
    echo "=================================================="
}

# Run main function with all command line arguments
main "$@"