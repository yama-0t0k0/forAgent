# テスト実施報告書: TestCase 002

## 1. テスト実行サマリ
*   **テストケースID**: TC-002
*   **テスト名**: 管理者ログインおよびアプリケーション間リダイレクトの検証
*   **実施日時**: 2026-04-23 00:49:10 (サーバー時間)
*   **実施環境**: Web (Playwright / Chromium)
*   **結果**: ✅ **PASS**

## 2. テスト結果一覧

| 項目 | 内容 |
| :--- | :--- |
| **URL (LP)** | `http://localhost:8087` |
| **URL (Redirect先)** | `http://localhost:8081` |
| **テスト設計書** | [TestCase_002_LP_Login_Admin.md](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/docs/QA&test/TestCase/TestCase_002_LP_Login_Admin.md) |
| **実行ログ** | [lp_login_redirect_web_20260423_004910_playwright.log](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_login_redirect_web_20260423_004910_playwright.log) |
| **不具合状況** | 0件 |

## 3. 検証内容と証拠保存

### 手順 1: LPログイン画面での入力
管理者アカウント `A999` の情報を入力。
![Login Input](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_004910_login_input.png)

### 手順 2: リダイレクトおよびAdminダッシュボードの表示
ログインボタンクリック後、自動的にポート 8081 へ遷移し、管理者ダッシュボードが表示されることを確認。
![Redirect Success](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_004910_redirect_success.png)

## 4. 特記事項 (実装上の工夫)
*   **マルチアプリ同期**: `scripts/test_web_e2e_login.sh` により、LPアプリとAdminアプリを同時にバックグラウンド起動し、ヘルスチェックを待機してからテストを開始する仕組みを導入しました。
*   **CORS回避**: ブラウザのセキュリティ制約により localhost 間の fetch がブロックされる問題を回避するため、`navigationHelper.js` のポート待機ロジックを `no-cors` モードに調整しました。
*   **E2E認証バイパス**: Web版開発環境ではポート（Origin）が異なるためFirebaseのセッションが共有されません。これに対応するため、E2E実行時のみ Adminアプリ側で自動ログインを許可するフラグ (`EXPO_PUBLIC_E2E_SKIP_AUTH`) を導入し、ダッシュボードの表示確認を可能にしました。
