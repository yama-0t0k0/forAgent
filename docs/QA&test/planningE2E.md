# E2Eテスト計画・詳細設計: プロフィール編集フロー検証

進捗管理は GitHub Milestone [**E2Eテスト**](https://github.com/yama-0t0k0/engineer-registration-app/milestone/15?closed=1) で行います。

## 1. テスト概要
`individual_user_app` のプロフィール編集画面への遷移と、統合された `PureRegistrationScreen` の内容（タブ構造およびメタデータ主導のUIレンダリング）が正常であることを検証する。

## 2. 要件定義
- [x] フッター右端の「メニュー」ボタンから「プロフィール編集」画面へ遷移できること。
- [x] 「プロフィール編集」画面内に以下の4つのタブが存在し、表示されていること。
    - 基本情報
    - スキル経験
    - 志向
    - 職歴
- [x] 各4つのタブをタップして切り替え可能であり、それぞれのコンテンツが表示されること。
- [x] テスト成功時のみ、エビデンス（動画・スクリーンショット）を `yama/tests/logs` (動画) および `yama/tests/screenshots` (静止画) に保存すること。

## 3. 詳細設計
### テストスタック
- **ツール**: Maestro (E2Eテスティングフレームワーク)
- **環境**: iOS Simulator (iPhone 13 / iOS 18.4)
- **対象アプリ**: `individual_user_app` (Expo 開発サーバー経由)

### 検証ロジック (Maestro YAML)
1. `openLink`: ${EXPO_URL} でアプリを起動。
2. ホーム画面の `testID="user_full_name"` が表示されるまで待機（ロード完了の確認）。
3. `testID="nav_tab_Menu"` をタップ。
4. メニュー一覧から「プロフィール編集」をタップ。
5. タイトル「エンジニア個人登録」の存在を確認。
6. 各タブ（基本情報、スキル経験、志向、職歴）を順次タップし、タブ固有のラベルが表示されることを `assertVisible` で確認。

### エビデンス管理
- **コマンド**: `maestro record --local` を使用して成功時のみ動画を出力。
- **ラッパースクリプト**: `tests/utils/record_success.sh`
    - 失敗時は作成された一時的な動画ファイルを削除し、開発者による「修正→再試行」ループを支援。
    - 成功時は `yama/tests/logs/profile_edit_evidence.mp4` および `yama/tests/screenshots/individual_user_app/profile_edit_evidence_success.png` として保存。

## 4. 実装・実行ステータス
- [x] E2Eテストシナリオ作成 (`tests/profile_edit_verification.yaml`)
- [x] 成功時記録用スクリプト作成 (`tests/utils/record_success.sh`)
- [x] Java/Maestro 環境パスの修正
- [x] ローカル動画出力フラグ (`--local`) の追加
- [x] ホーム画面待機ロジックの改善 (LoadingView待機の追加)
- [x] テスト実行とデバッグ
    - [x] `testID` の不一致修正 (`nav_tab_Menu`)
    - [x] 実行環境の安定化（Simulator/Maestroセッション競合の解消）
- [ ] テストロジックの強化（タブ切り替え検証）
    - [ ] `assertVisible` による各タブ固有コンテンツの表示確認を追加
    - [ ] 座標 (`point`) タップ後の `sleep` 依存を `assertVisible` に置換
- [x] 最終エビデンスの取得
    - [x] `tests/logs/profile_edit_evidence.mp4` の生成確認
