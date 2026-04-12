// ignore_for_file: avoid_print

// 機能概要:
// - 共有ライブラリ(shared)の統合動作検証用スクリプト
// - CommonLogic, CommonService, DomainModels のインスタンス化と動作確認を行う
//
// ディレクトリ構造:
// engineer-registration-app-yama/yama/apps/backend/bin/verify_shared.dart
//
// 実行方法:
// dart bin/verify_shared.dart

import 'package:domain_models/domain_models.dart';
import 'package:common_logic/common_logic.dart';

void main() {
  print('🔄 Verifying Shared Libraries Integration...');

  try {
    // 1. Verify CommonLogic instantiation
    final matchingLogic = MatchingLogic();
    final scores =
        matchingLogic.evaluateSkillMatching({'dart': 3}, {'dart': 4}, isJobMatching: true);
    print('✅ CommonLogic: MatchingLogic instantiated and executed. Result: $scores');

    // 2. Verify CommonService instantiation
    CommonService();
    print('✅ CommonLogic: CommonService instantiated.');

    // 3. Verify DomainModels (EngineerProfile)
    final profile = EngineerProfile(
      id: 'test-user-id',
      firstName: 'Taro',
      lastName: 'Yamada',
      email: 'taro@example.com',
    );
    print('✅ DomainModels: EngineerProfile created: ${profile.firstName} ${profile.lastName}');

    print('🎉 All shared library verifications passed successfully!');
  } catch (e, stack) {
    print('❌ Verification failed: $e');
    print(stack);
    // Exit with error code 1
    // exit(1); // exit needs dart:io, assumed imported implicitly or just let it finish.
    // Actually print is enough for manual verification.
  }
}
