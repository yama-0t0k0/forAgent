# ブランチ比較レポート: main vs yama

## 1. 概要
`main` ブランチと `yama` ブランチを比較した結果、プロジェクト構造が**単一のExpoプロジェクトからモノレポ（Monorepo）構造へ大幅に刷新**されていることがわかりました。

- **main ブランチ**: ルートディレクトリに Expo アプリケーションのすべてのソースコードが配置されている。
- **yama ブランチ**: `apps/` や `shared/` といったディレクトリに分割され、複数のアプリケーションと共通ライブラリを管理するモノレポ構造（おそらく Melos を使用）。

---

## 2. ディレクトリ構造の比較

### 2.1 トップレベルディレクトリ
| ディレクトリ/ファイル | main | yama | 備考 |
| :--- | :---: | :---: | :--- |
| `apps/` | ❌ | ✅ | 各アプリケーション（admin, individual, corporate等）を格納 |
| `shared/` | ❌ | ✅ | バックエンド、フロントエンド、ドメインロジックの共通部品 |
| `infrastructure/` | ❌ | ✅ | Firebase設定やTerraformなどのインフラ関連 |
| `scripts/` | ❌ | ✅ | 自動化スクリプト等 |
| `tests/` | ❌ | ✅ | 統合テスト等 |
| `docs/` | ❌ | ✅ | ドキュメント類 |
| `assets/` | ✅ | ❌ | `apps/` 内の各アプリへ移動 |
| `src/` | ✅ | ❌ | `apps/` 内の各アプリへ移動 |
| `pubspec.yaml` | ❌ | ✅ | Dart/Flutterモノレポ管理用 |
| `melos.yaml` | ❌ | ✅ | モノレポ管理ツール Melos の設定 |

### 2.2 ソースコードの移動（マッピング）
`main` ブランチのコードは、`yama` ブランチでは主に以下のように移動・分割されています。

| main でのパス | yama でのパス |
| :--- | :--- |
| `/` (ルートのExpoコード) | `apps/individual_user_app/expo_frontend/` |
| `/assets/json/company-profile-template.json` | `apps/corporate_user_app/expo_frontend/assets/json/` |
| `/assets/json/engineer-profile-template.json` | `apps/individual_user_app/expo_frontend/assets/json/` |

---

## 3. yama ブランチでの主な変更点

### ① 複数アプリケーションの展開
`apps/` ディレクトリ配下に、用途別のアプリケーションが追加されています。
- `admin_app`: 管理者用
- `corporate_user_app`: 企業ユーザー用
- `individual_user_app`: 個人エンジニア用
- `job_description`: 求人票作成・管理用

### ② 共通部品の抽出 (shared/)
各アプリで共通して使用するロジックやコンポーネントが `shared/` に集約されました。
- `shared/common_frontend`: UIコンポーネントや共通テーマ
- `shared/common_backend`: API通信やFirebase関連
- `shared/domain_models`: データ型定義

### ③ インフラとテストの整理
- `infrastructure/`: Firebase のエミュレータ設定やセキュリティルールなどが整理されています。
- `tests/`: Firestore の統合テストなどが追加されています。

### ④ 開発環境の強化
- `scripts/`: デプロイや環境構築の自動化。
- `githooks/`: コミット時の自動チェック。

---

## 4. 結論
`yama` ブランチへの移行により、プロジェクトは単一のアプリ開発から、関連する複数のアプリを効率的に開発できる**スケーラブルなモノレポ構造**へと進化しています。

これにより、フロントエンドとバックエンドのコード共有、複数のモバイル/Webアプリの並行開発、そして一貫したテスト環境の構築が可能になっています。
