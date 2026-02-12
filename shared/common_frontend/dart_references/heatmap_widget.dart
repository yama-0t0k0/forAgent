import 'package:flutter/material.dart';

/// スキル/志向分析用ヒートマップウィジェット
/// README.md 13行目の「高精度マッチング: ヒートマップ可視化による定量的スキル/志向分析」機能用
class HeatmapWidget extends StatelessWidget {
  final Map<String, double> skillData;
  final Map<String, double> preferenceData;
  final double width;
  final double height;

  const HeatmapWidget({
    Key? key,
    required this.skillData,
    required this.preferenceData,
    this.width = 100,
    this.height = 200,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.grey[300]!,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: const Padding(
        padding: EdgeInsets.all(4),
        child: _HeatmapGrid(),
      ),
    );
  }
}

/// 10行×5列のヒートマップグリッド
class _HeatmapGrid extends StatelessWidget {
  const _HeatmapGrid();

  @override
  Widget build(BuildContext context) {
    final gridData = _generateHeatmapGridData();
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(10, (rowIndex) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(5, (colIndex) {
            final cellIndex = rowIndex * 5 + colIndex;
            return _HeatmapCell(data: gridData[cellIndex]);
          }),
        );
      }),
    );
  }

  /// 10行×5列のグリッドデータを生成（青系グラデーション）
  List<HeatmapCellData> _generateHeatmapGridData() {
    final List<HeatmapCellData> gridData = [];
    for (int i = 0; i < 50; i++) {
      final double value = (i % 10) / 10.0; // 0.0〜0.9
      final Color color = _calculateBlueHeatmapColor(value);
      gridData.add(HeatmapCellData(color: color, value: value));
    }
    return gridData;
  }

  /// マッチング度に基づいて青系の色を計算
  Color _calculateBlueHeatmapColor(double value) {
    if (value >= 0.8) {
      return const Color(0xFF0D47A1); // 濃い青
    } else if (value >= 0.6) {
      return const Color(0xFF1976D2); // 中程度の青
    } else if (value >= 0.4) {
      return const Color(0xFF42A5F5); // 明るい青
    } else if (value >= 0.2) {
      return const Color(0xFF90CAF9); // 薄い青
    } else {
      return const Color(0xFFE3F2FD); // 非常に薄い青
    }
  }
}

/// 個別のヒートマップセル
class _HeatmapCell extends StatelessWidget {
  final HeatmapCellData data;
  const _HeatmapCell({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12,
      height: 12,
      margin: const EdgeInsets.all(1),
      decoration: BoxDecoration(
        color: data.color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}

/// ヒートマップセルのデータクラス
class HeatmapCellData {
  final Color color;
  final double value;

  HeatmapCellData({
    required this.color,
    required this.value,
  });
}

/// ヒートマップ用のプレースホルダーウィジェット
class HeatmapPlaceholder extends StatelessWidget {
  final double width;
  final double height;

  const HeatmapPlaceholder({
    Key? key,
    this.width = 80,
    this.height = 40,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.grey[300]!,
          width: 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildPlaceholderCell(Colors.green[200]!),
              _buildPlaceholderCell(Colors.orange[200]!),
              _buildPlaceholderCell(Colors.red[200]!),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildPlaceholderCell(Colors.blue[200]!),
              _buildPlaceholderCell(Colors.purple[200]!),
              _buildPlaceholderCell(Colors.teal[200]!),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderCell(Color color) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}
