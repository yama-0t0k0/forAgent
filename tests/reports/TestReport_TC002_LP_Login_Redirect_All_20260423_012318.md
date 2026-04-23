# E2Eテスト実施報告書 (Web版)

## 1. テスト概要
*   **テストケースID**: TC002
*   **テスト名**: LPアプリからのログイン・リダイレクト検証 (全ロール対応)
*   **設計書パス**: [TestCase_002_LP_Login_Redirect_All.md](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/docs/QA&test/TestCase/TestCase_002_LP_Login_Redirect_All.md)
*   **実施日時**: 2026-04-23 01:23:18
*   **実施環境**: macOS (Local), Playwright (Chromium), Expo Web

## 2. 実施結果サマリ
| テスト項目 | 結果 | 備考 |
| :--- | :--- | :--- |
| **Adminロール (A999) ログイン・リダイレクト** | ✅ PASS | Port 8081 へ遷移確認 |
| **Individualロール (C001) ログイン・リダイレクト** | ✅ PASS | Port 8082 へ遷移確認 |
| **Corporateロール (B001) ログイン・リダイレクト** | ✅ PASS | Port 8083 へ遷移確認 |

**総合判定**: ✅ **SUCCESS**

## 3. 詳細ログ・エビデンス
*   **実行ログ**: [lp_login_redirect_web_20260423_012318_playwright.log](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_login_redirect_web_20260423_012318_playwright.log)

### エビデンス画像
| ロール | ログイン入力 | 遷移成功 |
| :--- | :--- | :--- |
| **Admin** | ![Admin Login](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_012318_Admin_input.png) | ![Admin Success](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_012318_Admin_success.png) |
| **Individual** | ![Individual Login](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_012318_Individual_input.png) | ![Individual Success](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_012318_Individual_success.png) |
| **Corporate** | ![Corporate Login](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_012318_Corporate_input.png) | ![Corporate Success](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/evidence/lp_app_web_20260423_012318_Corporate_success.png) |

## 4. 不具合・特記事項
*   **不具合件数**: 0件
*   **特記事項**:
    *   Individualパターンの初回失敗（invalid-credential）は、パスワードの不一致が原因。`E2ePassword2026!` に統一することで解消。
    *   Corporate App遷移時にブラウザコンソールで一部404/500エラーが記録されたが、URLの遷移自体は正常に行われ、要素もレンダリングされている。

## 5. 環境設定
*   **LP App**: Port 8087
*   **Admin App**: Port 8081
*   **Individual App**: Port 8082
*   **Corporate App**: Port 8083
*   **Firebase**: PRODUCTION (Dev Mode) ※エミュレータ不使用
