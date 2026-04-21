#!/bin/bash
# ==========================================
# Mac Development Cache Cleanup Script
# (React Native / iOS / Web / Node.js 向け)
# ==========================================
echo "🧹 Macの不要な開発用キャッシュ（システムデータ）のクリーンアップを開始します..."

# 1. Xcode DerivedData (ビルド中間生成物)
echo "🗑️ Xcode DerivedDataを削除中..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 2. NPM キャッシュ (node_modules等の一時ファイル)
echo "🗑️ NPMキャッシュをクリア中..."
npm cache clean --force 2>/dev/null || rm -rf ~/.npm/_cacache

# 3. CocoaPods キャッシュ
echo "🗑️ CocoaPodsキャッシュをクリア中..."
rm -rf ~/Library/Caches/CocoaPods

# 4. Watchman 状態のリセット (React Native用)
echo "🗑️ Watchmanの状態をリセット中..."
watchman watch-del-all 2>/dev/null

# 5. Yarn キャッシュ (もしインストールされていれば)
echo "🗑️ Yarnキャッシュをクリア中..."
yarn cache clean 2>/dev/null || rm -rf ~/Library/Caches/Yarn

# 6. Expo キャッシュ (.expo フォルダの一時ファイル等)
echo "🗑️ Expoの一時キャッシュを削除中..."
rm -rf ~/.expo/cache

echo "✅ クリーンアップが完了しました！これでディスク領域が大量に解放されたはずです。"
echo "※ 次回の初回ビルド時のみ、キャッシュが再構築されるため少し時間がかかります。"
