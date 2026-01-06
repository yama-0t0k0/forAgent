import 'package:common_logic/common_logic.dart';
import 'package:domain_models/domain_models.dart';
import 'heatmap_mapper.dart';

/// ヒートマップの計算とマッピングを行うエンジン
class HeatmapEngine {
  final _commonService = CommonService();
  final _matchingLogic = MatchingLogic();

  /// 個人データとJDデータを比較し、ヒートマップ用の結果を生成します。
  MatchResult calculate(
    Map<String, dynamic> individualJson,
    Map<String, dynamic> jdJson,
  ) {
    // 1. 各項目のスコア化 (0-4点)
    final individualSkills = _evaluateAllSkills(individualJson['スキル経験'] ?? {});
    final jdSkills = _evaluateAllSkills(jdJson['スキル経験'] ?? {});
    
    final individualAspirations = _evaluateAllAspirations(individualJson['志向'] ?? {});
    final jdAspirations = _evaluateAllAspirations(jdJson['志向'] ?? {});

    // 2. グリッド配置へのマッピング (0.0 - 1.0 に正規化)
    final indSkillGrid = _mapToGrid(individualSkills, isAspiration: false);
    final jdSkillGrid = _mapToGrid(jdSkills, isAspiration: false);
    
    final indAspGrid = _mapToGrid(individualAspirations, isAspiration: true);
    final jdAspGrid = _mapToGrid(jdAspirations, isAspiration: true);

    // 3. 全体マッチング率の計算 (既存ロジック活用)
    final matchingResult = _matchingLogic.evaluateSkillMatching(individualSkills, jdSkills);
    final totalScore = _matchingLogic.calculateTotalMatchingScore(matchingResult);
    // 簡易的なマッチング率 (仮: 満点を全項目 100点 とした場合)
    final jobCount = jdSkills.length;
    final rate = jobCount > 0 ? (totalScore / (jobCount * 100.0)) : 0.0;

    return MatchResult(
      overallMatchingRate: rate,
      individualSkillHeatmap: indSkillGrid,
      jdSkillHeatmap: jdSkillGrid,
      individualAspirationHeatmap: indAspGrid,
      jdAspirationHeatmap: jdAspGrid,
      metadata: {
        'skillMatchCount': matchingResult.length,
        'jdSkillTotal': jobCount,
      },
    );
  }

  /// スキル経験を総合的に評価
  Map<String, int> _evaluateAllSkills(Map<String, dynamic> skillExpJson) {
    if (skillExpJson.isEmpty) return {};
    
    final result = _commonService.evaluateSkills(skillExpJson);
    
    // 現職種特有のロジックがあればマージ
    if (skillExpJson.containsKey('現職種')) {
      final cpSkills = _commonService.evaluateCurrentPositionSkills(
        skillExpJson['現職種'] as Map<String, dynamic>
      );
      result.addAll(cpSkills);
    }
    
    return result;
  }

  /// 志向を総合的に評価
  Map<String, int> _evaluateAllAspirations(Map<String, dynamic> aspirationJson) {
    if (aspirationJson.isEmpty) return {};

    // 通常の興味評価
    final result = _commonService.evaluateInterests(aspirationJson);

    // 「今後の希望」などのスキル評価構造を持つノードを処理
    if (aspirationJson.containsKey('今後の希望')) {
      final futureHopes = aspirationJson['今後の希望'] as Map<String, dynamic>;
      final skillStyleHopes = _commonService.evaluateSkills(futureHopes);
      result.addAll(skillStyleHopes);
    }

    // 「希望職種」などの単純な真偽値ノードを処理 (必要に応じて)
    if (aspirationJson.containsKey('希望職種')) {
      final preferredRoles = aspirationJson['希望職種'] as Map<String, dynamic>;
      preferredRoles.forEach((category, roles) {
        if (roles is Map<String, dynamic>) {
          roles.forEach((role, value) {
            if (value == true) result[role] = 4; // とてもやりたい相当
          });
        }
      });
    }

    return result;
  }

  /// スコアマップを90マスのグリッド配列に変換
  List<double> _mapToGrid(Map<String, int> scores, {required bool isAspiration}) {
    final grid = List<double>.filled(HeatmapMapper.totalTiles, 0.0);
    
    scores.forEach((key, score) {
      // 階層パスの末尾を取得 (例: "言語.Python" -> "Python")
      final parts = key.split('.');
      final finalKey = parts.last;
      
      final index = HeatmapMapper.getIndex(finalKey, isAspiration: isAspiration);
      if (index != null && index < HeatmapMapper.totalTiles) {
        // 0-4点を 0.0 - 1.0 に変換
        grid[index] = score / 4.0;
      }
    });
    
    return grid;
  }
}
