/// 機能概要:
/// - Flutter/Firebaseに依存しない純粋なDartロジックのエントリーポイント
/// - スキル評価、興味評価、マッチング計算などのコアロジックを提供
/// - サーバーサイド（Dart）とクライアントサイド（Flutter）の両方で利用可能
///
/// 主要機能:
/// - CommonService: スキル・興味データの構造解析とスコア化（再帰的処理）
/// - MatchingLogic: スキルマッチングの数値計算（差分評価、合計スコア算出）
///
/// ディレクトリ構造:
/// ├── lib/
/// │   ├── common_logic.dart (本ファイル: エントリーポイント)
/// │   └── src/
/// │       └── services/
/// │           ├── common_service.dart (データ構造解析・評価)
/// │           └── matching_logic.dart (マッチング計算ロジック)
///
/// 依存関係:
/// - なし（Pure Dart）
library;

export 'src/services/common_service.dart';
export 'src/services/matching_logic.dart';
