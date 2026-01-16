/// マッチングの計算ロジックのみを定義するクラス（Pure Dart）
class MatchingLogic {
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

  /// スキル値に基づいてポイントを計算（求人側の不足分の減算ポイント）
  int calculateSkillValuePoint(int skillValue) {
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

  /// 個人に無いJDスキル項目の各種指標を計算
  Map<String, dynamic> calculateNonMatchingJobSkillItems(
    Map<String, int> individualSkills,
    Map<String, int> jobSkills,
  ) {
    final individualSkillItems = individualSkills.entries
        .where((entry) => entry.value > 0)
        .map((e) => e.key)
        .toSet();
    final jobSkillItems = jobSkills.entries
        .where((entry) => entry.value > 0)
        .map((e) => e.key)
        .toSet();

    final jobCount = jobSkillItems.length;
    final nonCommonJobSkill = Map<String, int>.fromEntries(
      jobSkillItems
          .difference(individualSkillItems)
          .map((skill) => MapEntry(skill, jobSkills[skill] ?? 0)),
    );
    final nonCommonJobSkillCount = jobSkillItems
        .difference(individualSkillItems)
        .length;

    int jobSkillPoints = 0;
    nonCommonJobSkill.forEach((_, value) {
      if (value > 0) {
        jobSkillPoints -= calculateSkillValuePoint(value);
      }
    });

    return {
      'jobCount': jobCount,
      'nonCommonJobSkillCount': nonCommonJobSkillCount,
      'job_skill_points': jobSkillPoints,
    };
  }
}
