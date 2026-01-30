# エンジニアキャリア考案・支援プラットフォーム (Career Development SNS)

## 🎯 プロジェクトのパーパス (Vision)

**「エンジニアのキャリア実現度を最大化することで、日本の技術革新を支え、社会の豊かさの底上げを図る。」**

本サービスは、単なる求人マッチングサービスではありません。エンジニア一人ひとりの「技術・個性・想い」を深く理解し、その人の未来価値を起点としたキャリア形成を支援する「エンジニア価値増幅者（Value Amplifier）」としてのプラットフォームを目指しています。

---

## 🏗 アーキテクチャ構成

本プロジェクトは、言語的な統一（Pure Dart）と効率的なクロスプラットフォーム開発を目標とする **Modular Monolith (Monorepo)** アーキテクチャを採用しています。

### 🚀 ロードマップ
- **Phase 1 (現在)**:
    - フロントエンド: **Expo (React Native) + JavaScript**
    - バックエンド: **Firebase + Pure Dart**
- **Phase 2 (将来)**:
    - フロントエンドも **Flutter** へ移行し、全層を **Pure Dart** で統一。JavaScript を完全に排除します。

---

## 🏢 アプリケーション・エコシステム

単一リポジトリ内で、以下の5つの独立したドメインアプリ/モジュールを管理しています。

| アプリ/モジュール | 役割 | 実行ポート |
| :--- | :--- | :--- |
| **Admin App** | システム全体の統括・審査用ダッシュボード | `8081` |
| **Individual App** | 個人エンジニア向け：キャリアログ・スキル登録・マイページ | `8082` |
| **Corporate App** | 企業向け：自社分析・候補者管理・採用ダッシュボード | `8083` |
| **Job Description** | 求人票の作成・編集・構造化管理サービス | `8084` |
| **FMJS** | 選考進捗・手数料計算・入社後成功（Survey）管理 | `8085` |

---

## 🌟 主要機能と技術的特徴

- **高精度マッチング (Heatmap Engine)**:
  スキルと志向のギャップをヒートマップで可視化。Pure Dart による高度な計算ロジックを共有。
- **メタデータ駆動型 UI**:
  JSON テンプレートに基づいて動的に UI フォームを生成。要件変更に強い柔軟なアーキテクチャ。
- **Pure Dart バックエンド**:
  Node.js を一切使用せず、Firebase + Dart (Cloud Run) で全ビジネスロジックを実装。
- **AI 連携 (Google Gemini)**:
  職歴の自動生成や、キャリアドメイン知識に基づいた高度な分析・フィードバックを提供。

---

## 🛠 技術スタック

- **Frontend**: Expo (React Native), React Context API
- **Backend**: Firebase (Firestore, Auth, Storage), Pure Dart (server.dart)
- **Infrastructure**: Google Cloud Run
- **Documentation**: Markdown, Mermaid diagrams
- **Automated Workflow**: Git Hooks (safe_push), Shell Scripts, Melos (Dart management)

---

## 📂 プロジェクト構造

```text
.
├── apps/                # 独立した機能アプリ群 (Admin, Individual, Corporate, etc.)
├── shared/              # 全アプリ共通資産 (共通UI, ドメインモデル, 核心ロジック)
│   ├── common_frontend/ # Expo 共通コンポーネント (UI Kit)
│   └── domain_logic/    # ヒートマップ、マッチング等の共有エンジン
├── infrastructure/      # Firebase, CI/CD, Docker 等の設定
├── scripts/             # 開発・運用支援スクリプト
└── docs/                # プロジェクトドキュメント
```

---

## 🚀 開発の始め方

### アプリの起動
全てのアプリは `scripts/start_expo.sh` を介して、ポート競合の自動解決を行いながら起動します。

```bash
# 例: 個人用アプリを起動
./scripts/start_expo.sh individual_user_app
```

### 安全なプッシュ (Commit & Push)
`safe_push.sh` を使用することで、ローカル CI 検証（Lint, Test）と GitHub Issue の自動生成を伴う安全なワークフローを強制します。

```bash
./githooks/safe_push.sh "commit message" --prompt "指示内容" --intent "目的" --outcome "結果"
```

---

## � ドキュメント一覧
詳細な情報は `docs/` ディレクトリを参照してください。
- [開発基本情報 (dev_basicinfo.md)](docs/dev_basicinfo.md)
- [プロジェクト構造詳細 (project_tree_structure.md)](docs/project_tree_structure.md)
- [リファクタリング計画 (RefactoringPlan.md)](docs/RefactoringPlan.md)
