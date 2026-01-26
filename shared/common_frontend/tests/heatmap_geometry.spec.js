// 機能概要:
// - HeatmapGeometry の式ベース座標計算の単体検証（Node.jsで実行可能）
// - 固定幅/列数9の前提で、代表インデックスに対する座標が範囲内かを確認
//
// ディレクトリ構造:
// └── shared/common_frontend/tests/heatmap_geometry.spec.js (本ファイル)
//     └── ../src/core/utils/HeatmapGeometry.js (対象ユーティリティ)
//
// 実行方法:
// - node shared/common_frontend/tests/heatmap_geometry.spec.js
// - 失敗時はthrow、成功時はコンソールにOKメッセージ

const assert = require('assert');

/**
 * Tests tile size calculation.
 * @param {object} mod - The module to test.
 */
async function testTileSize(mod) {
  const { computeStandardContainerWidth, computeStandardTileSize } = mod;
  const containerWidth = computeStandardContainerWidth();
  const tile = computeStandardTileSize();
  assert(tile > 0, 'tile size should be positive');
  assert(containerWidth > 0, 'container width should be positive');
}

/**
 * Tests tooltip position calculation.
 * @param {Object} mod - The HeatmapGeometry module.
 */
async function testTooltipPositions(mod) {
  const { computeStandardContainerWidth, computeStandardTileSize, computeTooltipByFormula } = mod;
  const itemCount = 90;
  const columns = 9;
  const tileSize = computeStandardTileSize();
  const margin = 2;
  const tooltipWidth = 140;
  const containerWidth = computeStandardContainerWidth();

  const indices = [0, 8, 9, 17, 80, 89];
  indices.forEach((index) => {
    const pos = computeTooltipByFormula({
      index,
      itemCount,
      columns,
      tileSize,
      margin,
      tooltipWidth,
      containerWidth
    });
    assert(pos.left >= 0, `left should be >= 0 (index ${index})`);
    assert(pos.left <= containerWidth - tooltipWidth, `left should be within container (index ${index})`);
    assert(typeof pos.top === 'number', `top should be number (index ${index})`);
    assert(typeof pos.arrowLeft === 'number', `arrowLeft should be number (index ${index})`);
  });
}

/**
 * Runs all tests.
 */
async function run() {
  const mod = await import('../src/core/utils/HeatmapGeometry.js');
  await testTileSize(mod);
  await testTooltipPositions(mod);
  console.log('OK: HeatmapGeometry tests passed.');
}

run();
