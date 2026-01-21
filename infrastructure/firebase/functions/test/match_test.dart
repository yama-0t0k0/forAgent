import 'dart:convert';
import 'package:test/test.dart';
import 'package:matching_functions/functions.dart';
import 'package:shelf/shelf.dart';

void main() {
  test('calculateMatch returns a score for valid input', () async {
    final userDoc = {
      'スキル経験': {
        'Java': {'実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる': true}
      }
    };
    final jdDoc = {
      'スキル経験': {
        'Java': {'実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる': true}
      }
    };

    final request = Request(
      'POST',
      Uri.parse('http://localhost:8080/'),
      body: jsonEncode({'userDoc': userDoc, 'jdDoc': jdDoc}),
    );

    final response = await calculateMatch(request);
    expect(response.statusCode, equals(200));

    final body = jsonDecode(await response.readAsString());
    expect(body['matchPoints'], greaterThan(0));
    expect(body['netScore'], equals(body['matchPoints'])); // No penalties in this test
    expect(body['matchingScore'], equals(20)); // 100 / 5 = 20
  });

  test('calculateMatch handles missing skills with penalties', () async {
    final userDoc = {'スキル経験': {}};
    final jdDoc = {
      'スキル経験': {
        'Java': {'実務で数年の経験があり、主要メンバーとして応用的な問題を解決できる': true}
      }
    };

    final request = Request(
      'POST',
      Uri.parse('http://localhost:8080/'),
      body: jsonEncode({'userDoc': userDoc, 'jdDoc': jdDoc}),
    );

    final response = await calculateMatch(request);
    expect(response.statusCode, equals(200));

    final body = jsonDecode(await response.readAsString());
    expect(body['penaltyPoints'], lessThan(0)); // Penalty should apply
    expect(body['netScore'], lessThan(0));
    expect(body['matchingScore'], equals(0));
  });
}
