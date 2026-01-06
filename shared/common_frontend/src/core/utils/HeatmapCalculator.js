import { HeatmapMapper } from './HeatmapMapper';

/**
 * ヒートマップの表示データを計算するクラス。
 * Dart 側の HeatmapEngine, CommonService, MatchingLogic のロジックを統合しています。
 */
export class HeatmapCalculator {
    static SKILL_SCORES = {
        '専門的な知識やスキルを有し他者を育成/指導できる': 1.0,
        '実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる': 0.8,
        '実務で基礎的なタスクを遂行可能': 0.5,
        '実務経験は無いが個人活動で経験あり': 0.2,
        '経験なし': 0.0,
    };

    static ASPIRATION_SCORES = {
        'とてもやりたい': 1.0,
        'やりたい': 0.7,
        'どちらでもない': 0.3,
        'あまり興味なし': 0.1,
        '興味なし': 0.0,
    };

    /**
     * JSONデータ（JDまたは個人データ）から 90マスのヒートマップ配列を生成します。
     * @param {Object} data - 「スキル経験」と「志向」を含むオブジェクト
     * @returns {number[]} 90個の数値配列（0.0〜1.0）
     */
    static calculate(data) {
        const grid = new Array(HeatmapMapper.totalTiles).fill(0.0);

        if (!data) return grid;

        // スキル経験の処理
        if (data['スキル経験']) {
            this._evaluateSkillsRecursive(data['スキル経験'], '', (key, score) => {
                const index = HeatmapMapper.getIndex(key, false);
                if (index !== null) {
                    grid[index] = Math.max(grid[index], score);
                }
            });
        }

        // 志向の処理
        if (data['志向']) {
            const aspirationData = data['志向'];

            // 基本的な志向
            Object.keys(aspirationData).forEach(categoryKey => {
                const categoryVal = aspirationData[categoryKey];
                if (typeof categoryVal === 'object' && categoryVal !== null) {
                    Object.keys(categoryVal).forEach(key => {
                        const val = categoryVal[key];
                        if (typeof val === 'boolean') {
                            if (val) {
                                const index = HeatmapMapper.getIndex(key, true);
                                if (index !== null) {
                                    grid[index] = 1.0; // ブール値の場合は 1.0
                                }
                            }
                        } else if (typeof val === 'string' && this.ASPIRATION_SCORES[val] !== undefined) {
                            const index = HeatmapMapper.getIndex(key, true);
                            if (index !== null) {
                                grid[index] = Math.max(grid[index], this.ASPIRATION_SCORES[val]);
                            }
                        }
                    });
                }
            });

            // 「今後の希望」などのスキル形式の志向を再帰的に処理
            if (aspirationData['今後の希望']) {
                this._evaluateAspirationsRecursive(aspirationData['今後の希望'], (key, score) => {
                    const index = HeatmapMapper.getIndex(key, true);
                    if (index !== null) {
                        grid[index] = Math.max(grid[index], score);
                    }
                });
            }
        }

        return grid;
    }

    /**
     * スキル経験を再帰的に評価します。
     * @private
     */
    static _evaluateSkillsRecursive(node, currentPath, onFound) {
        if (typeof node !== 'object' || node === null) return;

        // このノード自体が評価ノード（5項目を持つ）かチェック
        const score = this._getSkillScore(node);
        if (score !== null) {
            const key = currentPath.split('.').pop();
            onFound(key, score);
            return;
        }

        // 子ノードを走査
        Object.keys(node).forEach(key => {
            const child = node[key];
            const newPath = currentPath === '' ? key : `${currentPath}.${key}`;
            this._evaluateSkillsRecursive(child, newPath, onFound);
        });
    }

    /**
     * 志向（スキル形式）を再帰的に評価します。
     * @private
     */
    static _evaluateAspirationsRecursive(node, onFound) {
        if (typeof node !== 'object' || node === null) return;

        // このノード自体が評価ノード（志向の選択肢を持つ）かチェック
        const score = this._getAspirationScore(node);
        if (score !== null) {
            // 志向の場合はパスではなくキーのみを使用
            // (マッピングがキー名ベースのため)
            return;
        }

        Object.keys(node).forEach(key => {
            const child = node[key];
            const score = this._getAspirationScore(child);
            if (score !== null) {
                onFound(key, score);
            } else {
                this._evaluateAspirationsRecursive(child, onFound);
            }
        });
    }

    /**
     * スキル評価ノードからスコアを取得します。
     * @private
     */
    static _getSkillScore(node) {
        let maxScore = null;
        let found = false;
        Object.keys(this.SKILL_SCORES).forEach(option => {
            if (node[option] === true) {
                maxScore = Math.max(maxScore || 0, this.SKILL_SCORES[option]);
                found = true;
            }
        });
        return found ? maxScore : null;
    }

    /**
     * 志向評価ノードからスコアを取得します。
     * @private
     */
    static _getAspirationScore(node) {
        let maxScore = null;
        let found = false;
        Object.keys(this.ASPIRATION_SCORES).forEach(option => {
            if (node[option] === true) {
                maxScore = Math.max(maxScore || 0, this.ASPIRATION_SCORES[option]);
                found = true;
            }
        });
        return found ? maxScore : null;
    }
}
