import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

// 共通ロジックを参照
import 'package:common_logic/common_logic.dart' as common_service;

/// マッチング結果を表すモデルクラス
class MatchingResult {
  final String companyId;
  final String jdNumber;
  final Map<String, int> detailedMatchingResult;
  final Map<String, dynamic> skillItemMatchingScore;
  final int jobCount;
  final int nonZeroSkillMatchedCount;
  final int nonCommonJobSkillCount;
  final int jobSkillPoints;
  final int sameSkillMatchingScore;
  final int totalMatchingScore;
  final int totalMatchingScorePercent;

  const MatchingResult({
    required this.companyId,
    required this.jdNumber,
    required this.detailedMatchingResult,
    required this.skillItemMatchingScore,
    required this.jobCount,
    required this.nonZeroSkillMatchedCount,
    required this.nonCommonJobSkillCount,
    required this.jobSkillPoints,
    required this.sameSkillMatchingScore,
    required this.totalMatchingScore,
    required this.totalMatchingScorePercent,
  });

  Map<String, dynamic> toMap() {
    return {
      'company_ID': companyId,
      'JD_Number': jdNumber,
      'detailed_matching_result': detailedMatchingResult,
      'skill_item_matching_score': skillItemMatchingScore,
      'jobCount': jobCount,
      'nonZeroSkillMachedCount': nonZeroSkillMatchedCount,
      'nonCommonJobSkillCount': nonCommonJobSkillCount,
      'job_skill_points': jobSkillPoints,
      'same_skill_matching_score': sameSkillMatchingScore,
      'totalMatchingScore': totalMatchingScore,
      'totalMatchingScorePercent': totalMatchingScorePercent,
    };
  }
}

/// 求人JDとのマッチングを行う共通サービス
class MatchingService {
  // 定数定義
  static const int _scoreSameValue = 100;
  static const int _scoreDiff1 = 110;
  static const int _scoreDiff2 = 120;
  static const int _scoreDiff3 = 130;
  static const int _scoreOther = 0;

  static const int _pointLevel1 = 80;
  static const int _pointLevel2 = 90;
  static const int _pointLevel3 = 100;
  static const int _pointLevel4 = 110;

  final FirebaseFirestore _firestore;
  final FirestoreService _individualService;
  final common_service.CommonService _commonService;

  MatchingService({
    FirebaseFirestore? firestore,
    FirestoreService? individualService,
    common_service.CommonService? commonService,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _individualService = individualService ?? FirestoreService(),
        _commonService = commonService ?? common_service.CommonService();

  /// スキルマッチングの評価を行う
  Map<String, int> evaluateSkillMatching({
    required Map<String, int> sourceSkills,
    required Map<String, int> targetSkills,
  }) {
    final result = <String, int>{};
    
    for (final entry in sourceSkills.entries) {
      final key = entry.key;
      final sourceValue = entry.value;

      if (sourceValue > 0) {
        final targetValue = targetSkills[key] ?? 0;
        if (targetValue > 0) {
          final diff = targetValue - sourceValue;
          if (diff == 0) {
            result[key] = _scoreSameValue; // 同じ値
          } else if (diff == 1) {
            result[key] = _scoreDiff1; // 1大きい
          } else if (diff == 2) {
            result[key] = _scoreDiff2; // 2大きい
          } else if (diff == 3) {
            result[key] = _scoreDiff3; // 3大きい
          } else {
            result[key] = _scoreOther; // その他
          }
        } else {
          result[key] = _scoreOther; // スキルなし
        }
      }
    }
    return result;
  }

  /// マッチング結果の合計値を計算
  int calculateTotalMatchingScore(Map<String, int> matchingResult) {
    int totalScore = 0;
    for (final value in matchingResult.values) {
      if (value > 0) totalScore += value;
    }
    return totalScore;
  }

  /// 個人のスキル経験と全ての求人情報のスキル経験を取得
  Future<(Map<String, dynamic>?, List<Map<String, dynamic>>?)> _getSkillsData(
    String documentId,
  ) async {
    final individualSkills = await _individualService.getSkillExperienceInfo(
      documentId,
    );
    if (individualSkills == null) return (null, null);

    final jobSkillsList = await getAllJobSkills();
    return (individualSkills, jobSkillsList);
  }

  /// 0より大きいスキル項目を抽出
  Set<String> _extractNonZeroSkillItems(Map<String, int> skills) {
    return skills.entries
        .where((entry) => entry.value > 0)
        .map((e) => e.key)
        .toSet();
  }

  /// スキル値に基づいてポイントを計算（求人側の不足分の減算ポイント）
  int _calculateSkillValuePoint(int skillValue) {
    switch (skillValue) {
      case 1:
        return _pointLevel1;
      case 2:
        return _pointLevel2;
      case 3:
        return _pointLevel3;
      case 4:
        return _pointLevel4;
      default:
        return 0;
    }
  }

  /// スキル項目のポイント合計を計算（求人にのみ存在する項目を減算）
  int _calculateTotalSkillPoints(Map<String, int> skills) {
    int totalPoints = 0;
    for (final value in skills.values) {
      if (value > 0) {
        totalPoints -= _calculateSkillValuePoint(value);
      }
    }
    return totalPoints;
  }

  /// 個人に無いJDスキル項目の各種指標を計算
  Map<String, dynamic> calculateNonMatchingJobSkillItems({
    required Map<String, int> individualSkills,
    required Map<String, int> jobSkills,
  }) {
    final individualSkillItems = _extractNonZeroSkillItems(individualSkills);
    final jobSkillItems = _extractNonZeroSkillItems(jobSkills);

    final jobCount = jobSkillItems.length;
    
    final nonCommonJobSkillsDiff = jobSkillItems.difference(individualSkillItems);
    final nonCommonJobSkill = Map<String, int>.fromEntries(
      nonCommonJobSkillsDiff
          .map((skill) => MapEntry(skill, jobSkills[skill] ?? 0)),
    );
    
    final nonCommonJobSkillCount = nonCommonJobSkillsDiff.length;
    final jobSkillPoints = _calculateTotalSkillPoints(nonCommonJobSkill);

    return {
      'jobCount': jobCount,
      'nonCommonJobSkillCount': nonCommonJobSkillCount,
      'job_skill_points': jobSkillPoints,
    };
  }

  /// マッチング結果レコード作成
  MatchingResult _createMatchingResult({
    required Map<String, dynamic> jobSkills,
    required int nonZeroSkillMatchedCount,
    required Map<String, int> detailedMatchingResult,
    required Map<String, dynamic> skillItemMatchingScore,
    required int sameSkillMatchingScore,
    required int totalMatchingScore,
    required int totalMatchingScorePercent,
  }) {
    return MatchingResult(
      companyId: jobSkills['company_ID'] as String,
      jdNumber: jobSkills['JD_Number'] as String,
      detailedMatchingResult: detailedMatchingResult,
      skillItemMatchingScore: skillItemMatchingScore,
      jobCount: skillItemMatchingScore['jobCount'] as int,
      nonZeroSkillMatchedCount: nonZeroSkillMatchedCount,
      nonCommonJobSkillCount:
          skillItemMatchingScore['nonCommonJobSkillCount'] as int,
      jobSkillPoints: skillItemMatchingScore['job_skill_points'] as int,
      sameSkillMatchingScore: sameSkillMatchingScore,
      totalMatchingScore: totalMatchingScore,
      totalMatchingScorePercent: totalMatchingScorePercent,
    );
  }

  /// スキルマッチング評価と合計スコア計算
  Map<String, dynamic> _evaluateAndCalculateScores({
    required Map<String, int> individualSkillMap,
    required Map<String, int> jobSkillMap,
  }) {
    final matchingResult = evaluateSkillMatching(
      sourceSkills: individualSkillMap,
      targetSkills: jobSkillMap,
    );
    
    final nonZeroSkillMatchedCount = _commonService.countNonZeroSkills(
      matchingResult,
    );
    
    final skillItemMatchingScore = calculateNonMatchingJobSkillItems(
      individualSkills: individualSkillMap,
      jobSkills: jobSkillMap,
    );

    final detailedMatchingResult = matchingResult;
    final sameSkillMatchingScore = calculateTotalMatchingScore(matchingResult);
    
    final jobSkillPoints = skillItemMatchingScore['job_skill_points'] as int? ?? 0;
    final totalMatchingScore = sameSkillMatchingScore + jobSkillPoints;
    
    final totalMatchingScorePercent = nonZeroSkillMatchedCount > 0
        ? (totalMatchingScore / nonZeroSkillMatchedCount).round()
        : 0;

    return {
      'nonZeroSkillMachedCount': nonZeroSkillMatchedCount,
      'matchingResult': matchingResult,
      'skillItemMatchingScore': skillItemMatchingScore,
      'detailedMatchingResult': detailedMatchingResult,
      'sameSkillMatchingScore': sameSkillMatchingScore,
      'totalMatchingScore': totalMatchingScore,
      'totalMatchingScorePercent': totalMatchingScorePercent,
    };
  }

  /// 全ての求人情報のスキル経験を取得（共有サービス版）
  Future<List<Map<String, dynamic>>> getAllJobSkills() async {
    final result = <Map<String, dynamic>>[];
    try {
      final companiesSnapshot =
          await _firestore.collection('job_description').get();
          
      for (final companyDoc in companiesSnapshot.docs) {
        final companyId = companyDoc.id;
        final jdSnapshot = await _firestore
            .collection('job_description/$companyId/JD_Number')
            .get();
            
        for (final jdDoc in jdSnapshot.docs) {
          final data = jdDoc.data();
          if (data.containsKey('スキル経験')) {
            final skillExperience = data['スキル経験'] as Map<String, dynamic>;
            Map<String, int> evaluatedSkills;

            // 職種データの構造に応じたスキル評価
            if (skillExperience.containsKey('現職種')) {
              final currentPositionData =
                  skillExperience['現職種'] as Map<String, dynamic>;
              final currentPositionResult = _commonService
                  .evaluateCurrentPositionSkills(currentPositionData);
                  
              final otherSkillData = Map<String, dynamic>.from(skillExperience);
              otherSkillData.remove('現職種');
              
              final otherSkillResult = _commonService.evaluateSkills(
                otherSkillData,
              );
              
              evaluatedSkills = Map<String, int>.from(otherSkillResult);
              evaluatedSkills.addAll(currentPositionResult);
            } else if (skillExperience.containsKey('原職種')) {
              final originalPositionData =
                  skillExperience['原職種'] as Map<String, dynamic>;
              final originalPositionResult = _commonService
                  .evaluateCurrentPositionSkills(originalPositionData);
                  
              final otherSkillData = Map<String, dynamic>.from(skillExperience);
              otherSkillData.remove('原職種');
              
              final otherSkillResult = _commonService.evaluateSkills(
                otherSkillData,
              );
              
              evaluatedSkills = Map<String, int>.from(otherSkillResult);
              evaluatedSkills.addAll(originalPositionResult);
            } else {
              evaluatedSkills = _commonService.evaluateSkills(skillExperience);
            }

            result.add({
              'company_ID': data['company_ID'] as String,
              'JD_Number': data['JD_Number'] as String,
              'スキル経験': evaluatedSkills,
            });
          }
        }
      }
      return result;
    } catch (e) {
      debugPrint('getAllJobSkills エラー: $e');
      rethrow;
    }
  }

  /// 個人のスキル経験と全ての求人情報のスキル経験をマッチング
  Future<List<Map<String, dynamic>>> matchSkillsWithJobs(
    String documentId,
  ) async {
    final (individualSkills, jobSkillsList) = await _getSkillsData(documentId);
    if (individualSkills == null || jobSkillsList == null) return [];

    final matchingResults = <Map<String, dynamic>>[];
    
    // Future.waitによる並列処理は、計算負荷が高いためここではループ処理を維持するが、
    // 非同期I/Oが発生しない純粋な計算処理であればIsolateの使用も検討すべき箇所。
    // 現状はメインスレッドで順次実行。
    
    for (final jobSkills in jobSkillsList) {
      debugPrint(
        '処理中の求人: ${jobSkills['company_ID']} - ${jobSkills['JD_Number']}',
      );
      
      final jobSkillMap = Map<String, int>.from(
        jobSkills['スキル経験'] as Map<String, dynamic>,
      );
      final individualSkillMap = Map<String, int>.from(individualSkills);
      
      final evaluationResults = _evaluateAndCalculateScores(
        individualSkillMap: individualSkillMap,
        jobSkillMap: jobSkillMap,
      );
      
      final totalMatchingScore = evaluationResults['totalMatchingScore'] as int;
      final totalMatchingScorePercent =
          evaluationResults['totalMatchingScorePercent'] as int;

      if (totalMatchingScore >= 0) {
        if (100 < totalMatchingScorePercent &&
            totalMatchingScorePercent <= 120) {
          final resultModel = _createMatchingResult(
            jobSkills: jobSkills,
            nonZeroSkillMatchedCount:
                evaluationResults['nonZeroSkillMachedCount'] as int,
            detailedMatchingResult:
                evaluationResults['detailedMatchingResult'] as Map<String, int>,
            skillItemMatchingScore:
                evaluationResults['skillItemMatchingScore']
                    as Map<String, dynamic>,
            sameSkillMatchingScore:
                evaluationResults['sameSkillMatchingScore'] as int,
            totalMatchingScore: totalMatchingScore,
            totalMatchingScorePercent: totalMatchingScorePercent,
          );
          
          matchingResults.add(resultModel.toMap());
        }
      }
    }
    return sortMatchingResultsByScore(matchingResults);
  }

  /// スコア降順で並び替え
  List<Map<String, dynamic>> sortMatchingResultsByScore(
    List<Map<String, dynamic>> results,
  ) {
    results.sort((a, b) {
      final ap = (a['totalMatchingScorePercent'] as int?) ?? 0;
      final bp = (b['totalMatchingScorePercent'] as int?) ?? 0;
      if (bp != ap) return bp.compareTo(ap);
      
      final ascore = (a['totalMatchingScore'] as int?) ?? 0;
      final bscore = (b['totalMatchingScore'] as int?) ?? 0;
      return bscore.compareTo(ascore);
    });
    return results;
  }
}

/// FirestoreService Stub for reference purpose
/// (Original: package:common_frontend/services/individual_service.dart)
class FirestoreService {
  Future<Map<String, dynamic>?> getSkillExperienceInfo(String documentId) async {
    // This is a stub implementation.
    // In actual implementation, this would fetch data from Firestore.
    return null;
  }
}
