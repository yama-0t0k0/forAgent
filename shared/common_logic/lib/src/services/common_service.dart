class CommonService {
  /// スキル経験の評価を行う関数
  Map<String, int> evaluateSkills(Map<String, dynamic> skillExperience) {
    final result = <String, int>{};

    void traverse(Map<String, dynamic> data, String currentPath) {
      data.forEach((key, value) {
        if (value is Map<String, dynamic>) {
          final newPath = currentPath.isEmpty ? key : '$currentPath.$key';
          // スキル評価の5項目をチェック
          if (_isSkillEvaluationNode(value)) {
            final score = _calculateSkillScore(value);
            result[newPath] = score;
          } else {
            // 子ノードがスキル評価ノードを持つかチェック
            bool hasSkillNode = false;
            value.forEach((k, v) {
              if (v is Map<String, dynamic> && _isSkillEvaluationNode(v)) {
                hasSkillNode = true;
              }
            });

            if (!hasSkillNode) {
              traverse(value, newPath);
            } else {
              // 子ノードを個別に処理
              value.forEach((k, v) {
                if (v is Map<String, dynamic> && _isSkillEvaluationNode(v)) {
                  final score = _calculateSkillScore(v);
                  result['$newPath.$k'] = score;
                }
              });
            }
          }
        }
      });
    }

    traverse(skillExperience, '');
    return result;
  }

  /// 興味の評価を行う関数
  Map<String, int> evaluateInterests(Map<String, dynamic> interests) {
    final result = <String, int>{};

    void traverse(Map<String, dynamic> data, String currentPath) {
      data.forEach((key, value) {
        if (value is Map<String, dynamic>) {
          // 興味評価の5項目をチェック
          if (_isInterestNode(value)) {
            final score = _calculateInterestScore(value);
            if (score > 0) {
              // スコアが0より大きい場合のみ追加
              result[key] = score; // キーをそのまま使用
            }
          } else if (key != '補足/今後どうなりたいか/想い(当社管理用)') {
            // 補足情報は除外
            // 再帰的に探索
            traverse(value, key); // 現在のキーをパスとして使用
          }
        }
      });
    }

    traverse(interests, '');
    return result;
  }

  /// スキル評価のノードかどうかを判定
  bool _isSkillEvaluationNode(Map<String, dynamic> node) {
    final requiredKeys = {
      '実務で基礎的なタスクを遂行可能',
      '実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる',
      '実務経験は無いが個人活動で経験あり',
      '専門的な知識やスキルを有し他者を育成/指導できる',
      '経験なし',
    };

    return node.keys.every((key) => requiredKeys.contains(key));
  }

  /// 興味のノードかどうかを判定
  bool _isInterestNode(Map<String, dynamic> node) {
    final requiredKeys = {'あまり興味なし', 'とてもやりたい', 'どちらでもない', 'やりたい', '興味なし'};
    return node.keys.every((key) => requiredKeys.contains(key));
  }

  /// スコアマップを90マスのグリッド配列に変換
  int _calculateSkillScore(Map<String, dynamic> node) {
    if (node['専門的な知識やスキルを有し他者を育成/指導できる'] == true) return 4;
    if (node['実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる'] == true) return 3;
    if (node['実務で基礎的なタスクを遂行可能'] == true) return 2;
    if (node['実務経験は無いが個人活動で経験あり'] == true) return 1;
    if (node['経験なし'] == true) return 0;
    return 0; // デフォルト値
  }

  /// 興味のスコアを計算
  int _calculateInterestScore(Map<String, dynamic> node) {
    if (node['とてもやりたい'] == true) return 4;
    if (node['やりたい'] == true) return 3;
    if (node['どちらでもない'] == true) return 2;
    if (node['あまり興味なし'] == true) return 1;
    if (node['興味なし'] == true) return 0;
    return 0; // デフォルト値
  }

  /// 0以外の値を持つ属性の数を取得
  int countNonZeroSkills(Map<String, dynamic> skillExperience) {
    int count = 0;
    skillExperience.forEach((key, value) {
      if (value is int && value > 0) {
        count++;
      }
    });
    return count;
  }

  /// 現職種のスキル評価を行う関数（core_skill、sub1、sub2構造用）
  Map<String, int> evaluateCurrentPositionSkills(
    Map<String, dynamic> skillExperience,
  ) {
    final result = <String, int>{};

    void traverse(Map<String, dynamic> data, String currentPath) {
      data.forEach((key, value) {
        if (value is Map<String, dynamic>) {
          // 現職種のスキル評価ノードかどうかをチェック
          if (_isCurrentPositionSkillNode(value)) {
            final score = _calculateCurrentPositionSkillScore(value);
            if (score > 0) {
              result[currentPath] = score;
            }
          } else {
            // 再帰的に探索
            final newPath = currentPath.isEmpty ? key : '$currentPath.$key';
            traverse(value, newPath);
          }
        }
      });
    }

    traverse(skillExperience, '');
    return result;
  }

  /// 現職種のスキル評価ノードかどうかを判定
  bool _isCurrentPositionSkillNode(Map<String, dynamic> node) {
    final requiredKeys = {'core_skill', 'sub1', 'sub2'};
    return node.keys.every((key) => requiredKeys.contains(key));
  }

  /// 現職種のスキルのスコアを計算
  int _calculateCurrentPositionSkillScore(Map<String, dynamic> node) {
    int score = 0;
    if (node['core_skill'] == true) score += 3;
    if (node['sub1'] == true) score += 2;
    if (node['sub2'] == true) score += 1;
    return score;
  }
}
