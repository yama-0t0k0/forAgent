const fs = require('fs');
const path = require('path');

/**
 * 指定されたディレクトリ内の特定プレフィックスを持つファイルを
 * タイムスタンプ（ファイル名または更新日時）に基づいてローテーションします。
 */

const targetDir = process.argv[2];
const prefix = process.argv[3];
const maxKeep = parseInt(process.argv[4], 10) || 5;

if (!targetDir || !prefix) {
  console.error('Usage: node rotate_files.js <dir> <prefix> [maxKeep]');
  process.exit(1);
}

const absoluteDir = path.isAbsolute(targetDir) ? targetDir : path.join(process.cwd(), targetDir);

if (!fs.existsSync(absoluteDir)) {
  console.log(`Directory ${absoluteDir} does not exist. Skipping rotation.`);
  process.exit(0);
}

// ファイル一覧を取得してプレフィックスでフィルタ
const allFiles = fs.readdirSync(absoluteDir)
  .filter(f => f.startsWith(prefix))
  .map(f => ({ name: f, time: fs.statSync(path.join(absoluteDir, f)).mtime.getTime() }));

// 1秒以内の誤差は同じ実行（セット）とみなしてグループ化する
const groups = {};
allFiles.forEach(f => {
  // 10秒(10000ms)単位で丸めることで、同じテストランのファイルをグループ化
  const tsGroup = Math.floor(f.time / 10000);
  if (!groups[tsGroup]) groups[tsGroup] = [];
  groups[tsGroup].push(f.name);
});

// グループ（タイムスタンプ）を降順ソート
const sortedGroups = Object.keys(groups).sort((a, b) => b - a);

if (sortedGroups.length > maxKeep) {
  console.log(`🧹 Rotating ${absoluteDir} (Prefix: ${prefix}, Keeping latest ${maxKeep} runs)`);
  for (let i = maxKeep; i < sortedGroups.length; i++) {
    const groupKey = sortedGroups[i];
    groups[groupKey].forEach(f => {
      try {
        fs.unlinkSync(path.join(absoluteDir, f));
        console.log(`🗑️ Deleted: ${f}`);
      } catch (e) {
        console.error(`❌ Failed to delete ${f}:`, e.message);
      }
    });
  }
} else {
  console.log(`✨ ${absoluteDir} is within limits (${sortedGroups.length}/${maxKeep} runs).`);
}
