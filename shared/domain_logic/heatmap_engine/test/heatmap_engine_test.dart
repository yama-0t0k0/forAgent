import 'package:test/test.dart';
import 'package:heatmap_engine/src/heatmap_engine.dart';
import 'package:heatmap_engine/src/heatmap_mapper.dart';

void main() {
  group('HeatmapEngine Tests', () {
    final engine = HeatmapEngine();

    test('calculate should return valid MatchResult for simple data', () {
      final individualJson = {
        'スキル経験': {
          '言語': {
            'Python': {
              '実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる': true
            },
            'Java': {
              '実務で基礎的なタスクを遂行可能': true
            }
          }
        },
        '志向': {
          '今後の希望': {
            '要件定義': {
              '実務で基礎的なタスクを遂行可能': true
            }
          }
        }
      };

      final jdJson = {
        'スキル経験': {
          '言語': {
            'Python': {
              '専門的な知識やスキルを有し他者を育成/指導できる': true
            }
          }
        },
        '志向': {
          '今後の希望': {
            '要件定義': {
              '専門的な知識やスキルを有し他者を育成/指導できる': true
            }
          }
        }
      };

      final result = engine.calculate(individualJson, jdJson);

      // Python (Index 9): Ind=3(0.75), JD=4(1.0)
      expect(result.individualSkillHeatmap[9], 0.75);
      expect(result.jdSkillHeatmap[9], 1.0);

      // Java (Index 10): Ind=2(0.5), JD=0(0.0)
      expect(result.individualSkillHeatmap[10], 0.5);
      expect(result.jdSkillHeatmap[10], 0.0);

      // Aspiration: 要件定義 (Index 58 in mapper)
      expect(result.individualAspirationHeatmap[58], 0.5);
      expect(result.jdAspirationHeatmap[58], 1.0);
    });

    test('HeatmapMapper should return correct indices', () {
      expect(HeatmapMapper.getIndex('Python'), 9);
      expect(HeatmapMapper.getIndex('TypeScript'), 13);
      expect(HeatmapMapper.getIndex('サーバサイドエンジニア', isAspiration: true), 45);
    });
  });
}
