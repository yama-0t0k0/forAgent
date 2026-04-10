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

import { THEME } from '@shared/src/core/theme/theme';

export const HEATMAP_COLORS = {
    LEVEL_0: THEME.chartLevel0,
    LEVEL_1: THEME.chartLevel1,
    LEVEL_2: THEME.chartLevel2,
    LEVEL_3: THEME.chartLevel3,
    LEVEL_4: THEME.chartLevel4,
    BORDER: THEME.textNeutral
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
