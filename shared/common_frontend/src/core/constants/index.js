export * from './navigation';
export * from './system';
export * from './selection';
export * from './ui';
export * from './field';

/**
 * スキルレベルの定義
 * 0: 経験なし
 * 1: 個人活動のみ
 * 2: 基礎的なタスク遂行可能
 * 3: 応用的な問題解決が可能
 * 4: 指導可能レベル
 */
export const SKILL_LEVELS = {
  0: "経験なし",
  1: "実務経験は無いが個人活動で経験あり",
  2: "実務で基礎的なタスクを遂行可能",
  3: "実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる",
  4: "専門的な知識やスキルを有し他者を育成/指導できる"
};
export const SKILL_LEVEL_TEXTS = Object.values(SKILL_LEVELS);

/**
 * つながりレベルの定義
 * 1: 通常つながり
 * 2: 準アルムナイ
 * 3: 正アルムナイ
 */
export const CONNECTION_LEVELS = {
  1: "Lv1通常つながり(相互フォロー)",
  2: "Lv2準アルムナイ(現/元非正社員or半年以上の同僚関係)",
  3: "Lv3正アルムナイ(現/元正社員or2年以上の同僚関係)"
};
export const CONNECTION_LEVEL_TEXTS = Object.values(CONNECTION_LEVELS);
