# 専門エージェント・チームトポロジー (7-Agent Framework)

本ドキュメントは、プロジェクト「yama-0t0k0/engineer-registration-app」に従事する（チームトポロジーの哲学に準拠した）7 つの専門エージェントの役割分担、管轄範囲、および連携パスを定義します。

## チームトポロジーの哲学とは

チームトポロジーは、ソフトウェア開発の組織設計に関する考え方で、以下の4つのチームタイプを提唱しています。

### ストリームアラインドチーム（Stream-aligned Team）
ビジネス価値の流れに沿ったチーム。今回の apps_expert がこれにあたります。

### プラットフォームチーム（Platform Team）
開発者がセルフサービスで利用できるプラットフォームを提供するチーム。今回の platform_shared と platform_infra がこれにあたります。

### エネイリングチーム（Enabling Team）
他のチームの能力向上を支援するチーム。今回の enabling_quality がこれにあたります。

### コンプリケーテッドサブシステム（Complicated Subsystem）
複雑な専門領域を担当するチーム。今回の complex_logic と tech_concierge がこれにあたります。

---

## 1. エージェント一覧と管轄領域

| エージェント名 | 役割 (Team Type) | 主要管轄ディレクトリ | 責務の概要 |
| :--- | :--- | :--- | :--- |
| **pm_agent** | 計画アドバイザー (Planning Advisor) | `README.md`, `.agent/` | 要件定義、タスク分割の知見提供、GitHub管理 |
| **apps_expert** | 実装担当 (Feature Team) | `apps/`, `functions/` | 各アプリケーションの実装・保守、Shared部品の利用 |
| **platform_shared** | 基盤担当 (Platform Team) | `shared/`, `packages/` | 共通UI、基盤ロジック、デザインシステム守護 |
| **enabling_quality** | 品質担当 (Enabling Team) | `docs/`, コード内 JSDoc | コード監査、規約準拠審査、技術ドキュメント保守 |
| **platform_infra** | インフラ担当 (Platform Team) | `githooks/`, `scripts/` | CI/CD、認証基盤(Firebase/GCP)、開発ツール整備 |
| **complex_logic** | 専門ロジック (Complicated) | 独立した純粋関数/ロジック | 複雑な計算、数理モデル、再利用性の高い純粋ロジック |
| **tech_concierge** | 技術調査 (Explorer) | `lab/experiments/` | API調査、プロトタイプ構築、技術選定の判断材料提供 |

> **Note**: これらのエージェントを「誰が指揮するか」は **IronClaw Autonomous Core** が担います。pm_agent はルーティングの意思決定には関与せず、計画立案の知見を提供するアドバイザーです。

---

## 2. 連携フロー（バケツリレーの原則）

システム開発は、以下の「バケツリレー」によって自律的に進行します。
**ルーティングの主体は IronClaw Core** であり、各エージェントは Core からの指示に従って作業を行います。

### A. 開発のメインループ
1. **[IronClaw Core]** GitHub Issue を検知し、Local LLM (Qwen) にタスク分割（DAG 計画）を依頼。pm_agent の SKILL.md を参照して最適なエージェント配置を決定する。
2. **[Apps]** Core から委譲された実装タスクに着手。共通化が必要な部品を見つけた場合、**[Shared]** に相談・依頼する。
3. **[Shared]** 共通部品を提供、またはリファクタリングを実施。
4. **[Apps]** 提供された部品を使用してアプリを完成させる。
5. **[Quality]** 完成した成果物を監査。規約違反があれば **[Apps/Shared]** に差し戻す。
6. **[Quality]** 審査合格後、コードの変更に合わせて `docs/` 配下の図解や設計書を更新。
7. **[IronClaw Core]** 最終報告を行い、Draft PR を作成。人間がレビュー後に GitHub Issue を Close する。

### B. 基盤改善ループ
- **[Infra]** `safe_push.sh` のログを分析し、デプロイ速度や安全性を高める改善を提案。
- **[Concierge]** 次期マイルストーンに向けて、最適な API やライブラリを `lab/` で検証し報告。
- **[Logic]** 散在する計算ロジックを抽出し、テスト完備の純粋関数として体系化する。

---

## 3. エージェント間コミュニケーション・プロトコル

- **名称の固定**: 相互の呼び出しやタスク割り振りには、上記表の「エージェント名」を厳密に使用すること。
- **ルーティング主体**: タスクの割り振りは **IronClaw Autonomous Core** が `pm_orchestrator.js` を通じて行う。各エージェントが独断で他のエージェントにタスクを委譲してはならない。
- **ドキュメントSSOT**:
    - デザインは `DESIGN.md` が絶対。
    - 規約は `docs/CodingConventions/` が絶対。
    - アーキテクチャ図は `docs/` 配下の Mermaid が最終正解。
- **Ask User Input**: 領域を跨ぐ重大な変更（例：Shared の破壊的変更）を行う際は、必ずエージェント間で独断せず、人間（ユーザー）に「影響範囲」と共に承認を求めること。
