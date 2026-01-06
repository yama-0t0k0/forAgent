import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:common_logic/common_logic.dart';

/// 求人JDとのマッチングを行うサービス (Firestore依存あり)
class MatchingService extends MatchingLogic {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final _commonService = CommonService();

  /// 全ての求人情報のスキル経験を取得
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
            
            // ポジションなどの複雑なノード処理
            if (skillExperience.containsKey('現職種')) {
              final currentPositionData = skillExperience['現職種'] as Map<String, dynamic>;
              final currentPositionResult = _commonService.evaluateCurrentPositionSkills(currentPositionData);
              final otherSkillData = Map<String, dynamic>.from(skillExperience);
              otherSkillData.remove('現職種');
              final otherSkillResult = _commonService.evaluateSkills(otherSkillData);
              evaluatedSkills = Map<String, int>.from(otherSkillResult);
              evaluatedSkills.addAll(currentPositionResult);
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
}
