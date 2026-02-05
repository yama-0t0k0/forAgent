#!/bin/bash
set -e

# 機能概要:
# - Firestoreのデータ構造移行（Step 2）を一括実行するスクリプト
# - migrate_individual.js (個人情報の分離) と migrate_users.js (ロール・企業ID追加) を順次実行する
#
# 実行方法:
# export GOOGLE_APPLICATION_CREDENTIALS='/absolute/path/to/serviceAccountKey.json'
# bash scripts/run_migration.sh

if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "❌ Error: GOOGLE_APPLICATION_CREDENTIALS が設定されていません。"
  echo "使用法: GOOGLE_APPLICATION_CREDENTIALS='/path/to/serviceAccountKey.json' bash scripts/run_migration.sh"
  exit 1
fi

if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "❌ Error: 指定されたキーファイルが見つかりません: $GOOGLE_APPLICATION_CREDENTIALS"
  exit 1
fi

echo "🚀 Starting Step 2: Schema Migration..."
echo "🔑 Using credentials from: $GOOGLE_APPLICATION_CREDENTIALS"

echo ""
echo "----------------------------------------------------------------"
echo "📦 1. Migrating 'individual' -> 'public_profile' / 'private_info'"
echo "----------------------------------------------------------------"
node scripts/migration/migrate_individual.js

echo ""
echo "----------------------------------------------------------------"
echo "📦 2. Extending 'users' with 'companyId' / 'role'"
echo "----------------------------------------------------------------"
node scripts/migration/migrate_users.js

echo ""
echo "✅ All migrations completed successfully!"
