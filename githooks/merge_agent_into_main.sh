#!/bin/bash

# 機能概要:
# - Agentブランチの変更を、mainブランチへ「通常のGitマージ」として安全に取り込むためのユーティリティスクリプト
# - ローカルAgentとorigin/Agent、ローカルmainとorigin/mainの整合性を確認したうえで、main上でAgentをマージする
# - マージ完了後にorigin/mainへpushし、その後必ずAgentブランチへ戻ってから作業を再開できるようにする

set -e

TARGET_MAIN_BRANCH="main"
SOURCE_BRANCH="Agent"

check_project_dir() {
  if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json が見つかりません。プロジェクトルートで実行してください。"
    exit 1
  fi

  local project_name
  project_name=$(grep -m 1 '"name":' package.json | cut -d '"' -f 4)

  if [ "$project_name" != "engineer-registration-app-yama" ]; then
    echo "❌ Error: package.json の name が想定外です: $project_name"
    echo "       engineer-registration-app-yama 直下で実行してください。"
    exit 1
  fi
}

check_git_repo() {
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Gitリポジトリ内で実行されていません。"
    exit 1
  fi
}

# Flag to track if we stashed changes
STASHED=false

handle_uncommitted_changes() {
  echo "🔍 未コミットの変更を確認しています..."
  
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  未コミットの変更が検出されました。自動的にstashします..."
    if git stash push -m "Auto-stash by merge_agent_into_main.sh at $(date '+%Y-%m-%d %H:%M:%S')"; then
      STASHED=true
      echo "✅ 変更をstashしました。スクリプト終了時に自動的にpopします。"
    else
      echo "❌ Error: stashに失敗しました。手動で対処してください。"
      exit 1
    fi
  else
    echo "✅ 未コミットの変更はありません。"
  fi
}

restore_stashed_changes() {
  if [ "$STASHED" = true ]; then
    echo "🔄 stashした変更を復元しています..."
    if git stash pop; then
      echo "✅ stashした変更を復元しました。"
    else
      echo "⚠️  stash popに失敗しました。手動で 'git stash pop' を実行してください。"
    fi
  fi
}

sync_source_branch() {
  echo "🔍 origin から最新情報を取得しています..."
  git fetch origin

  echo "🔍 $SOURCE_BRANCH ブランチにチェックアウトします..."
  git checkout "$SOURCE_BRANCH"

  echo "🔍 origin/$SOURCE_BRANCH と同期しています..."
  if git merge --ff-only "origin/$SOURCE_BRANCH"; then
    echo "✅ $SOURCE_BRANCH は origin/$SOURCE_BRANCH と同期済みです。"
  else
    echo "❌ Error: $SOURCE_BRANCH と origin/$SOURCE_BRANCH の fast-forward に失敗しました。"
    echo "       手動でコンフリクトを解消してから再度実行してください。"
    exit 1
  fi
}

update_main_branch() {
  echo "🔍 $TARGET_MAIN_BRANCH ブランチにチェックアウトします..."
  git checkout "$TARGET_MAIN_BRANCH"

  echo "🔍 origin/$TARGET_MAIN_BRANCH と同期しています..."
  if git merge --ff-only "origin/$TARGET_MAIN_BRANCH"; then
    echo "✅ $TARGET_MAIN_BRANCH は origin/$TARGET_MAIN_BRANCH と同期済みです。"
  else
    echo "❌ Error: $TARGET_MAIN_BRANCH と origin/$TARGET_MAIN_BRANCH の fast-forward に失敗しました。"
    echo "       手動でコンフリクトを解消してから再度実行してください。"
    exit 1
  fi
}

merge_source_into_main() {
  echo "🔍 $TARGET_MAIN_BRANCH 上に $SOURCE_BRANCH をマージします..."

  # すでに取り込み済みかどうかを簡易判定（fast-forward可能か）
  if git merge-base --is-ancestor "$SOURCE_BRANCH" "$TARGET_MAIN_BRANCH"; then
    echo "✅ $SOURCE_BRANCH の変更はすでに $TARGET_MAIN_BRANCH に取り込まれています。マージは不要です。"
    return
  fi

  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local commit_message="Merge branch '$SOURCE_BRANCH' into '$TARGET_MAIN_BRANCH': Sync latest updates ($timestamp)"

  if git merge --no-ff --no-edit -m "$commit_message" "$SOURCE_BRANCH"; then
    echo "✅ $SOURCE_BRANCH の変更を $TARGET_MAIN_BRANCH にマージしました。"
  else
    echo "❌ Error: $SOURCE_BRANCH のマージに失敗しました。コンフリクトを解消してから再度実行してください。"
    exit 1
  fi
}

push_main() {
  echo "🚀 origin/$TARGET_MAIN_BRANCH を更新します..."
  ALLOW_PUSH=1 git push origin "$TARGET_MAIN_BRANCH"
  echo "✅ origin/$TARGET_MAIN_BRANCH を更新しました。"
}

return_to_source_branch() {
  echo "🔁 作業用ブランチ($SOURCE_BRANCH)に戻ります..."
  git checkout "$SOURCE_BRANCH"

  local current
  current=$(git branch --show-current)

  if [ "$current" != "$SOURCE_BRANCH" ]; then
    echo "❌ Error: $SOURCE_BRANCH への戻りに失敗しました。現在のブランチ: $current"
    exit 1
  fi

  echo "✅ 現在のブランチは $SOURCE_BRANCH です。作業を再開できます。"
}

main() {
  echo "🚀 $SOURCE_BRANCH ブランチの変更を $TARGET_MAIN_BRANCH へマージするスクリプトを実行します..."
  check_project_dir
  check_git_repo
  handle_uncommitted_changes
  sync_source_branch
  update_main_branch
  merge_source_into_main
  push_main
  return_to_source_branch
  restore_stashed_changes
  echo "🎉 $SOURCE_BRANCH の変更を $TARGET_MAIN_BRANCH / origin/$TARGET_MAIN_BRANCH にマージし、$SOURCE_BRANCH に戻りました。"
}

main "$@"
