// 役割（機能概要）:
// - Company（会社情報）のJSONファイルをテンプレートから生成する専用スクリプト
// - Firestoreへの書き込みは行わず、「① JSON生成」のみに責務を限定
//
// ディレクトリ構造:
// - 本ファイル: engineer-registration-app-yama/scripts/generate_company.js
// - テンプレート:
//   - apps/corporate_user_app/expo_frontend/assets/json/company-profile-template.json
// - 生成先:
//   - reference_information_fordev/json/ompany/{companyId}.json
//
// 実行方法:
// - 会社JSON生成:
//   - node engineer-registration-app-yama/scripts/generate_company.js B00003
//   - 必要に応じて第2引数で出力パスを上書き可能

const fs = require('fs');
const path = require('path');

const ROOT = '/Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama';
const TEMPLATE_COMPANY = path.join(
  ROOT,
  'apps/corporate_user_app/expo_frontend/assets/json/company-profile-template.json'
);
const OUT_COMPANY_DIR = path.join(ROOT, 'reference_information_fordev/json/ompany');

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
 * Generate Company JSON
 * @param {string} companyId - Company ID (e.g. B00003)
 * @param {string} [outPath] - Optional output path
 */
async function generateCompany(companyId, outPath) {
  const id = (companyId || '').trim();
  if (!id || !id.startsWith('B')) {
    throw new Error('companyId は \"B\" 始まりのIDが必要です（例: B00003）');
  }
  const template = loadJson(TEMPLATE_COMPANY);
  const result = { ...template, id };

  const outDir = path.dirname(outPath || path.join(OUT_COMPANY_DIR, `${id}.json`));
  ensureDirSync(outDir);
  const finalPath = outPath || path.join(OUT_COMPANY_DIR, `${id}.json`);
  saveJson(finalPath, result);
  console.log(`Company JSON generated: ${finalPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: generate_company.js <companyId> [outPath]');
    console.log('Example:');
    console.log('  B00003');
    process.exit(1);
  }

  const companyId = args[0];
  const outPath = args[1];

  try {
    await generateCompany(companyId, outPath);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();

