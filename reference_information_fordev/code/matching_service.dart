import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:common_frontend/services/individual_service.dart' as individual;
import 'package:common_frontend/services/common_service.dart' as common_service;

/// 求人JDとのマッチングを行う共通サービス
class MatchingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final _individualService = individual.FirestoreService();
  final _commonService = common_service.CommonService();

  /// スキルマッチングの評価を行う
  Map<String, int> evaluateSkillMatching(
    Map<String, int> sourceSkills,
    Map<String, int> targetSkills,
  ) {
    final result = <String, int>{};
    sourceSkills.forEach((key, sourceValue) {
      if (sourceValue > 0) {
        final targetValue = targetSkills[key] ?? 0;
        if (targetValue > 0) {
          final diff = targetValue - sourceValue;
          if (diff == 0) {
            result[key] = 100; // 同じ値
          } else if (diff == 1) {
            result[key] = 110; // 1大きい
          } else if (diff == 2) {
            result[key] = 120; // 2大きい
          } else if (diff == 3) {
            result[key] = 130; // 3大きい
          } else {
            result[key] = 0; // その他
          }
        } else {
          result[key] = 0; // スキルなし
        }
      }
    });
    return result;
  }

  /// マッチング結果の合計値を計算
  int calculateTotalMatchingScore(Map<String, int> matchingResult) {
    int totalScore = 0;
    matchingResult.forEach((_, value) {
      if (value > 0) totalScore += value;
    });
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
        return 80;
      case 2:
        return 90;
      case 3:
        return 100;
      case 4:
        return 110;
      default:
        return 0;
    }
  }

  /// スキル項目のポイント合計を計算（求人にのみ存在する項目を減算）
  int _calculateTotalSkillPoints(Map<String, int> skills) {
    int totalPoints = 0;
    skills.forEach((_, value) {
      if (value > 0) {
        totalPoints -= _calculateSkillValuePoint(value);
      }
    });
    return totalPoints;
  }

  /// 個人に無いJDスキル項目の各種指標を計算
  Map<String, dynamic> calculateNonMatchingJobSkillItems(
    Map<String, int> individualSkills,
    Map<String, int> jobSkills,
  ) {
    final individualSkillItems = _extractNonZeroSkillItems(individualSkills);
    final jobSkillItems = _extractNonZeroSkillItems(jobSkills);

    final jobCount = jobSkillItems.length;
    final nonCommonJobSkill = Map<String, int>.fromEntries(
      jobSkillItems
          .difference(individualSkillItems)
          .map((skill) => MapEntry(skill, jobSkills[skill] ?? 0)),
    );
    final nonCommonJobSkillCount = jobSkillItems
        .difference(individualSkillItems)
        .length;

    final jobSkillPoints = _calculateTotalSkillPoints(nonCommonJobSkill);

    return {
      'jobCount': jobCount,
      'nonCommonJobSkillCount': nonCommonJobSkillCount,
      'job_skill_points': jobSkillPoints,
    };
  }

  /// マッチング結果レコード作成
  Map<String, dynamic> _createMatchingResult(
    Map<String, dynamic> jobSkills,
    int nonZeroSkillMachedCount,
    Map<String, int> detailedMatchingResult,
    Map<String, dynamic> skillItemMatchingScore,
    int sameSkillMatchingScore,
    int totalMatchingScore,
    int totalMatchingScorePercent,
  ) {
    return {
      'company_ID': jobSkills['company_ID'],
      'JD_Number': jobSkills['JD_Number'],
      'detailed_matching_result': detailedMatchingResult,
      'skill_item_matching_score': skillItemMatchingScore,
      'jobCount': skillItemMatchingScore['jobCount'],
      'nonZeroSkillMachedCount': nonZeroSkillMachedCount,
      'nonCommonJobSkillCount':
          skillItemMatchingScore['nonCommonJobSkillCount'],
      'job_skill_points': skillItemMatchingScore['job_skill_points'],
      'same_skill_matching_score': sameSkillMatchingScore,
      'totalMatchingScore': totalMatchingScore,
      'totalMatchingScorePercent': totalMatchingScorePercent,
    };
  }

  /// スキルマッチング評価と合計スコア計算
  Map<String, dynamic> _evaluateAndCalculateScores(
    Map<String, int> individualSkillMap,
    Map<String, int> jobSkillMap,
  ) {
    final matchingResult = evaluateSkillMatching(
      individualSkillMap,
      jobSkillMap,
    );
    final nonZeroSkillMachedCount = _commonService.countNonZeroSkills(
      matchingResult,
    );
    final skillItemMatchingScore = calculateNonMatchingJobSkillItems(
      individualSkillMap,
      jobSkillMap,
    );

    final detailedMatchingResult = matchingResult;
    final sameSkillMatchingScore = calculateTotalMatchingScore(matchingResult);
    final totalMatchingScore =
        sameSkillMatchingScore + (skillItemMatchingScore['job_skill_points'] ?? 0);
    final totalMatchingScorePercent = nonZeroSkillMachedCount > 0
        ? (totalMatchingScore / nonZeroSkillMachedCount).round()
        : 0;

    return {
      'nonZeroSkillMachedCount': nonZeroSkillMachedCount,
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
      final companiesSnapshot = await _firestore.collection('job_description').get();
      for (var companyDoc in companiesSnapshot.docs) {
        final companyId = companyDoc.id;
        final jdSnapshot = await _firestore
            .collection('job_description/$companyId/JD_Number')
            .get();
        for (var jdDoc in jdSnapshot.docs) {
          final data = jdDoc.data();
          if (data.containsKey('スキル経験')) {
            final skillExperience = data['スキル経験'] as Map<String, dynamic>;
            Map<String, int> evaluatedSkills;
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
    for (var jobSkills in jobSkillsList) {
      debugPrint(
        '処理中の求人: ${jobSkills['company_ID']} - ${jobSkills['JD_Number']}',
      );
      final jobSkillMap = Map<String, int>.from(
        jobSkills['スキル経験'] as Map<String, dynamic>,
      );
      final individualSkillMap = Map<String, int>.from(individualSkills);
      final evaluationResults = _evaluateAndCalculateScores(
        individualSkillMap,
        jobSkillMap,
      );
      if (evaluationResults['totalMatchingScore'] >= 0) {
        if (100 < evaluationResults['totalMatchingScorePercent'] &&
            evaluationResults['totalMatchingScorePercent'] <= 120) {
          matchingResults.add(
            _createMatchingResult(
              jobSkills,
              evaluationResults['nonZeroSkillMachedCount'],
              evaluationResults['detailedMatchingResult'],
              evaluationResults['skillItemMatchingScore'],
              evaluationResults['sameSkillMatchingScore'],
              evaluationResults['totalMatchingScore'],
              evaluationResults['totalMatchingScorePercent'],
            ),
          );
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