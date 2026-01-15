// 機能概要:
// - ヒートマップのタイルサイズ・ツールチップ座標計算の共通ユーティリティ
// - 固定幅（SCREEN_WIDTH - 40）と列数9の前提で、式ベースで安定した座標を算出
// - onLayout依存を避け、ScrollView内でも安定した表示を実現
//
// ディレクトリ構造:
// ├── shared/common_frontend/src/core/utils/
// │   ├── HeatmapGeometry.js   (本ファイル)
// │   ├── HeatmapCalculator.js (値計算)
// │   └── HeatmapMapper.js     (ラベル/インデックス対応)
// └── shared/common_frontend/src/core/components/
//     ├── HeatmapGrid.js       (詳細画面用グリッド)
//     └── MiniHeatmap.js       (一覧プレビュー用グリッド)
//
// 実行方法:
// - フロントエンド: Metroバンドルにより自動読み込み（ES Modules）
// - 単体検証: Node.jsでの簡易テスト実行が可能（CommonJSエクスポートを併用）
// 例: node shared/common_frontend/tests/heatmap_geometry.spec.js

const getScreenWidth = () => {
  try {
    const { Dimensions } = require('react-native');
    return Dimensions.get('window').width;
  } catch (e) {
    return 360;
  }
};

export const computeStandardContainerWidth = () => {
  return getScreenWidth() - 40;
};

export const computeStandardTileSize = () => {
  const columns = 9;
  const containerWidth = computeStandardContainerWidth();
  return Math.floor(containerWidth / columns) - 4;
};

export const computeTileSizeFromContainer = (containerWidth, columns = 9) => {
  return Math.floor(containerWidth / columns) - 4;
};

export const computeTooltipByFormula = ({
  index,
  itemCount,
  columns = 9,
  tileSize,
  margin = 2,
  tooltipWidth = 140,
  containerWidth = computeStandardContainerWidth(),
}) => {
  const totalTileSize = tileSize + (margin * 2);
  const row = Math.floor(index / columns);
  const col = index % columns;
  const totalRows = Math.ceil(itemCount / columns);

  let left = (col * totalTileSize) + (totalTileSize / 2) - (tooltipWidth / 2);
  left = Math.max(0, Math.min(containerWidth - tooltipWidth, left));

  const showAbove = row >= totalRows - 2;
  const top = showAbove
    ? (row * totalTileSize) - 90 - 8
    : ((row + 1) * totalTileSize) + 8;

  const arrowLeft = (col * totalTileSize) + (totalTileSize / 2) - left - 6;

  return { left, top, showAbove, arrowLeft };
};

export const HeatmapGeometry = {
  computeStandardContainerWidth,
  computeStandardTileSize,
  computeTileSizeFromContainer,
  computeTooltipByFormula,
};
