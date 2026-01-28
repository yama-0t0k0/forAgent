#!/bin/bash

# 機能概要:
# - yamaブランチの変更を、mainブランチへ「通常のGitマージ」として安全に取り込むためのユーティリティスクリプト
# - ローカルyamaとorigin/yama、ローカルmainとorigin/mainの整合性を確認したうえで、main上でyamaをマージする
# - マージ完了後にorigin/mainへpushし、その後必ずyamaブランチへ戻ってから作業を再開できるようにする
#
# ディレクトリ構造:
# - 本ファイル:
#   - engineer-registration-app-yama/githooks/merge_yama_into_main.sh
# - 関連スクリプト:
#   - engineer-registration-app-yama/githooks/safe_push.sh
#     - yamaブランチ向けのCI実行と安全なpush＋Issue作成を担当
#   - engineer-registration-app-yama/githooks/sync_main_with_yama.sh
#     - 差分が大きくなりすぎた場合に、mainをyamaのスナップショットへ同期（上書き）するための非常用スクリプト
#
# デプロイ・実行方法:
# - 前提:
#   - 作業ディレクトリは engineer-registration-app-yama（package.json が存在するルート）
#   - 通常の実装作業は yama ブランチ上で行う
#   - 定期的に githooks/safe_push.sh で yama を origin/yama に反映していること
# - 実行例:
#   - bash githooks/merge_yama_into_main.sh
# - 動作概要:
#   1. プロジェクトルートとGitリポジトリであることを検証
#   2. origin から最新情報を fetch
#   3. yama ブランチにチェックアウトし、origin/yama を fast-forward で取り込み
#   4. main ブランチにチェックアウトし、origin/main を fast-forward で最新化
#   5. main ブランチ上で yama をマージ（基本は fast-forward、必要に応じてマージコミット）
#   6. origin/main に対して通常の push を実行
#   7. 最後に必ず yama ブランチに戻り、戻れたことを確認して終了

set -e

TARGET_MAIN_BRANCH="main"
SOURCE_BRANCH="yama"

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

  if git merge --no-ff "$SOURCE_BRANCH"; then
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
  sync_source_branch
  update_main_branch
  merge_source_into_main
  push_main
  return_to_source_branch
  echo "🎉 $SOURCE_BRANCH の変更を $TARGET_MAIN_BRANCH / origin/$TARGET_MAIN_BRANCH にマージし、$SOURCE_BRANCH に戻りました。"
}

main "$@"

