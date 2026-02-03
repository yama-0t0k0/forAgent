/// 機能概要:
/// - バックエンド機能（Firestore連携など）のエントリーポイント
/// - 共通ロジック（common_logic）の再エクスポート
/// - 各種データサービス（MatchingServiceなど）の提供
///
/// 主要機能:
/// - MatchingService: 求人とエンジニアのマッチング計算（Firestoreデータ使用）
/// - common_logicのエクスポート: 純粋な計算ロジックへのアクセス提供
///
/// ディレクトリ構造:
/// ├── lib/
/// │   ├── common_backend.dart (本ファイル: エントリーポイント)
/// │   └── src/
/// │       └── services/
/// │           └── matching_service.dart (マッチングサービス実装)
///
/// 依存関係:
/// - common_logic: 共通計算ロジック
/// - cloud_firestore: データストア
/// - flutter: UIフレームワーク（debugPrint等で使用）
library;

export 'package:common_logic/common_logic.dart';
export 'src/services/matching_service.dart';
