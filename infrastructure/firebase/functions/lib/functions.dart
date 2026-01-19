import 'dart:convert';
import 'package:functions_framework/functions_framework.dart';
import 'package:shelf/shelf.dart';
import 'package:common_logic/common_logic.dart';

@CloudFunction()
Future<Response> calculateMatch(Request request) async {
  try {
    final payload = await request.readAsString();
    final data = jsonDecode(payload) as Map<String, dynamic>;

    final userDoc = data['userDoc'] as Map<String, dynamic>?;
    final jdDoc = data['jdDoc'] as Map<String, dynamic>?;

    if (userDoc == null || jdDoc == null) {
      return Response.badRequest(
        body: jsonEncode({'error': 'userDoc and jdDoc are required'}),
        headers: {'Content-Type': 'application/json'},
      );
    }

    final commonService = CommonService();
    final matchingLogic = MatchingLogic();

    // 1. Evaluate individual skills
    final userSkills = commonService.evaluateSkills(userDoc['スキル経験'] ?? {});
    
    // 2. Evaluate JD skills
    final jdSkills = commonService.evaluateSkills(jdDoc['スキル経験'] ?? {});

    // 3. Perform matching (Positive matches)
    final skillMatchResult = matchingLogic.evaluateSkillMatching(userSkills, jdSkills);
    final matchPoints = matchingLogic.calculateTotalMatchingScore(skillMatchResult);
    
    // 4. Calculate missing items (Penalties)
    final nonMatchItems = matchingLogic.calculateNonMatchingJobSkillItems(userSkills, jdSkills);
    final penaltyPoints = nonMatchItems['job_skill_points'] as int? ?? 0;

    // 5. Calculate net score
    final netScore = matchPoints + penaltyPoints; // penaltyPoints is already negative
    
    return Response.ok(
      jsonEncode({
        'matchPoints': matchPoints,
        'penaltyPoints': penaltyPoints,
        'netScore': netScore,
        'matchedSkills': skillMatchResult,
        'nonMatchItems': nonMatchItems,
        'matchingScore': _normalizeScore(netScore), // 0-100 normalization
      }),
      headers: {'Content-Type': 'application/json'},
    );
  } catch (e) {
    return Response.internalServerError(
      body: jsonEncode({'error': e.toString()}),
      headers: {'Content-Type': 'application/json'},
    );
  }
}

int _normalizeScore(int rawScore) {
  // Rough normalization logic - adjust based on business requirements
  // Points usually range from negative (penalties) to positive (matches)
  if (rawScore <= 0) return 0;
  // Let's say 500 points is 100% for now
  return (rawScore / 5).clamp(0, 100).round();
}
