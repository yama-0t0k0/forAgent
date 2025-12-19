#!/bin/bash

# Universal Pull Missing Files Script for UI-centric Development Project
# This script pulls all files that exist in main branch but not in yama branch
# Usage: ./pull_missing_files.sh [--auto]
# Note: Auto mode is enabled by default. Use without --auto flag for automatic operation.

set -e  # Exit on any error

# Global variables
AUTO_MODE=true
SOURCE_BRANCH="main"
TARGET_BRANCH="yama"

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE=true
                shift
                ;;
            --manual)
                AUTO_MODE=false
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
}

echo "🔄 Universal Pull Missing Files Script for UI-centric Development"
echo "================================================================="
if [ "$AUTO_MODE" = true ]; then
    echo "🤖 Running in automatic mode"
else
    echo "👤 Running in manual mode"
fi

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ Error: Not in a git repository"
        exit 1
    fi
}

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

# Function to fetch latest changes from remote
fetch_remote_changes() {
    echo "🌐 Fetching latest changes from remote..."
    
    if git fetch origin; then
        echo "✅ Successfully fetched remote changes"
    else
        echo "❌ Error: Failed to fetch remote changes"
        exit 1
    fi
}

# Function to identify files to sync from main to yama
identify_missing_files() {
    echo "🔍 Identifying files to sync from '$SOURCE_BRANCH' to '$TARGET_BRANCH'..."
    
    # Get all differences between branches
    ALL_DIFFS=$(git diff --name-status HEAD..origin/$SOURCE_BRANCH)
    
    # Get files that are Added (A) or Modified (M) in main compared to yama
    # We ignore Deleted (D) files to preserve yama-specific files
    SYNC_FILES=$(echo "$ALL_DIFFS" | grep -E "^[AM]" | cut -f2 || true)
    
    if [ -z "$SYNC_FILES" ]; then
        echo "✅ No files to sync. '$TARGET_BRANCH' is up to date with '$SOURCE_BRANCH'!"
        
        # Show what differences exist (if any)
        if [ ! -z "$ALL_DIFFS" ]; then
            echo ""
            echo "📊 Other differences (ignored):"
            DELETED_FILES=$(echo "$ALL_DIFFS" | grep "^D" || true)
            if [ ! -z "$DELETED_FILES" ]; then
                echo "$DELETED_FILES" | head -5
                DELETED_COUNT=$(echo "$DELETED_FILES" | wc -l | tr -d ' ')
                if [ "$DELETED_COUNT" -gt 5 ]; then
                    echo "... and more deleted files (preserved in $TARGET_BRANCH)"
                fi
            fi
        fi
        exit 0
    fi
    
    # Count files to sync
    SYNC_COUNT=$(echo "$SYNC_FILES" | wc -l | tr -d ' ')
    ADDED_COUNT=$(echo "$ALL_DIFFS" | grep "^A" | wc -l | tr -d ' ' || echo "0")
    MODIFIED_COUNT=$(echo "$ALL_DIFFS" | grep "^M" | wc -l | tr -d ' ' || echo "0")
    DELETED_COUNT=$(echo "$ALL_DIFFS" | grep "^D" | wc -l | tr -d ' ' || echo "0")
    
    echo "📋 Files to sync: $SYNC_COUNT"
    echo "  - Added files (A): $ADDED_COUNT"
    echo "  - Modified files (M): $MODIFIED_COUNT"
    echo "  - Deleted files (D): $DELETED_COUNT (ignored - preserved in $TARGET_BRANCH)"
    echo ""
    echo "Files to be synced:"
    echo "$SYNC_FILES" | head -10
    
    if [ "$SYNC_COUNT" -gt 10 ]; then
        echo "... and $(($SYNC_COUNT - 10)) more files"
    fi
    
    echo ""
    
    # Store the files to sync for later use
    MISSING_FILES="$SYNC_FILES"
    MISSING_COUNT="$SYNC_COUNT"
}

# Function to sync files from main to yama
sync_files() {
    echo "📥 Syncing files from '$SOURCE_BRANCH' to '$TARGET_BRANCH'..."
    
    if [ "$AUTO_MODE" = false ]; then
        read -p "Proceed with syncing $MISSING_COUNT files? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            echo "❌ Sync cancelled by user"
            exit 1
        fi
    fi
    
    # Check if we have files to sync
    if [ -z "$MISSING_FILES" ]; then
        echo "⚠️  No files to sync"
        return 0
    fi
    
    # Use git checkout to pull files from origin/main
    # This will overwrite local changes for modified files and add new files
    # Use while loop to handle files with special characters properly
    echo "$MISSING_FILES" | while IFS= read -r file; do
        if [ ! -z "$file" ]; then
            if ! git checkout "origin/$SOURCE_BRANCH" -- "$file" 2>/dev/null; then
                echo "⚠️  Warning: Failed to sync file: $file"
            fi
        fi
    done
    
    # Verify that at least some files were synced
    SYNCED_COUNT=$(git status --porcelain | grep -E "^[AM] " | wc -l | tr -d ' ')
    if [ "$SYNCED_COUNT" -gt 0 ]; then
        echo "✅ Successfully synced files from '$SOURCE_BRANCH'"
    else
        echo "❌ Error: No files were synced"
        exit 1
    fi
}

# Function to verify synced files
verify_synced_files() {
    echo "🔍 Verifying synced files..."
    
    # Check how many files were actually synced
    STAGED_FILES=$(git status --porcelain | grep -E "^[AM] " | wc -l | tr -d ' ')
    
    echo "📊 Verification results:"
    echo "  - Files identified for sync: $MISSING_COUNT"
    echo "  - Files successfully synced: $STAGED_FILES"
    
    if [ "$STAGED_FILES" -eq "$MISSING_COUNT" ]; then
        echo "✅ All files have been successfully synced!"
    elif [ "$STAGED_FILES" -gt 0 ]; then
        echo "⚠️  Some files were synced ($STAGED_FILES/$MISSING_COUNT)"
        echo "    This may be normal if some files had no actual changes"
    else
        echo "❌ No files were synced - this may indicate an error"
        echo "    Please check git status for details"
    fi
    
    # Show some examples of synced files
    if [ "$STAGED_FILES" -gt 0 ]; then
        echo ""
        echo "📁 Examples of synced files:"
        git status --porcelain | grep -E "^[AM] " | head -5
    fi
}

# Function to show final status and auto-push if needed
show_final_status() {
    echo ""
    echo "🎯 Final Status Summary:"
    echo "========================"
    
    # Get current status
    STAGED_FILES=$(git status --porcelain | grep -E "^[AM] " | wc -l | tr -d ' ')
    MODIFIED_FILES=$(git status --porcelain | grep -E "^M " | wc -l | tr -d ' ')
    ADDED_FILES=$(git status --porcelain | grep -E "^A " | wc -l | tr -d ' ')
    
    echo "📊 Sync Statistics:"
    echo "  - Files identified for sync: $MISSING_COUNT"
    echo "  - Files successfully synced: $STAGED_FILES"
    echo "    - New files added: $ADDED_FILES"
    echo "    - Existing files modified: $MODIFIED_FILES"
    
    if [ "$STAGED_FILES" -gt 0 ]; then
        echo ""
        echo "📝 Changes ready for commit:"
        git status --porcelain | grep -E "^[AM] " | while IFS= read -r line; do
            echo "  $line"
        done
        
        echo ""
        echo "🚀 Auto-pushing changes using safe_push.sh..."
        
        # Get the directory where this script is located
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        
        # Execute safe_push.sh with appropriate commit message
        if [ "$AUTO_MODE" = true ]; then
            if ! "$SCRIPT_DIR/safe_push.sh" "Sync files from $SOURCE_BRANCH to $TARGET_BRANCH (A:$ADDED_FILES, M:$MODIFIED_FILES)" --auto; then
                echo "❌ Error: Failed to auto-push changes"
                echo "🔄 Manual steps required:"
                echo "  1. Review the changes with: git diff --cached"
                echo "  2. Commit changes with: git commit -m 'Sync files from $SOURCE_BRANCH'"
                echo "  3. Push changes with: git push origin $TARGET_BRANCH"
                exit 1
            fi
        else
            if ! "$SCRIPT_DIR/safe_push.sh" "Sync files from $SOURCE_BRANCH to $TARGET_BRANCH (A:$ADDED_FILES, M:$MODIFIED_FILES)"; then
                echo "❌ Error: Failed to push changes"
                echo "🔄 Manual steps required:"
                echo "  1. Review the changes with: git diff --cached"
                echo "  2. Commit changes with: git commit -m 'Sync files from $SOURCE_BRANCH'"
                echo "  3. Push changes with: git push origin $TARGET_BRANCH"
                exit 1
            fi
        fi
        
        echo "✅ Changes have been automatically committed and pushed!"
    else
        echo ""
        echo "ℹ️  No changes to commit - all files are already up to date"
    fi
    
    echo ""
    echo "✅ One-way file sync from '$SOURCE_BRANCH' to '$TARGET_BRANCH' completed successfully!"
}

# Function to check if we are in the correct project directory
check_project_dir() {
    echo "🔍 Checking project directory..."
    if [ ! -f "package.json" ]; then
        echo "❌ Error: package.json not found. Are you in the project root?"
        exit 1
    fi
    
    PROJECT_NAME=$(grep -m 1 '"name":' package.json | cut -d '"' -f 4)
    if [ "$PROJECT_NAME" != "my-expo-app" ]; then
        echo "❌ Error: Incorrect project name '$PROJECT_NAME'. This script is for 'my-expo-app'."
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
    fetch_remote_changes
    identify_missing_files
    sync_files
    verify_synced_files
    show_final_status
    
    echo ""
    echo "🎉 File sync completed successfully!"
    echo "===================================="
    echo "📝 Summary:"
    echo "  - Synced A (Added) and M (Modified) files from '$SOURCE_BRANCH'"
    echo "  - Preserved D (Deleted) files in '$TARGET_BRANCH' (yama-specific files kept)"
    echo "  - One-way sync: $SOURCE_BRANCH → $TARGET_BRANCH only"
}

# Run main function with all command line arguments
main "$@"