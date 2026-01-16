// 機能概要:
// - Job Description用のJD JSONデータの品質検証用テスト
// - B00003系JD JSONの「スキル経験」定義を自動で検査
// - 不明なスキルのブール値が「経験なし」=trueになっているかを確認
// - Javaを含む主要言語に期待される経験レベルが設定されているかを検証
//
// ディレクトリ構造:
// ├── apps/
// │   └── job_description/
// │       └── dart_backend/
// │           ├── lib/  (バックエンドロジック想定)
// │           └── test/
// │               ├── basic_test.dart
// │               └── jd_skill_experience_test.dart  (本ファイル)
// └── reference_information_fordev/
//     └── json/
//         └── jd/
//             └── B00003/
//                 ├── B00003_01.json 〜 B00003_14.json (Safie向けJD定義)
//
// デプロイ・実行方法:
// - 前提条件:
//   - Dart SDK がインストールされていること
// - テスト実行コマンド:
//   - cd engineer-registration-app-yama/apps/job_description/dart_backend
//   - dart test
// - 本テストはローカル開発時の品質チェック目的であり、
//   デプロイや本番環境には直接関与しない

import 'dart:convert';
import 'dart:io';

import 'package:test/test.dart';

void main() {
  group('B00003_01.json スキル経験定義', () {
    test('不明なスキルは経験なし=trueになっている', () async {
      final file = File(
        '../../../reference_information_fordev/json/jd/B00003/B00003_01.json',
      );

      expect(await file.exists(), isTrue);

      final content = await file.readAsString();
      final data = json.decode(content) as Map<String, dynamic>;

      final skills = data['スキル経験'] as Map<String, dynamic>;

      void checkSkillMap(Map<String, dynamic> map) {
        for (final entry in map.entries) {
          final value = entry.value;
          if (value is Map<String, dynamic>) {
            final hasExperienceKeys = value.containsKey('経験なし') &&
                value.containsKey('実務で基礎的なタスクを遂行可能');

            if (hasExperienceKeys) {
              final hasSomeExperience = value.entries
                  .where((e) => e.key != '経験なし')
                  .where((e) => e.value is bool)
                  .any((e) => e.value == true);

              if (!hasSomeExperience) {
                expect(
                  value['経験なし'],
                  isTrue,
                  reason:
                      'スキル「${entry.key}」は経験レベルが不明のため「経験なし」をtrueにする必要があります。',
                );
              }
            } else {
              checkSkillMap(value);
            }
          }
        }
      }

      checkSkillMap(skills);
    });

    test('言語: Java には何らかの経験レベルが設定されている', () async {
      final file = File(
        '../../../reference_information_fordev/json/jd/B00003/B00003_01.json',
      );

      expect(await file.exists(), isTrue);

      final content = await file.readAsString();
      final data = json.decode(content) as Map<String, dynamic>;

      final skills = data['スキル経験'] as Map<String, dynamic>;
      final languages = skills['言語'] as Map<String, dynamic>;
      final javaSkill = languages['Java'] as Map<String, dynamic>;

      final experienceFlags = javaSkill.entries
          .where((e) => e.key != '経験なし')
          .where((e) => e.value is bool)
          .map((e) => e.value as bool)
          .toList();

      final hasAnyExperience = experienceFlags.any((v) => v);

      expect(
        hasAnyExperience,
        isTrue,
        reason: 'Java は求人の利用技術に含まれるため、'
            'いずれかの経験レベルをtrueにする必要があります。',
      );
    });
  });

  group('B00003系 JD 定義の整合性', () {
    test('B00003_01〜B00003_14 が存在し company_ID/JD_Number が一致している', () async {
      final dir = Directory(
        '../../../reference_information_fordev/json/jd/B00003',
      );

      expect(await dir.exists(), isTrue);

      final files = dir
          .listSync()
          .whereType<File>()
          .where((f) => f.path.endsWith('.json'))
          .toList()
        ..sort((a, b) => a.path.compareTo(b.path));

      expect(files.length, 14);

      for (final file in files) {
        final fileName = file.uri.pathSegments.last;
        final match = RegExp(r'^B00003_(\d{2})\.json$').firstMatch(fileName);
        expect(match, isNotNull, reason: 'ファイル名が想定フォーマットと異なります: $fileName');

        final jdNumberFromName = match!.group(1);

        final content = await file.readAsString();
        final data = json.decode(content) as Map<String, dynamic>;

        expect(data['company_ID'], 'B00003',
            reason: '$fileName の company_ID は B00003 である必要があります');
        expect(data['JD_Number'], jdNumberFromName,
            reason: '$fileName の JD_Number は ファイル名の末尾と一致する必要があります');
      }
    });
  });
}
