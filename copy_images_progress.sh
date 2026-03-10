#!/bin/bash
echo "=== 古いプロセスのクリーンアップ ==="
# 実行中の古い cp 処理を全て終了させます
pkill -9 -f cp || true
echo "クリーンアップ完了！"

echo "=== 画像のコピーを開始します ==="
# 画像格納用ディレクトリの作成
mkdir -p docs_site/images/hosting

# brain フォルダ内のすべてのスクリーンショットを対象にループ
count=0
for src_file in /Users/sharl/.gemini/antigravity/brain/1d33753e-d499-4bba-9d5e-7b632c149dbd/*.png; do
  if [ -f "$src_file" ]; then
    # ファイル名から不要なタイムスタンプ部分を削除
    filename=$(basename "$src_file")
    # 正規表現で _177... のような末尾の数字を除外してクリーンな名前に
    clean_name=$(echo "$filename" | sed -E 's/_[0-9]{13,}\.png$/.png/')
    # アンダースコアをハイフンに置き換え（URLのIDと形式を統一）
    final_name=$(echo "$clean_name" | tr '_' '-')
    
    # 確実に上書きでコピー
    /bin/cp -f "$src_file" "docs_site/images/hosting/$final_name"
    echo "✅ 完了: $final_name"
    count=$((count+1))
  fi
done

echo "=== 全 $count 件の画像コピーが完了しました！ ==="
