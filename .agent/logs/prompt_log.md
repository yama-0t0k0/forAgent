# Prompt History Log

このファイルは、人間からAI（各種エージェント）に与えられた主要な指示（プロンプト）の履歴と、その結果得られた判断や反省点を記録・共有するためのメタデータです。主にPushを実行する直前のタイミングで、PM Agent（またはDocs Agent）によって直近の履歴がまとめられ追記されます。

**規則:**
- 見出しのタイムスタンプは `[YYYY-MM-DD HH:MM]` 形式で記載し、1日に複数回のPushが発生しても順序とタイミングが明確になるようにします。

## [2026-04-03 12:20] LP App 開発環境の正常化とルーティング検証の準備
* **Target Issue**: #3 (Automated App Startup Mechanism)
* **主要な人間のプロンプト**:
  * 「手動 E2E テスト（LP → ログイン → 対象アプリ遷移フロー）を確認したいので、下記のようなコマンドでLPアプリをシミュレーターで起動してくれ。」
  * 「githooks/safe_push.shしてくれ。」
* **AIの判断と結果**:
  * `lp_app` のシミュレータ起動を試行。Dev Client 未インストールのため、`npx expo run:ios` によりビルド・インストールプロセスを開始（iPhone 16 Pro）。
  * Firebase 初期化エラーおよび Path Alias (`@shared`) の不整合を修正し、モノレポ構成での Metro Bundler 動作を安定化。
  * `AuthContext.js` における Firebase 初期化タイミングを調整。
  * Milestone 3 直下の Issue #21 (Finalize Deep Link) の流れを汲み、管理者ロールでの自動起動・リダイレクト検証の準備を完了。
* **反省点・学び**:
  * シミュレータ起動コマンド (`expo start --ios`) は、初回ビルドが完了していない環境では失敗するため、`run:ios` への自動的な切り替え案内が必要。
  * `safe_push.sh` 実行時の引数に詳細な E2E テストシナリオを組み込むことで、後続の検証フェーズ（管理者アプリへのポート 8081 遷移）へのトレーサビリティを強化。

---

## [2026-03-27 09:15] エージェント運用体制の整備とプロンプトログ機構の導入
* **Target Issue**: N/A (運用体制の改善)
* **主要な人間のプロンプト**:
  * 「特に私が特定のエージェントに呼びかけていない場合には、PMエージェントへのプロンプトであると認識してくれ。」
  * 「更新すべきドキュメントのありかは `/Users/yamakawamakoto/ReactNative_Expo/forAgent/docs` だ。」
* **AIの判断と結果**:
  * PM Agentをデフォルトの指揮官として位置付けるルールを `pm_agent/SKILL.md` に追加。
  * `.agent/logs/prompt_log.md` を作成し、Push前の履歴記録を義務化。

## [2026-03-27 10:53] LP App ログイン後リダイレクト失敗の修正と環境復旧
* **Target Issue**: N/A (直近のデバッグ作業)
* **主要な人間のプロンプト**:
  * ログイン後の遷移失敗（文字化け画面）の指摘。
  * Admin App を Safari で開くべきという運用ルールの提示。
  * 相対パス禁止・Path Aliases 使用のコーディング規約遵守の指示。
  * シミュレータのネットワークエラー対応依頼。
* **AIの判断と結果**:
  * `lp_app` の Firebase 設定を `@shared` エイリアスを用いた共通設定参照へリファクタリングし、初期化エラーを解消。
  * `.env` の各アプリ（Admin, Corporate, Individual）のリダイレクト先を `localhost` ポートへ修正し、ローカル開発環境での遷移を正しく構成。
  * `fix_simulator_network.sh` を実行し、シミュレータのネットワークスタックを正常化。
  * `index.html` の Meta タグ（charset）を確認し、文字化けの根本原因が本番環境（SEO用）へリダイレクトされていたことによるものと特定。
  * **Agent ブランチの変更を `main` へ安全にマージし、その後 Agent ブランチへ復帰。**
* **反省点・学び**:
  * モノレポ環境では環境変数の同期不足がリダイレクト失敗を招きやすいため、`.env` の一括確認が重要。
  * シミュレータのリセットによりビルド済みの Dev Client が消失するため、再ビルド手順をユーザーに明確に伝える必要がある。
## [2026-03-27 14:54] UI Designer Agent PoC と Firestore セキュリティ検証の完遂
* **Target Issue**: TBD (PoC検証)
* **主要な人間のプロンプト**:
  * 「UI Designer Agent の PoC を進めてほしい。一般人が Firestore に侵入できないか E2E テストするためのテスト画面を作成して確認してくれ。」
  * 「侵入に成功したら攻撃内容とデータを表示し、失敗したらリスクなしと表示してスクショを撮って報告してくれ。」
  * 「Agent ブランチから Main へマージし、また Agent ヘ戻ってきてくれ。」
* **AIの判断と結果**:
  * UI Designer Agent 向けの `SKILL.md` を作成し、デザイン美学とワークフロー（Google Stitch活用・PDM承認フロー）を定義。
  * `tests/security_stub/index.html` という、Firebase SDK を直接叩くスタンドアロンな HTML テストツールをスクラッチで作成。これにより、アプリ本体のコードを汚さずにセキュリティ判定が可能に。
  * ブラウザサブエージェント（Maestro相当）により、認証なしでの Read 試行および `role: admin` インジェクション攻撃をシミュレート。いずれも Firestore Security Rules により適切にブロックされることを実証。
  * `githooks/merge_agent_into_main.sh` を新設し、Agent ブランチから main へのマージ、および Agent ブランチへの復帰を自動化。
* **反省点・学び**:
  * `safe_push.sh` の自動モード実行時に、GitHub Issue 作成用の各種引数（--prompt, --intent等）が不足していたため、GitHub 側へのトレーサビリティ投稿が漏れてしまった。今後は `safe_push.sh` の要件を厳守する。
  * 初期キャプチャ時にターミナル部分が見切れていたため、再取得を行い証拠能力を高めた。

## [2026-03-29 01:15] Firestore セキュリティルールの脆弱性発見と修正
* **Target Issue**: #6 (後述のsafe_push.shで自動作成)
* **主要な人間のプロンプト**:
  * 「今回作成したE2Eテストは、SQLインジェクション他さまざまなクラッキングや侵入手段にも対抗できるようなテストケースとなっているか？」
  * 「githooks/safe_push.shしてくれ。」
* **AIの判断と結果**:
  * 高度な攻撃ペイロード（Lateral Movement、Schema Bypass、Unauthorized Deletion、Privilege Escalation）を `tests/security_stub/index.html` に実装。
  * ブラウザサブエージェントによる実行で、**重大な脆弱性を発見**: `firestore.rules` にグローバルな `allow read, write: if true` ルールが残存しており、未認証ユーザーでも全コレクションにアクセス可能な状態であった。
  * `firestore.rules` を修正: グローバル allow-all の削除、6箇所の `allow read: if true` を `allow read: if isAuthenticated()` に強化。
  * Firestore Emulator 上で `verify_rules.mjs` を実行し、7つの攻撃ベクトル全てが `permission-denied` で遮断されることを確認（7/7 PASS）。
* **反省点・学び**:
  * 開発初期に導入した「全許可」ルールがそのまま残っていたのは危険。今後は開発用ルールと本番用ルールを明確に分離する仕組みが必要。
  * エミュレータを使ったローカル検証がルール修正の即時フィードバックに非常に有効であることを確認。

## [2026-03-29 01:33] PM Agent SKILL.md の構造的改善（マイルストーン・Issue作成漏れ防止）
* **Target Issue**: TBD (本Pushで自動作成予定)
* **主要な人間のプロンプト**:
  * 「githooks/safe_push.shの実行を指示した際は、docsのドキュメントとマイルストーンの更新をし、次にPushとIssue作成をするフローになっているはずだ。しかし、docsのドキュメント更新はされているものの、マイルストーンとIssue作成はされていない。今後、これらを忘れないよう.agent/skills/pm_agent/SKILL.mdを改善してくれ。」
* **AIの判断と結果**:
  * 問題分析: 旧SKILL.mdのルール5〜7が一文の抽象的な記述であり、AIが具体的アクションに落とし込めずスキップしやすい構造だったことを特定。
  * `safe_push.sh` のコード分析: `--milestone` 引数が省略されると `push_with_milestone.js` への委譲がスキップされ、マイルストーン連携なしのフローに分岐する仕様を確認。
  * SKILL.md を Phase 1〜3 の3段階フローに再構成し、マイルストーン更新(Step 1-3)・Issue作成確認(Step 3-1)に🔴MUSTマーカーと具体的コマンド例を明記。
  * Push完了チェックリスト（7項目）を導入。
  * `docs/dev_postmortem.md` に恒久対策エントリを追記。
* **反省点・学び**:
  * 同じ問題（マイルストーン更新漏れ）が3月4日のポストモーテムで既に記録されていたにも関わらず再発した。ルールの「意図」だけでなく「手順」を具体化しないと、AIは繰り返し同じミスを犯す。

## [2026-03-30 11:35] Firestore セキュリティ監査の最終検証と安全なPush
* **Target Issue**: #6 (Firestore セキュリティの要塞化)
* **主要な人間のプロンプト**:
  * 「githooks/safe_push.shしてくれ。」
* **AIの判断と結果**:
  * 前回の修正（グローバル全許可ルールの削除）が正しく適用されていることを、強化された `tests/security_stub/index.html` で再検証。
  * `Injection Attempt` を含む7つの攻撃ベクトル全てに対する防御を実証し、実行結果のスクリーンショット（`tests/screenshots/`）を証拠として固定。
  * `E2E_TestResultReport.md` に最新の監査結果を追記し、技術的な証明責任を完遂。
  * `PM Agent` の新ルールに従い、計画立案・承認・ドキュメント更新のプロセスを経て `safe_push.sh` を実行。
* **反省点・学び**:
  * セキュリティ検証のような「壊れないことを証明する」作業は、自動化されたレポート（スクショ付き）をPushフローに組み込むことで、後続のレビュアーやユーザーへの安心感に直結する。

## [2026-03-31 17:58] フロントエンド網羅性監査とセキュリティレポートの改善
* **Target Issue**: #6 (Firestore セキュリティの要塞化)
* **主要な人間のプロンプト**:
  * 「githooks/safe_push.shしてくれ。」
* **AIの判断と結果**:
  * `tests/verify_coverage.mjs` を新規作成し、全アプリケーション（Admin, Corporate, JobDescription, FMJS, LP）の主要画面がデプロイ済みサイト上で正しく描画されているかを自動判定する基盤を構築。
  * `coverage_report_*.md` を自動生成し、現在の実装状況とデプロイ先URLの対応関係を可視化。
  * `tests/rotate_logs.sh` によるログ管理の効率化。
  * `tests/security_stub/verify_rules.mjs` の修正: 「防御成功（ブロック）」を正しく PASS 判定するようロジックを修正し、セキュリティ報告書の信頼性を向上。
* **反省点・学び**:
  * 以前の報告書では「アクセス拒否 = 失敗」のような誤解を招く表現があったが、セキュリティ監査においては「意図通りの拒否 = 成功」であることを明確にする UI/レポート設計が重要であると再認識。
## [2026-03-31 18:10] PM Agent 運用ルールの改善（同意後の自律実行の明文化）
* **Target Issue**: N/A (運用体制の改善)
* **主要な人間のプロンプト**:
  * 「.agent/skills/pm_agent/SKILL.md を更新したので、githooks/safe_push.shしてくれ。」
* **AIの判断と結果**:
  * `PM Agent` の `SKILL.md` に新ルール「8. [同意後の自律実行]」を追加。これにより、実装計画に対するユーザーの合意が得られた後は、個別のコマンド実行ごとに許可を求める必要がなくなり、完了報告までシ律的に作業を推進できる体制を整えた。
* **反省点・学び**:
  * 開発スピードとユーザーの確認コストのバランスを最適化するため、明示的な「自律実行フェーズ」の定義は AI エージェント運用において極めて有効。

## [2026-04-02 11:40] モノレポ設計ドキュメントの同期とポート番号・ディープリンク定義の整合性確保
* **Target Issue**: #21 (Finalize Deep Link and Port Mapping Documentation)
* **主要な人間のプロンプト**:
  * 「最新の walkthrough.md にある内容を docs ディレクトリの各ドキュメントへ反映し、ポート番号（8081, 8082, 8083）やディープリンク（individual-app:// 等）の情報を最新化・同期してくれ。」
  * 「ポート番号は scripts/start_expo.sh を正として修正してよい。」
* **AIの判断と結果**:
  * 各アプリ（Admin, Individual, Corporate）の設計書を `start_expo.sh` の定義に合わせ一括更新。
  * LPアプリからの「Redirection Hub」ロジック（`waitForPort` による監視と `dev_broker.mjs` による自動起動）を設計ドキュメントに明文化し、開発環境の挙動を予測可能に。
  * `LPmicroCMSWithFirebaseAuth.md` において、**Note RSS** をニュースの正本（Source of Truth）として位置付けるアーキテクチャを確定。
  * 修正内容を Milestone 3 直下の Issue #21 に記録し、トレーサビリティを確保。
* **反省点・学び**:
  * 複数の設計ドキュメントにまたがる情報の整合性は、一箇所のツール（`start_expo.sh`）を「正」として参照することで、AIによる自動更新でも不一致を防げる。
  * `walkthrough.md` の内容を定常ドキュメントへ即座に移管するフローは、知識の陳腐化を防ぐために非常に重要。
## [2026-04-02 11:45] PM Agent 運用ルールの強化（Issueへのコミットログ追記の義務化）
* **Target Issue**: #7 (improve(pm-agent): restructure SKILL.md) / #22 (Push自動作成)
* **主要な人間のプロンプト**:
  * 「最近、Issueにコミットログを残してくれていないので、必ず残すようにしてくれ。」
* **AIの判断と結果**:
  * PM Agent の [SKILL.md](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/.agent/skills/pm_agent/SKILL.md) を修正。
  * 「Step 3-3: コミットログの追記」を Push 実行フローの MUST 事項として新記。
  * Push 実行チェックリストに証跡確認項目を追加。
  * 既存の Issue #21 および #22 に対して、最新のコミットハブ `b876933` を手動で追記。
* **反省点・学び**:
  * AI は「良かれと思って」手順を省略する傾向があるため、ユーザーが求める「証跡の可視性」を明示的なチェックリストに組み込むことが、信頼性の高い PM 業務の鍵となる。
