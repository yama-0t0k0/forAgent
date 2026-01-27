// 役割（機能概要）:
// - Individual（個人）のJSONファイルをテンプレートから生成する専用スクリプト
// - Firestoreへの書き込みは行わず、「① JSON生成」のみに責務を限定
//
// ディレクトリ構造:
// - 本ファイル: engineer-registration-app-yama/scripts/generate_individual.js
// - テンプレート例:
//   - reference_information_fordev/json/Individual/Individual .json
// - 生成先（サンプル）:
//   - reference_information_fordev/json/Individual/{individualId}.json
//
// 実行方法:
// - 個人JSON生成:
//   - node engineer-registration-app-yama/scripts/generate_individual.js C202501010001
//   - 必要に応じて第2引数で出力パスを上書き可能

const fs = require('fs');
const path = require('path');

const ROOT = '/Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama';
const TEMPLATE_INDIVIDUAL = path.join(
  ROOT,
  'reference_information_fordev/json/Individual/Individual .json'
);
const OUT_INDIVIDUAL_DIR = path.join(
  ROOT,
  'reference_information_fordev/json/Individual'
);

/**
 * Ensure directory exists
 * @param {string} dir - Directory path
 */
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load JSON file
 * @param {string} p - File path
 * @returns {object} JSON data
 */
function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Save data to JSON file
 * @param {string} p - File path
 * @param {object} data - Data to save
 */
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Generate Individual JSON
 * @param {string} individualId - Individual ID (e.g. C202501010001)
 * @param {string} [outPath] - Optional output path
 */
async function generateIndividual(individualId, outPath) {
  const id = (individualId || '').trim();
  if (!id || !id.startsWith('C')) {
    throw new Error('individualId は \"C\" 始まりのIDが必要です（例: C202501010001）');
  }
  const template = loadJson(TEMPLATE_INDIVIDUAL);
  const result = { ...template, id_individual: id };

  const outDir = path.dirname(outPath || path.join(OUT_INDIVIDUAL_DIR, `${id}.json`));
  ensureDirSync(outDir);
  const finalPath = outPath || path.join(OUT_INDIVIDUAL_DIR, `${id}.json`);
  saveJson(finalPath, result);
  console.log(`Individual JSON generated: ${finalPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: generate_individual.js <individualId> [outPath]');
    console.log('Example:');
    console.log('  C202501010001');
    process.exit(1);
  }

  const individualId = args[0];
  const outPath = args[1];

  try {
    await generateIndividual(individualId, outPath);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();

