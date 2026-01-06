import 'package:equatable/equatable.dart';

/// ヒートマップエンジンの計算結果を保持するクラス
class MatchResult extends Equatable {
  final double overallMatchingRate;
  final List<double> individualSkillHeatmap; // 0.0 to 1.0 (90 elements)
  final List<double> jdSkillHeatmap;         // 0.0 to 1.0 (90 elements)
  final List<double> individualAspirationHeatmap;
  final List<double> jdAspirationHeatmap;
  final Map<String, dynamic> metadata;

  const MatchResult({
    required this.overallMatchingRate,
    required this.individualSkillHeatmap,
    required this.jdSkillHeatmap,
    required this.individualAspirationHeatmap,
    required this.jdAspirationHeatmap,
    this.metadata = const {},
  });

  @override
  List<Object?> get props => [
        overallMatchingRate,
        individualSkillHeatmap,
        jdSkillHeatmap,
        individualAspirationHeatmap,
        jdAspirationHeatmap,
        metadata,
      ];
}
