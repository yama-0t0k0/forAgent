# エンジニアキャリア考案・支援プラットフォーム (Career Development SNS)

## 🎯 プロジェクトのパーパス (Vision)

**「エンジニアのキャリア実現度を最大化することで、日本の技術革新を支え、社会の豊かさの底上げを図る。」**

本サービスは、単なる求人マッチングサービスではありません。エンジニア一人ひとりの「技術・個性・想い」を深く理解し、その人の未来価値を起点としたキャリア形成を支援する「エンジニア価値増幅者（Value Amplifier）」としてのプラットフォームを目指しています。

---

## 🏗 アーキテクチャ構成

本プロジェクトは、言語的な統一（Pure Dart）と効率的なクロスプラットフォーム開発を目標とする **Modular Monolith (Monorepo)** アーキテクチャを採用しています。

特に **スマートフォンでの利用をメインターゲット** としており、画面設計・レスポンシブ戦略はモバイル体験を最優先に設計されています。PC での利用はあくまで補助的な位置付けです。

### 🚀 ロードマップ
- **Phase 1 (現在)**:
    - フロントエンド: **Expo (React Native) + JavaScript**
    - バックエンド: **Firebase + Pure Dart**
    - **マイルストーン**: 通知システム統合とUIブラッシュアップ完了 (Milestone 10)。E2E Auth Routing 検証完了 (Admin, Corporate, Individual 全ロールの自動遷移成功)。

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
| **LP App** | **[Redirection Hub]** 集客・ブランド・各アプリへの遷移ゲート | `8087` |

---

## 🌟 主要機能と技術的特徴

- **高精度マッチング (Heatmap Engine)**:
  スキルと志向のギャップをヒートマップで可視化。「成長（Upskilling）」を重視し、自身のスキルより少し高いレベル（+1〜+2）への挑戦を 100%超 のスコアで推奨。逆に成長につながらないオーバースペックな求人は減点・除外する独自のアルゴリズムを搭載。
- **メタデータ駆動型 UI**:
  JSON テンプレートに基づいて動的に UI フォームを生成。要件変更に強い柔軟なアーキテクチャ。
- **SEO機能の意図的な除外 (Closed Platform Strategy)**:
  本サービスは「完全招待制のクローズドなビジネスSNS」として設計されており、不特定多数の流入（SEO）よりも既存ユーザーの体験と行動分析を最優先します。そのため、SEO関連機能は意図的に実装せず、アプリ内部のエンゲージメント向上にリソースを集中させています。
- **Pure Dart バックエンド**:
  Node.js を一切使用せず、Firebase + Dart (Cloud Run) で全ビジネスロジックを実装。
- **AI 連携 (Google Gemini)**:
  職歴の自動生成や、キャリアドメイン知識に基づいた高度な分析・フィードバックを提供。

---

## 🛠 技術スタック

- **Infrastructure**: Google Cloud Run, Podman (Rootless / Native Apple Silicon / VZ Framework)
- **Monitoring**: Agent Watchdog (Local Log Monitoring & Alerting)
- **Documentation**: Markdown, Mermaid diagrams
- **Automated Workflow**: Git Hooks (safe_push), Shell Scripts, Melos (Dart management), Security Audit/Coverage Reporting

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
全てのアプリは `scripts/start_expo.sh` を介して起動します。
**重要**: ポート競合を防ぐため、一度に起動できるアプリは**1つのみ**です（同時起動非推奨）。詳細は [開発基本情報](docs/dev_basicinfo.md) の「起動設定の厳格化基準」を参照してください。

```bash
# 例: 個人用アプリを起動
./scripts/start_expo.sh individual_user_app
```

### 安全なプッシュ (Commit & Push)
`safe_push.sh` を使用することで、ローカル CI 検証（Lint, Test）と GitHub Issue の自動生成を伴う安全なワークフローを強制します。

```bash
./githooks/safe_push.sh "commit message" --prompt "指示内容" --intent "目的" --outcome "結果"
```

### 自律エージェントシステムの起動
専門エージェントによる自動開発・監視システムを一括で起動します。
```bash
./scripts/start_agent_system.sh
```
このコマンドにより以下がバックグラウンドで開始されます：
- **Podman**: コンテナ実行環境の自動チェック・起動
- **PM Orchestrator**: GitHub Issue の監視とタスクの自動実行
- **Agent Watchdog**: ログのリアルタイム監視とターミナルへの警告表示

---

## 📚 ドキュメント一覧
詳細な情報は `docs/` ディレクトリを参照してください。

### 開発・運用
- [開発基本情報 (dev_basicinfo.md)](docs/dev_basicinfo.md) - 起動方法、環境設定、ルール
- [ホスティング全般 (Hosting.md)](docs/Hosting.md) - Firebase Hosting 構成、.well-known、カスタムドメイン運用
- [CI/CD・ビルド/デプロイ (CICD&BuildDeploy.md)](docs/CICD&BuildDeploy.md) - 現状の自動化と、今後のあるべき姿（ギャップ/ロードマップ）
- [プロジェクト構造詳細 (project_tree_structure.md)](docs/project_tree_structure.md)
- [コーディング規約 (CodingConventions/)](docs/CodingConventions/)

### アプリケーション詳細設計
- [各アプリ設計書 (Documentation_eachApp/)](docs/Documentation_eachApp/)
  - [Admin App](docs/Documentation_eachApp/designdocument_admin_app.md)
  - [FMJS (管理アプリ)](docs/Documentation_eachApp/designdocument_fmjs.md)
  - [Backend App](docs/Documentation_eachApp/designdocument_backend_app.md)
  - [Shared Module](docs/Documentation_eachApp/designdocument_shared.md)

### 計画・セキュリティ
- [リファクタリング計画 (Dev_RefactoringPlan/)](docs/Dev_RefactoringPlan/)
- [認証・認可設計 (Authentication_Authorization.md)](docs/security/Authentication_Authorization.md)
- [セキュリティルール (Firestore _SecRules.md)](docs/security/Firestore%20_SecRules.md)
