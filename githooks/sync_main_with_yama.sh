#!/bin/bash

# 機能概要:
# - yamaブランチを「正」としてmainブランチへ同期させるためのユーティリティスクリプト
# - ローカルyamaとorigin/yamaの整合性を確認したうえで、mainをyamaと同じコミットに付け替える
# - origin/mainを最新のyamaと同じコミットに更新する（force-with-leaseで安全に上書き）
#
# ディレクトリ構造:
# - 本ファイル:
#   - engineer-registration-app-yama/githooks/sync_main_with_yama.sh
# - 関連スクリプト:
#   - engineer-registration-app-yama/githooks/safe_push.sh
#     - yamaブランチ向けのCI実行と安全なpush＋Issue作成を担当
# - 想定される運用フロー:
#   1. githooks/safe_push.sh を用いて yama ブランチを origin/yama に反映し、Issue を作成
#   2. 本スクリプトを実行して main ブランチを yama と同じコミットに揃え、origin/main を更新
#
# デプロイ・実行方法:
# - 前提:
#   - 作業ディレクトリは engineer-registration-app-yama（package.json が存在するルート）
#   - ローカルyamaとorigin/yamaが「正」となる状態で整合していること
# - 実行例:
#   - bash githooks/sync_main_with_yama.sh
# - 動作概要:
#   1. プロジェクトルートとGitリポジトリであることを検証
#   2. origin から最新情報を fetch
#   3. yama ブランチにチェックアウトし、origin/yama を fast-forward で取り込み
#   4. main ブランチ参照を yama と同じコミットに付け替え（git branch -f main yama）
#   5. main にチェックアウトし、origin/main に対して --force-with-lease で push

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

sync_main_to_source() {
  echo "🔍 $TARGET_MAIN_BRANCH ブランチの参照を $SOURCE_BRANCH に合わせます..."
  git branch -f "$TARGET_MAIN_BRANCH" "$SOURCE_BRANCH"

  echo "🔍 $TARGET_MAIN_BRANCH ブランチにチェックアウトします..."
  git checkout "$TARGET_MAIN_BRANCH"

  local head_hash
  head_hash=$(git rev-parse HEAD)
  local source_hash
  source_hash=$(git rev-parse "$SOURCE_BRANCH")

  if [ "$head_hash" != "$source_hash" ]; then
    echo "❌ Error: $TARGET_MAIN_BRANCH の HEAD と $SOURCE_BRANCH の HEAD が一致していません。"
    exit 1
  fi

  echo "✅ $TARGET_MAIN_BRANCH と $SOURCE_BRANCH はコミット $head_hash で一致しています。"
}

push_main() {
  echo "🚀 origin/$TARGET_MAIN_BRANCH を更新します（--force-with-lease）..."
  ALLOW_PUSH=1 git push origin "$TARGET_MAIN_BRANCH" --force-with-lease
  echo "✅ origin/$TARGET_MAIN_BRANCH を $SOURCE_BRANCH と同じコミットに更新しました。"
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
  echo "🚀 main ブランチを $SOURCE_BRANCH と同期するスクリプトを実行します..."
  check_project_dir
  check_git_repo
  sync_source_branch
  sync_main_to_source
  push_main
  return_to_source_branch
  echo "🎉 main ブランチと origin/main を $SOURCE_BRANCH と同期し、$SOURCE_BRANCH に戻りました。"
}

main "$@"
