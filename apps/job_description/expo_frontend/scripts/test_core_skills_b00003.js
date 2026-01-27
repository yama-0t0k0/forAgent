const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../../../../reference_information_fordev/json/jd/B00003');

const EXPECTED_CORE_SUFFIX = {
    'B00003_01.json': '技術職.サーバサイドエンジニア',
    'B00003_02.json': '技術職.サーバサイドエンジニア',
    'B00003_03.json': '技術職.サーバサイドエンジニア',
    'B00003_04.json': '技術職.インフラ系エンジニア.クラウドインフラエンジニア',
    'B00003_05.json': '技術職.ネイティブアプリエンジニア',
    'B00003_06.json': '技術職.ネイティブアプリエンジニア',
    'B00003_07.json': '技術職.組み込みエンジニア(制御含む)',
    'B00003_08.json': '技術職.サーバサイドエンジニア',
    'B00003_09.json': '技術職.QAエンジニア(自動テスト含む)',
    'B00003_10.json': '技術職.データ基盤エンジニア',
    'B00003_11.json': '技術職.フロントエンドエンジニア',
    'B00003_12.json': '技術職.データアナリスト',
    'B00003_13.json': '技術職.組み込みエンジニア(制御含む)',
    'B00003_14.json': '技術職.サーバサイドエンジニア'
};

/**
 * Collect paths where core_skill is true
 * @param {object} obj - JSON object to traverse
 * @param {string[]} pathArr - Current path array
 * @param {string[]} results - Array to store found paths
 */
function collectCoreSkillTrue(obj, pathArr, results) {
    if (!obj || typeof obj !== 'object') return;

    if (Object.prototype.hasOwnProperty.call(obj, 'core_skill') && obj.core_skill === true) {
        results.push(pathArr.join('.'));
    }

    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (value && typeof value === 'object') {
            collectCoreSkillTrue(value, pathArr.concat(key), results);
        }
    }
}

/**
 * Run the test
 */
function run() {
    let hasError = false;

    Object.entries(EXPECTED_CORE_SUFFIX).forEach(([fileName, expectedSuffix]) => {
        const filePath = path.join(baseDir, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`[ERROR] File not found: ${filePath}`);
            hasError = true;
            return;
        }

        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const allPaths = [];
        collectCoreSkillTrue(json, [], allPaths);

        const matched = allPaths.filter((p) => p.endsWith(expectedSuffix));

        if (matched.length !== 1) {
            console.error(`[ERROR] ${fileName}: 期待するcore_skillパスに一致するものが${matched.length}件あります (期待: 1件)`);
            console.error(`  期待サフィックス: ${expectedSuffix}`);
            console.error(`  現在のcore_skillパス一覧: ${JSON.stringify(allPaths)}`);
            hasError = true;
            return;
        }

        console.log(`[OK] ${fileName}: core_skill パス = ${matched[0]}`);
    });

    if (hasError) {
        process.exit(1);
    } else {
        console.log('All B00003 core_skill mappings are valid.');
        process.exit(0);
    }
}

run();
