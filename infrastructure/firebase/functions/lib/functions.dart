import 'dart:convert';
import 'package:functions_framework/functions_framework.dart';
import 'package:shelf/shelf.dart';
import 'package:common_logic/common_logic.dart';
import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';

@CloudFunction()
Future<Response> calculateMatch(Request request) async {
  // 0. Auth Check
  final authHeader = request.headers['Authorization'];
  if (authHeader == null || !authHeader.startsWith('Bearer ')) {
    return Response.forbidden(
      jsonEncode({'error': 'Authorization header is required'}),
      headers: {'Content-Type': 'application/json'},
    );
  }

  final token = authHeader.substring(7);
  try {
    // Decode the token to check expiration (Signature verification requires fetching public keys)
    final jwt = JWT.decode(token);
    
    // Check expiration if 'exp' claim exists
    if (jwt.payload is Map<String, dynamic>) {
      final payload = jwt.payload as Map<String, dynamic>;
      if (payload.containsKey('exp')) {
        final exp = payload['exp'];
        if (exp is int) {
          final expirationDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
          if (DateTime.now().isAfter(expirationDate)) {
            return Response.forbidden(
              jsonEncode({'error': 'Token expired'}),
              headers: {'Content-Type': 'application/json'},
            );
          }
        }
      }
    }
  } catch (e) {
    return Response.forbidden(
      jsonEncode({'error': 'Invalid token'}),
      headers: {'Content-Type': 'application/json'},
    );
  }

  try {
    final payload = await request.readAsString();
    final data = jsonDecode(payload) as Map<String, dynamic>;
    
    final commonService = CommonService();
    final matchingLogic = MatchingLogic();

    // --- Batch Mode ---
    if (data.containsKey('candidates') && data['candidates'] is List) {
      final targetDoc = data['targetDoc'] as Map<String, dynamic>;
      final candidates = (data['candidates'] as List).cast<Map<String, dynamic>>();
      // targetType determines if targetDoc is a User ('user') or a JD ('jd')
      // If 'user', we are ranking JDs (candidates) for this User.
      // If 'jd', we are ranking Users (candidates) for this JD.
      final targetType = data['targetType'] as String? ?? 'user';
      final candidateType = data['candidateType'] as String?;

      final results = <Map<String, dynamic>>[];

      for (final candidate in candidates) {
        Map<String, dynamic> userDoc;
        Map<String, dynamic> jdDoc;

        // Determine if this is a Job Matching (User vs JD) or User Matching (User vs User)
        // Default to true (strict penalty for over-spec) unless explicit User-User context found
        bool isJobMatching = true;

        if (targetType == 'user') {
          // Case 1: User looking for Candidates
          userDoc = targetDoc;
          jdDoc = candidate;
          
          // Check if candidate is actually another User (User-User matching)
          if (candidateType == 'user' || candidate.containsKey('userId') || candidate.containsKey('displayName')) {
             // If candidate looks like a User, treat as User Matching
             // Note: JDs usually have 'jobId', 'title', 'companyId'
             if (!candidate.containsKey('jobId') && !candidate.containsKey('title')) {
                isJobMatching = false;
             }
          }
        } else {
          // Case 2: JD looking for Candidates (Users)
          // This is always Job Matching (from JD perspective)
          userDoc = candidate;
          jdDoc = targetDoc;
        }

        try {
          final scoreData = _calculateScore(userDoc, jdDoc, commonService, matchingLogic, isJobMatching: isJobMatching);
          
          // Merge score data into candidate data
          final merged = Map<String, dynamic>.from(candidate)..addAll(scoreData);
          results.add(merged);
        } catch (e) {
          print('Error processing candidate ID ${candidate['id']}: $e');
          // Add with zero score on error
          results.add({
             ...candidate,
             'matchingScore': 0,
             'netScore': 0,
             'error': e.toString()
          });
        }
      }

      // Sort descending by matchingScore
      results.sort((a, b) {
        final scoreA = (a['matchingScore'] as num?) ?? 0;
        final scoreB = (b['matchingScore'] as num?) ?? 0;
        return scoreB.compareTo(scoreA);
      });

      return Response.ok(
        jsonEncode(results),
        headers: {'Content-Type': 'application/json'},
      );
    }

    // --- Single Mode (Legacy) ---
    final userDoc = data['userDoc'] as Map<String, dynamic>?;
    final jdDoc = data['jdDoc'] as Map<String, dynamic>?;

    if (userDoc == null || jdDoc == null) {
      return Response.badRequest(
        body: jsonEncode({'error': 'userDoc and jdDoc are required'}),
        headers: {'Content-Type': 'application/json'},
      );
    }

    final result = _calculateScore(userDoc, jdDoc, commonService, matchingLogic);
    
    return Response.ok(
      jsonEncode(result),
      headers: {'Content-Type': 'application/json'},
    );

  } catch (e) {
    return Response.internalServerError(
      body: jsonEncode({'error': e.toString()}),
      headers: {'Content-Type': 'application/json'},
    );
  }
}

Map<String, dynamic> _calculateScore(
    Map<String, dynamic> userDoc,
    Map<String, dynamic> jdDoc,
    CommonService commonService,
    MatchingLogic matchingLogic,
    {bool isJobMatching = true}) {
  
  // 1. Evaluate individual skills
  final userSkills = commonService.evaluateSkills(userDoc['スキル経験'] ?? {});
  
  // 2. Evaluate JD skills
  final jdSkills = commonService.evaluateSkills(jdDoc['スキル経験'] ?? {});

  // 3. Delegate calculation to shared MatchingLogic
  // Extract intents/tags if available (assuming 'tags' list in doc)
  final sourceIntent = (userDoc['tags'] as List?)?.map((e) => e.toString()).toList() ?? [];
  final targetIntent = (jdDoc['tags'] as List?)?.map((e) => e.toString()).toList() ?? [];

  return matchingLogic.calculateMatchResult(
    userSkills, 
    jdSkills, 
    isJobMatching: isJobMatching,
    sourceIntent: sourceIntent,
    targetIntent: targetIntent,
  );
}
