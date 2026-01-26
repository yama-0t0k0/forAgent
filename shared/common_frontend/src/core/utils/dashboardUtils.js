import { HeatmapCalculator } from './HeatmapCalculator';

/**
 * FMJSのタイムスタンプ (YYYYMMDDtttttt) をDateオブジェクトに変換します。
 * @param {string|number} ts タイムスタンプ文字列または数値
 * @returns {Date|null} Dateオブジェクト、または無効な場合はnull
 */
export const parseFmjsTimestamp = (ts) => {
    if (!ts) return null;
    const str = ts.toString();
    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10) - 1;
    const day = parseInt(str.substring(6, 8), 10);
    return new Date(year, month, day);
};

/**
 * 会社IDから会社名を解決します。
 * @param {string} companyId 会社ID
 * @param {Array<Object>} corporateData 会社データの配列
 * @returns {string} 会社名またはID
 */
export const getCompanyName = (companyId, corporateData) => {
    if (!companyId || !corporateData) return '-';
    /** @type {Object} */
    const company = corporateData.find(c => c.id === companyId);
    return company?.companyName || company?.name || company?.['会社概要']?.['会社名'] || companyId;
};

/**
 * ユーザーデータからスキルを再帰的に抽出します。
 * @param {Object} user ユーザーデータ
 * @returns {{core: string[], sub1: string[], sub2: string[]}} 分類されたスキルリスト
 */
export const extractSkills = (user) => {
    const skills = { core: [], sub1: [], sub2: [] };
    // Handle both user profile structure (現職種) and job description structure (スキル経験)
    const root = user?.['スキル経験']?.['現職種']?.['技術職'] || user?.['スキル経験'];

    if (!root) return skills;

    /**
     * オブジェクトを再帰的に走査してスキルを抽出する内部関数
     * @param {Object} obj - 走査対象のオブジェクト
     */
    const traverse = (obj) => {
        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                if (value.core_skill) skills.core.push(key);
                if (value.sub1) skills.sub1.push(key);
                if (value.sub2) skills.sub2.push(key);

                traverse(value);
            }
        });
    };

    traverse(root);
    return skills;
};

/**
 * 高密度のヒートマップ領域を計算します。
 * @param {Object} userData ユーザーデータ
 * @returns {{data: Array<{value: number, id: number}>, rows: number, cols: number}} ヒートマップデータと行列数
 */
export const getHighDensityHeatmapData = (userData) => {
    // Use skills-only calculation as requested
    const fullGrid = HeatmapCalculator.calculateSkillsOnly(userData);
    const ROWS = 10;
    const COLS = 9;
    const WINDOW_ROWS = 3; // 縦3 (Requested: 3)
    const WINDOW_COLS = 4; // 横4 (Requested: 4)

    let maxScore = -1;
    let bestStartRow = 0;
    let bestStartCol = 0;

    // Sliding window to find highest density
    for (let r = 0; r <= ROWS - WINDOW_ROWS; r++) {
        for (let c = 0; c <= COLS - WINDOW_COLS; c++) {
            let currentScore = 0;
            for (let wr = 0; wr < WINDOW_ROWS; wr++) {
                for (let wc = 0; wc < WINDOW_COLS; wc++) {
                    const index = (r + wr) * COLS + (c + wc);
                    currentScore += fullGrid[index] || 0;
                }
            }
            if (currentScore > maxScore) {
                maxScore = currentScore;
                bestStartRow = r;
                bestStartCol = c;
            }
        }
    }

    // Extract data for the best window
    const windowData = [];
    for (let wr = 0; wr < WINDOW_ROWS; wr++) {
        for (let wc = 0; wc < WINDOW_COLS; wc++) {
            const index = (bestStartRow + wr) * COLS + (bestStartCol + wc);
            windowData.push({
                value: fullGrid[index] || 0,
                id: index // Keep original index for label lookup
            });
        }
    }

    return { data: windowData, rows: WINDOW_ROWS, cols: WINDOW_COLS };
};
