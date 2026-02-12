/**
 * ヒートマップ関連の定数定義
 * Heatmap related constants
 */

export const HEATMAP_LEVELS = {
    NONE: 0,
    LEARNING: 1,
    BASIC: 2,
    APPLIED: 3,
    EXPERT: 4
};

export const HEATMAP_THRESHOLDS = {
    LEVEL_4: 0.8,
    LEVEL_3: 0.5,
    LEVEL_2: 0.2,
    LEVEL_1: 0
};

export const HEATMAP_COLORS = {
    LEVEL_0: '#E2E8F0',
    LEVEL_1: '#BAE6FD',
    LEVEL_2: '#7DD3FC',
    LEVEL_3: '#0EA5E9', // THEME.accent is usually close to this, but defining explicit color for consistency
    LEVEL_4: '#0369A1',
    BORDER: '#334155'
};

export const ASPIRATION_WEIGHTS = {
    VERY_HIGH: 1.0,
    HIGH: 0.7,
    MEDIUM: 0.3,
    LOW: 0.1,
    NONE: 0.0
};

// Mock values for visualization fallback
export const HEATMAP_MOCK_VALUES = [0.8, 0.3, 0.5, 1.0];
