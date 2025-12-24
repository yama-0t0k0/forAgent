# 🏗️ Modular Monolith プロジェクト構造 (Phase 1)

## 概要
本プロジェクトは、単一のリポジトリで複数の独立したアプリケーションとドメインロジックを管理する **Modular Monolith (Monorepo)** アーキテクチャを採用しています。
各モジュールは、フロントエンド (**Expo**) とバックエンドロジック (**Pure Dart**) を内包し、独立性を保ちつつ `shared` 領域を介して資産を共有します。

### 📁 アーキテクチャの基本理念
- **モジュール独立性**: 各アプリ（Admin, Individual, Corporate, etc.）は独自のライフサイクルを持ちます。
- **ドメイン駆動**: `job_description` (JD) や `fmjs` を独立したドメインモジュールとして定義し、各アプリから参照します。
- **技術の共存**: フォルダ内に Expo (JS/TS) と Dart が共存する構造です。

### 💡 なぜこの構造なのか？ (Architectural Rationale)
本構造は、機能的なまとまり（ドメイン）を最優先した「モジュラーモノリス」設計です。

- **モジュール完結型開発**: `individual_user_app/` 等の中にフロントとバックを同居させることで、機能追加時のコンテキストスイッチを最小化します。
- **ドメインの資産化**: `job_description` や `fmjs` を独立したアプリ（サービス）として扱うことで、マルチデバイス・マルチロール（個人・法人・管理）間での再利用性を最大化します。
- **スムーズな移行パス**: Phase 2 で Flutter へ移行する際も、各モジュールの `expo_frontend` を `flutter_frontend` へ順番に置き換えていくだけでよく、全体のアーキテクチャ設計を維持したまま言語統一（Pure Dart）を完了できます。

---

## 📂 プロジェクト構造 (Target Architecture)

```
.
├── README.md
├── apps/                                   # 独立した機能アプリ群
│   ├── admin_app/                          # 管理者用アプリ
│   │   ├── expo_frontend/                  # 管理者UI
│   │   └── dart_backend/                   # 管理者用ロジック、Functions
│   │
│   ├── individual_user_app/                # 個人ユーザー用アプリ (本アプリ)
│   │   ├── expo_frontend/                  # エンジニア登録・マイページUI
│   │   └── dart_backend/                   # 通知、ログ、外部連携ロジック
│   │
│   ├── corporate_user_app/                 # 法人ユーザー用アプリ
│   │   ├── expo_frontend/                  # 採用担当用UI (DashBoard)
│   │   └── dart_backend/                   # 自社分析、候補者管理ロジック
│   │
│   ├── job_description/                    # 求人票管理 (JDアプリ/サービス)
│   │   ├── expo_frontend/                  # 求人票作成・編集・管理用UI
│   │   └── dart_backend/                   # 求人票の構造化、バリデーション
│   │
│   └── fmjs/                               # 選考・手数料・サーベイ (FMJSアプリ/サービス)
│       ├── expo_frontend/                  # 選考管理、手数料DashBoard、サーベイUI
│       └── dart_backend/                   # トランザクション・ライフサイクル管理
│
├── shared/                                 # 全アプリ共通資産
│   ├── common_frontend/                    # Expo 共通コンポーネント (UI Kit)
│   ├── common_backend/                     # Firebase共通設定、Dart共通Utils
│   ├── domain_models/                      # JSON定義 (Individual, Company, JD, FMJS)
│   └── domain_logic/                       # ★核心ロジック (Shared Logic)
│       └── heatmap_engine/                 # キャリア分析、ヒートマップ、マッチング計算
│
├── infrastructure/                         # プロジェクト基盤・管理設定
│   ├── firebase/                           # Firebase 横断設定
│   │   ├── firestore/                      # Security Rules, Indexes
│   │   ├── functions/                      # 全アプリ共通・横断的 Cloud Functions
│   │   └── storage/                        # Storage Security Rules
│   └── github/                             # GitHub 自動化・管理
│       ├── templates/                      # Issue/PR テンプレート
│       └── workflows/                      # CI/CD (GitHub Actions)
│
├── docs/                                   # プロジェクトドキュメント
│   ├── purpose.md
│   ├── dev_basicinfo.md
│   └── project_tree_structure.md           # 本ファイル
│
└── tests/                                  # 統合・e2eテスト
```

---

## 🏗️ アーキテクチャに関する回答

### 1. フロント・バックの同一モジュール内共存について
**回答: 非常に優れた、現代的なアプローチです。**
- **妥当性**: 「機能」を中心にフォルダをまとめることで、あるアプリの変更がどこに影響するかを把握しやすくなります。
- **実装**: Expo (Frontend) と Dart (Backend/Logic) を同じ `admin_app/` 等の下に置くことで、コンテキストのスイッチを最小化できます。

### 2. `job_description` (JD) の配置
**回答: `corporate_user_app` と「並列」に配置することを強く推奨します。**
- **理由**: JD は法人が作成するものですが、個人が検索し、管理者が審査する「共有される重要エンティティ」です。Corporate に内包せず、独立したドメインアプリとして並列に置くことで、再利用性が極大化されます。

### 3. `FMJS` の配置
**回答: `shared` ではなく、各アプリと「並列」な独立モジュールに配置すべきです。**
- **理由**: FMJS は「選考（ステータス）」「金銭（手数料）」「満足度（サーベイ）」という非常に重要なビジネスロジックを担います。単なる共通部品（Shared）ではなく、独自のロジックを持つ「トランザクション・エンジン」として並列に置くのがモジュラーモノリスとして相応しい形です。

---

## 🛠️ インフラストラクチャ (Infrastructure)
プロジェクト全体を支える横断的な設定・自動化を管理します。

- **firebase**: Firestore のセキュリティルール、インデックス設定、および複数のアプリに跨る共通の Cloud Functions を管理。
- **github**: プルリクエストやイシューのテンプレート、および CI/CD (ビルド・デプロイ) を自動化するワークフロー定義。

---

## 技術スタック (Modular Monolith 版)
- **Frontend**: Expo (React Native) + JS/TS
- **Backend / Logic**: Firebase + Pure Dart
- **Communication**: Firestore を中心としたデータドリブンな連携

---
*最終更新: 2025年12月 - モジュラーモノリス再定義版*

## 📝 変更ログ (Dev Log)

### 2025年12月24日: 個人登録フローのFirestore連携とドキュメント整備
- **Firestoreデータ連携 (Individual App)**:
    - **MyPageScreen.js**: `/individual/C000000000000` のデータをFirestoreから取得し、ネームプレートやヒートマップに反映するよう改修。
    - **App.js**: アプリ起動時にFirestoreデータをプリロードし、登録画面 (`GenericRegistrationScreen`) の初期値として注入するロジックを実装。
    - **データソース明示化**: UI上にデータ取得元（Firestore / Template）を示すインジケーターを追加。
- **登録フォームのUI改善**:
    - **RecursiveField.js**: `Object.keys` を `Object.entries` に変更し、テンプレートJSON (`engineer-profile-template.json`) のキー順序通りに入力項目を描画するよう修正。
- **Job Description App UI同期**:
    - **JobDescriptionScreen.js**: MyPageScreenと同様のスタイルでヒートマップを実装し、アプリ間でのデザイン一貫性を確保。
- **ドキュメント整備**:
    - **dev_basicinfo.md**: パッケージ管理の方針を「バックエンド (Dart/Melos)」と「フロントエンド (NPM Workspaces)」に明確に分離して記述。

### 2025年12月: Corporate App UI刷新と構造最適化
モジュラーモノリス構造への準拠を進めるため、以下の構造変更と実装を実施。

- **ディレクトリ構造の整理**:
    - `apps/corporate_user_app/expo_frontend/job_description/` を削除。
        - *理由*: `job_description` は独立したドメインモジュール (`apps/job_description/`) として定義されているため、Corporate App内の重複/不要ディレクトリを排除し、責務を明確化。
- **Corporate App (Expo) のUI刷新**:
    - **タブベースナビゲーションの導入**: `CompanyPageScreen.js` を改修し、求人、つながり、使用技術、ブログ、イベント、メニューの6タブ構成へ変更。
    - **固定ヘッダーの実装**: 企業情報（ロゴ、社名、業界など）を画面上部に固定し、タブ切り替え時も常時表示されるレイアウトを採用。
    - **使用技術 (Tech Stack) のデフォルト表示**: 初期表示タブを「使用技術」に設定し、言語・フレームワーク・ツールのバッジ表示を実装。
    - **アコーディオンUIの最適化**: 「魅力/特徴」セクションをメニューから「使用技術」タブ内へ移動し、初期状態を閉じたアコーディオンとして実装。
    - **メニュー画面の整備**: `individual_user_app` の `MenuScreen.js` をベースに、法人向け項目（企業情報編集、アカウント情報など）へ調整して移植。
