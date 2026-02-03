/// マッチングの計算ロジックのみを定義するクラス（Pure Dart）
class MatchingLogic {
  /// スキルマッチングの評価を行う
  /// 「アップスキリング」を重視し、ターゲット（求人/目標）がソース（自分）より少し高い場合に高スコア（>100%）を付与する
  /// [isJobMatching] が true の場合、オーバースペック（Source > Target）はマイナス評価となる
  Map<String, int> evaluateSkillMatching(
    Map<String, int> sourceSkills,
    Map<String, int> targetSkills, {
    bool isJobMatching = true,
  }) {
    final result = <String, int>{};
    sourceSkills.forEach((key, sourceValue) {
      if (sourceValue > 0) {
        final targetValue = targetSkills[key] ?? 0;
        if (targetValue > 0) {
          // diff = Target(目標) - Source(自分)
          // 正の値 = 目標の方が高い（アップスキリングのチャンス）
          final diff = targetValue - sourceValue;
          
          if (diff == 0) {
            result[key] = 100; // 完全一致（Safe Match）
          } else if (diff == 1) {
            result[key] = 110; // Targetが1高い（Good Challenge） -> 110%
          } else if (diff == 2) {
            result[key] = 115; // Targetが2高い（Hard Challenge） -> 115% (<120%)
          } else if (diff > 2) {
            result[key] = 0;   // Targetが高すぎる（Too Hard） -> 0%
          } else {
            // diff < 0 (Source > Target) -> オーバースペック
            if (isJobMatching) {
              // 求人マッチングの場合、オーバースペックは「成長につながらない」ため減点（排除対象）
              result[key] = -50; 
            } else {
              // 個人間マッチングの場合、自分が教えられる（メンター）可能性があるため高評価維持
              result[key] = 100;
            }
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
      // マイナス値（ペナルティ）も加算する
      if (value != 0) totalScore += value;
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

  /// 最終的なマッチングスコアを計算し、正規化済みの結果を含むマップを返す
  Map<String, dynamic> calculateMatchResult(
    Map<String, int> userSkills,
    Map<String, int> jdSkills, {
    bool isJobMatching = true,
    List<String> sourceIntent = const [],
    List<String> targetIntent = const [],
  }) {
    // 1. スキルマッチング評価（加点）
    final skillMatchResult = evaluateSkillMatching(
      userSkills,
      jdSkills,
      isJobMatching: isJobMatching,
    );
    final matchPoints = calculateTotalMatchingScore(skillMatchResult);

    // 2. 不足項目の計算（減点）
    final nonMatchItems = calculateNonMatchingJobSkillItems(userSkills, jdSkills);
    final penaltyPoints = nonMatchItems['job_skill_points'] as int? ?? 0;

    // 3. 志向・メンターマッチング評価（ボーナス）
    int intentBonus = 0;
    
    // 3-1. 志向の共通項ボーナス
    // 対個人: スキル同等でも志向が近い人を優遇
    // 対求人: 成長できる（Over-specでない）ことが前提で、その中で志向が合うものを優遇
    final commonIntents = sourceIntent.toSet().intersection(targetIntent.toSet());
    if (commonIntents.isNotEmpty) {
      intentBonus += commonIntents.length * 10; // 1一致につき+10点
    }

    // 3-2. メンター需給マッチング（個人間のみ）
    // Sourceが「教えたい」、Targetが「教わりたい」場合
    // 対求人には適用されない
    if (!isJobMatching) {
      final sourceWantsMentor = sourceIntent.contains('wants_to_be_mentor');
      final targetSeeksMentor = targetIntent.contains('looking_for_mentor');
      
      if (sourceWantsMentor && targetSeeksMentor) {
        // メンター需要が合致する場合、特大ボーナス
        // これにより、スキル差によるペナルティや低いスコアを相殺し、マッチングを成立させる
        intentBonus += 100; 
      }
    }

    // 4. ネットスコア計算
    final netScore = matchPoints + penaltyPoints + intentBonus;

    // 5. 正規化スコア計算
    final matchingScore = normalizeScore(netScore);

    return {
      'matchPoints': matchPoints,
      'penaltyPoints': penaltyPoints,
      'intentBonus': intentBonus,
      'netScore': netScore,
      'matchedSkills': skillMatchResult,
      'nonMatchItems': nonMatchItems,
      'matchingScore': matchingScore,
    };
  }

  /// スコアの正規化を行う
  /// 以前は100点満点でclampしていたが、100%超え（120%など）を許容するように変更
  int normalizeScore(int rawScore) {
    if (rawScore <= 0) return 0;
    // 概算の正規化ロジック（ビジネス要件に応じて調整）
    return (rawScore / 5).round();
  }
}
