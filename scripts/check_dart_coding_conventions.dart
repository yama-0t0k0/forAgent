// ignore_for_file: avoid_print

// 機能概要:
// - Dartコードのコーディング規約違反を簡易チェックするスクリプト
// - CodingConventions_Dart.md に基づく禁止事項（print, dynamic等）を検出
// - ファイル冒頭のコメントヘッダーの有無を確認（Warning）
//
// ディレクトリ構造:
// engineer-registration-app-yama/yama/scripts/check_dart_coding_conventions.dart
//
// 実行方法:
// dart scripts/check_dart_coding_conventions.dart <target_directory>

import 'dart:io';

const int _headerScanLineLimit = 5;

void main(List<String> args) {
  if (args.isEmpty) {
    print('Usage: dart check_dart_coding_conventions.dart <directory_path>');
    exit(1);
  }

  final dirPath = args[0];
  final dir = Directory(dirPath);

  if (!dir.existsSync()) {
    print('Directory not found: $dirPath');
    exit(1);
  }

  int errorCount = 0;
  int warningCount = 0;

  print('🔍 Checking Dart coding conventions in: $dirPath');

  for (final entity in dir.listSync(recursive: true)) {
    if (entity is File && entity.path.endsWith('.dart')) {
      if (_shouldIgnore(entity.path)) continue;

      final lines = entity.readAsLinesSync();

      bool ignorePrint = false;

      // Check for file-level ignores
      for (final line in lines) {
        if (line.contains('ignore_for_file:')) {
          if (line.contains('avoid_print')) ignorePrint = true;
          // Add other ignores if needed
        }
      }

      // Check 0: File Header (Simple check for comments at top)
      // 必須ではないが推奨されるため Warning レベル
      if (lines.isNotEmpty) {
        bool hasHeader = false;
        // 最初の数行を確認
        for (int i = 0; i < (lines.length > _headerScanLineLimit ? _headerScanLineLimit : lines.length); i++) {
          final trimmed = lines[i].trim();
          if (trimmed.startsWith('//') ||
              trimmed.startsWith('///') ||
              trimmed.startsWith('library')) {
            hasHeader = true;
            break;
          }
        }
        if (!hasHeader) {
          print('⚠️  [Warning] Missing file header comment: ${entity.path}');
          warningCount++;
        }
      }

      for (int i = 0; i < lines.length; i++) {
        final line = lines[i];
        final trimmed = line.trim();

        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

        // Check 1: print() usage
        // debugPrint, logger は許可。print( は禁止。
        if (!ignorePrint && line.contains('print(') && !line.contains('debugPrint') && !trimmed.startsWith('//')) {
          print('❌ [Error] Avoid using print() at ${entity.path}:${i + 1}. Use logger or debugPrint.');
          errorCount++;
        }

        // Check 2: dynamic usage
        // Map<String, dynamic> はよく使うので許容するが、単体の 'dynamic ' は警告
        // jsonDecodeなどの戻り値もdynamicなので、厳密すぎると辛い。
        // ここでは "dynamic variable" のような宣言を簡易検知する
        if (line.contains('dynamic ') &&
            !line.contains('Map<String, dynamic>') &&
            !line.contains('List<dynamic>') &&
            !trimmed.startsWith('//')) {
          print('⚠️  [Warning] Avoid using dynamic at ${entity.path}:${i + 1}. Use strict types if possible.');
          warningCount++;
        }
      }
    }
  }

  print('--------------------------------------------------');
  if (errorCount > 0) {
    print('❌ Found $errorCount coding convention violations.');
    print('⚠️  Found $warningCount warnings.');
    exit(1);
  } else {
    print('✅ No critical coding convention violations found.');
    if (warningCount > 0) {
      print('⚠️  ($warningCount warnings found)');
    }
  }
}

bool _shouldIgnore(String path) {
  return path.contains('.g.dart') || 
         path.contains('.freezed.dart') || 
         path.contains('/generated/') ||
         path.contains('/build/') ||
         path.contains('.dart_tool') ||
         path.contains('check_dart_coding_conventions.dart'); // 自分自身は除外
}
