/// 機能概要:
/// - アプリケーション全体で共有されるドメインモデルのエントリーポイント
/// - エンジニアプロフィール、マッチング結果などのコアデータ構造を定義
/// - プレゼンテーション層（UI）とドメイン層（ロジック）間のデータ受け渡しに使用
///
/// 主要機能:
/// - EngineerProfile: エンジニアの基本情報モデル（JSONシリアライズ対応）
/// - MatchResult: ヒートマップやマッチング率を含む計算結果モデル
///
/// ディレクトリ構造:
/// ├── lib/
/// │   ├── domain_models.dart (本ファイル: エントリーポイント)
/// │   └── src/
/// │       ├── engineer_profile.dart (エンジニアプロフィール定義)
/// │       └── matching_models.dart (マッチング結果モデル定義)
///
/// 依存関係:
/// - equatable: 値等価性の比較
/// - json_annotation: JSONシリアライズ（EngineerProfileで使用）
export 'src/engineer_profile.dart';
export 'src/matching_models.dart';
