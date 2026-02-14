// 役割:
// - Individual User App Backendの基本テスト
//
// 主要機能:
// - 環境セットアップの確認
//
// ディレクトリ構造:
// apps/individual_user_app/dart_backend/test/basic_test.dart
//

import 'package:domain_models/domain_models.dart';
import 'package:test/test.dart';

void main() {
  group('Individual User App Backend Tests', () {
    test('Environment setup check', () {
      expect(true, isTrue);
    });

    test('Can import and use domain models', () {
      const profile = EngineerProfile(
        id: 'test-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      );
      
      expect(profile.email, equals('test@example.com'));
    });
  });
}
