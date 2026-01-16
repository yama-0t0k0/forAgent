// 役割（機能概要）:
// - JD（求人）のJSONファイルをテンプレートから生成する専用スクリプト
// - Firestoreへの書き込みは行わず、「① JSON生成」のみに責務を限定
//
// ディレクトリ構造:
// - 本ファイル: engineer-registration-app-yama/scripts/generate_jd.js
// - テンプレート:
//   - apps/job_description/expo_frontend/assets/json/jd.json
// - 生成先:
//   - reference_information_fordev/json/jd/{companyId}/{companyId}_{jdNumber}.json
//
// 実行方法:
// - 求人JSON生成:
//   - node engineer-registration-app-yama/scripts/generate_jd.js B00003 01
//   - 必要に応じて第3引数で出力パスを上書き可能

const fs = require('fs');
const path = require('path');

const ROOT = '/Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama';
const TEMPLATE_JD = path.join(
  ROOT,
  'apps/job_description/expo_frontend/assets/json/jd.json'
);
const OUT_JD_DIR_BASE = path.join(ROOT, 'reference_information_fordev/json/jd');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

async function generateJD(companyId, jdNumber, outPath) {
  const cid = (companyId || '').trim();
  const jdn = (jdNumber || '').trim();
  if (!cid || !cid.startsWith('B')) {
    throw new Error('companyId は \"B\" 始まりのIDが必要です（例: B00003）');
  }
  if (!jdn) {
    throw new Error('jdNumber が必要です（例: 01）');
  }
  const template = loadJson(TEMPLATE_JD);
  template.company_ID = cid;
  template.JD_Number = jdn;
  if (template['求人基本項目'] && template['求人基本項目']['ポジション名'] === '') {
    template['求人基本項目']['ポジション名'] = 'サンプルポジション';
  }

  const companyDir = path.join(OUT_JD_DIR_BASE, cid);
  ensureDirSync(companyDir);
  const finalPath = outPath || path.join(companyDir, `${cid}_${jdn}.json`);
  saveJson(finalPath, template);
  console.log(`JD JSON generated: ${finalPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: generate_jd.js <companyId> <jdNumber> [outPath]');
    console.log('Example:');
    console.log('  B00003 01');
    process.exit(1);
  }

  const companyId = args[0];
  const jdNumber = args[1];
  const outPath = args[2];

  try {
    await generateJD(companyId, jdNumber, outPath);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();

