// 役割:
// - マッチングロジック（MatchingLogic）のユニットテスト
//
// 主要機能:
// - ジョブマッチングにおけるオーバースペックペナルティの検証
// - ユーザー間マッチングにおけるボーナス付与の検証
//
// ディレクトリ構造:
// infrastructure/firebase/functions/test/match_test.dart
//

import 'package:test/test.dart';
import 'package:common_logic/common_logic.dart';

void main() {
  final logic = MatchingLogic();

  group('MatchingLogic', () {
    test('Job Match: Over-spec should be penalized', () {
      // Source: 5, Target: 3 (Diff -2)
      final userSkills = {'Dart': 5};
      final jdSkills = {'Dart': 3};
      
      final result = logic.calculateMatchResult(userSkills, jdSkills, isJobMatching: true);
      
      // Over-spec penalty is -50
      expect(result['matchedSkills']['Dart'], -50);
      expect(result['netScore'], -50);
    });

    test('User Match: Over-spec should NOT be penalized', () {
      // Source: 5, Target: 3 (Diff -2)
      final sourceSkills = {'Dart': 5};
      final targetSkills = {'Dart': 3};
      
      final result = logic.calculateMatchResult(sourceSkills, targetSkills, isJobMatching: false);
      
      expect(result['matchedSkills']['Dart'], 100);
      expect(result['netScore'], 100);
    });

    test('Job Match: Target > Source (Upskilling) should be rewarded', () {
      // Source: 3, Target: 4 (Diff +1) -> 110
      // Source: 3, Target: 5 (Diff +2) -> 120 (was 115 in old logic)
      
      final userSkills = {'Dart': 3, 'Flutter': 3};
      final jdSkills = {'Dart': 4, 'Flutter': 5};
      
      final result = logic.calculateMatchResult(userSkills, jdSkills, isJobMatching: true);
      
      expect(result['matchedSkills']['Dart'], 110);
      expect(result['matchedSkills']['Flutter'], 120);
    });

    test('Job Match: Over-spec JD should be penalized/excluded even with Intent Match', () {
      // Source: 5, Target: 3 (Diff -2) -> -50 penalty
      // Intent Match: 3 tags -> +30 bonus
      // Net: -20 (Still penalized/low score)
      
      final userSkills = {'Dart': 5};
      final jdSkills = {'Dart': 3};
      final sourceIntent = ['remote', 'startup', 'agile'];
      final targetIntent = ['remote', 'startup', 'agile'];
      
      final result = logic.calculateMatchResult(
        userSkills, 
        jdSkills, 
        isJobMatching: true,
        sourceIntent: sourceIntent,
        targetIntent: targetIntent,
      );
      
      expect(result['matchedSkills']['Dart'], -50);
      expect(result['intentBonus'], 30);
      expect(result['netScore'], -20);
    });

    test('Job Match: Upskilling JD should be boosted by Intent Match', () {
      // Source: 3, Target: 4 (Diff +1) -> 110
      // Intent Match: 2 tags -> +20 bonus
      // Net: 130
      
      final userSkills = {'Dart': 3};
      final jdSkills = {'Dart': 4};
      final sourceIntent = ['remote', 'startup'];
      final targetIntent = ['remote', 'startup'];
      
      final result = logic.calculateMatchResult(
        userSkills, 
        jdSkills, 
        isJobMatching: true,
        sourceIntent: sourceIntent,
        targetIntent: targetIntent,
      );
      
      expect(result['matchedSkills']['Dart'], 110);
      expect(result['intentBonus'], 20);
      expect(result['netScore'], 130);
    });

    test('User Match: Intent match should get bonus', () {
      final userSkills = {'Dart': 3};
      final targetSkills = {'Dart': 3};
      final sourceIntent = ['freelance', 'remote'];
      final targetIntent = ['freelance', 'startup']; // 'freelance' matches
      
      final result = logic.calculateMatchResult(
        userSkills, 
        targetSkills, 
        isJobMatching: false,
        sourceIntent: sourceIntent,
        targetIntent: targetIntent,
      );
      
      // Skill match: 100
      // Intent bonus: 10 (1 match)
      // Net: 110
      expect(result['intentBonus'], 10);
      expect(result['netScore'], 110);
    });

    test('User Match: Mentor matching should get huge bonus', () {
      final userSkills = {'Dart': 5}; // Expert
      final targetSkills = {'Dart': 1}; // Beginner
      // Usually Over-spec (Diff -4) -> 100 (User-User base)
      
      final sourceIntent = ['wants_to_be_mentor'];
      final targetIntent = ['looking_for_mentor'];
      
      final result = logic.calculateMatchResult(
        userSkills, 
        targetSkills, 
        isJobMatching: false,
        sourceIntent: sourceIntent,
        targetIntent: targetIntent,
      );
      
      // Skill match: 100 (User-User base for over-spec)
      // Mentor bonus: 100
      // Net: 200
      expect(result['intentBonus'], 100);
      expect(result['netScore'], 200);
      // Normalized score: 200 / 1 (matched skill count) = 200
      expect(result['matchingScore'], 200);
    });
  });
}
