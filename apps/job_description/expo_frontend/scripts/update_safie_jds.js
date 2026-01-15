const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../../../../reference_information_fordev/json/jd/B00003');

// 経験レベルの定義（trueにする項目名）
const LEVELS = {
  BASIC: '実務で基礎的なタスクを遂行可能',
  ADVANCED: '実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる',
  PERSONAL: '実務経験は無いが個人活動で経験あり',
  EXPERT: '専門的な知識やスキルを有し他者を育成/指導できる',
  NONE: '経験なし'
};

// ヘルパー: スキルオブジェクトをリセット（全てNONE=trueにする）
function resetAllSkills(jsonObj) {
  if (!jsonObj['スキル経験']) return;

  const traverse = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // 5段階評価のオブジェクトかどうか判定
        if (LEVELS.NONE in obj[key]) {
          for (const levelKey in LEVELS) {
            obj[key][LEVELS[levelKey]] = false;
          }
          obj[key][LEVELS.NONE] = true;
        } else {
          traverse(obj[key]);
        }
      }
    }
  };

  traverse(jsonObj['スキル経験']);
}

// ヘルパー: 特定のスキルを設定
function setSkill(jsonObj, categoryPath, skillName, levelKey) {
  let target = jsonObj['スキル経験'];
  const pathParts = categoryPath.split('.');
  
  for (const part of pathParts) {
    if (target[part]) {
      target = target[part];
    } else {
      console.warn(`Path not found: ${categoryPath} in ${skillName}`);
      return;
    }
  }

  if (target[skillName]) {
    // 全てfalseにしてから対象をtrue
    for (const l in LEVELS) {
      target[skillName][LEVELS[l]] = false;
    }
    target[skillName][levelKey] = true;
  } else {
    console.warn(`Skill not found: ${skillName} in ${categoryPath}`);
  }
}

// ヘルパー: 現職種のcore_skillを全てリセット
function resetCoreSkills(jsonObj) {
  if (!jsonObj['現職種'] || !jsonObj['現職種']['技術職']) return;
  const tech = jsonObj['現職種']['技術職'];

  const traverse = (obj) => {
    for (const key in obj) {
      const value = obj[key];
      if (value && typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, 'core_skill')) {
          value.core_skill = false;
          if (Object.prototype.hasOwnProperty.call(value, 'sub1')) {
            value.sub1 = false;
          }
          if (Object.prototype.hasOwnProperty.call(value, 'sub2')) {
            value.sub2 = false;
          }
        }
        traverse(value);
      }
    }
  };

  traverse(tech);
}

// ヘルパー: 指定パスの現職種にcore_skillを設定
function setCoreSkill(jsonObj, pathStr) {
  if (!jsonObj['現職種']) return;
  let target = jsonObj['現職種'];
  const parts = pathStr.split('.');

  for (const part of parts) {
    if (!target[part]) {
      console.warn(`Core skill path not found: ${pathStr}`);
      return;
    }
    target = target[part];
  }

  if (!Object.prototype.hasOwnProperty.call(target, 'core_skill')) {
    console.warn(`core_skill field not found at path: ${pathStr}`);
    return;
  }

  target.core_skill = true;
  if (Object.prototype.hasOwnProperty.call(target, 'sub1')) {
    target.sub1 = false;
  }
  if (Object.prototype.hasOwnProperty.call(target, 'sub2')) {
    target.sub2 = false;
  }
}

// 各ファイルのスキル設定定義（スキル経験）
const CONFIG = {
  'B00003_01.json': [ // AIエンジニア
    ['言語', 'Python', LEVELS.ADVANCED],
    ['言語', 'C/C++', LEVELS.BASIC],
    ['OS', 'Linux', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'AWS', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'GCP', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Docker', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC],
    ['データベース.RDB', 'PostgreSQL ', LEVELS.BASIC] // Space in key from read result
  ],
  'B00003_02.json': [ // サーバーサイド (プロダクト)
    ['言語', 'Python', LEVELS.ADVANCED],
    ['言語', 'Go', LEVELS.ADVANCED],
    ['OS', 'Linux', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'AWS', LEVELS.BASIC],
    ['データベース.RDB', 'MySQL', LEVELS.ADVANCED],
    ['フレームワーク/ライブラリ', 'Django', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Docker', LEVELS.BASIC]
  ],
  'B00003_03.json': [ // サーバーサイド (配信基盤)
    ['言語', 'Go', LEVELS.ADVANCED],
    ['言語', 'C/C++', LEVELS.ADVANCED],
    ['OS', 'Linux', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'AWS', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Docker', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC]
  ],
  'B00003_04.json': [ // SRE
    ['OS', 'Linux', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'AWS', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'GCP', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Terraform', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Ansible', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Docker', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'Kubernetes', LEVELS.ADVANCED],
    ['言語', 'Go', LEVELS.BASIC],
    ['言語', 'Python', LEVELS.BASIC]
  ],
  'B00003_05.json': [ // iOS
    ['言語', 'Swift', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.CIツール', 'Bitrise', LEVELS.BASIC]
  ],
  'B00003_06.json': [ // Android
    ['言語', 'Kotlin', LEVELS.ADVANCED],
    ['言語', 'Java', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC]
  ],
  'B00003_07.json': [ // デバイス (シニア)
    ['言語', 'C/C++', LEVELS.ADVANCED],
    ['OS', 'Linux', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC]
  ],
  'B00003_08.json': [ // 基幹システム
    ['言語', 'Java', LEVELS.ADVANCED],
    ['データベース.RDB', 'Oracle ', LEVELS.BASIC],
    ['データベース.RDB', 'SQL Server', LEVELS.BASIC]
  ],
  'B00003_09.json': [ // エンジニアリングオフィス
    ['言語', 'Python', LEVELS.BASIC],
    ['言語', 'Go', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'GitHub', LEVELS.BASIC]
  ],
  'B00003_10.json': [ // データエンジニア
    ['言語', 'Python', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'GCP', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'BigQuery', LEVELS.ADVANCED],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'AWS', LEVELS.BASIC]
  ],
  'B00003_11.json': [ // フロントエンド
    ['言語', 'TypeScript', LEVELS.ADVANCED],
    ['言語', 'JavaScript', LEVELS.ADVANCED],
    ['フレームワーク/ライブラリ', 'React', LEVELS.ADVANCED],
    ['フレームワーク/ライブラリ', 'Next.js', LEVELS.ADVANCED],
    ['フレームワーク/ライブラリ', 'Vue.js', LEVELS.BASIC]
  ],
  'B00003_12.json': [ // データアナリスト
    ['言語', 'Python', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.ミドルウェア/その他', 'BigQuery', LEVELS.ADVANCED]
  ],
  'B00003_13.json': [ // デバイス (メンバー)
    ['言語', 'C/C++', LEVELS.BASIC],
    ['OS', 'Linux', LEVELS.BASIC]
  ],
  'B00003_14.json': [ // オープンポジション
    ['言語', 'Go', LEVELS.BASIC],
    ['言語', 'Python', LEVELS.BASIC],
    ['言語', 'TypeScript', LEVELS.BASIC],
    ['クラウド/その他ツール/ミドルウェア等.クラウド', 'AWS', LEVELS.BASIC]
  ]
};

// 各ファイルの現職種 core_skill 設定定義
const CORE_SKILL_CONFIG = {
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

async function main() {
  for (const filename in CONFIG) {
    const filePath = path.join(targetDir, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);

      // スキル経験リセット
      resetAllSkills(json);

      // スキル経験設定適用
      const settings = CONFIG[filename];
      for (const [category, skill, level] of settings) {
        setSkill(json, category, skill, level);
      }

      // 現職種 core_skill リセット
      resetCoreSkills(json);

      // 現職種 core_skill 設定
      const corePath = CORE_SKILL_CONFIG[filename];
      if (corePath) {
        setCoreSkill(json, corePath);
      } else {
        console.warn(`No CORE_SKILL_CONFIG found for ${filename}`);
      }

      // 更新日時
      json.updated_at = new Date().toISOString();

      fs.writeFileSync(filePath, JSON.stringify(json, null, 4), 'utf8');
      console.log(`Updated: ${filename}`);
    } catch (e) {
      console.error(`Error processing ${filename}:`, e);
    }
  }
}

main();
