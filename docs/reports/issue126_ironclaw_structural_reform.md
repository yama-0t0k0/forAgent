# 完了報告: Issue #126 — IronClaw 自律システム：長期安定運用のための構造改革

## 🤖 AI Development Cycle

### 📝 Implementation Details / 実装内容

Issue #126 に基づき、IronClaw 自律システムの長期安定運用を阻んでいた**構造的な根本原因**を 3 つ特定し、抜本的な構造改革を実施しました。

---

## 背景

これまで発生していた個別のエラー（Rust Edition 不一致、npm 依存衝突、バイナリ汚染、ネットワーク解決不能）は、すべて**設計上の構造的問題**から派生した症状でした。モグラ叩きを繰り返しても、構造を変えない限り新たな障害が必ず発生する状態でした。

## 根本原因と解決策

| # | 根本原因 | 解決策 | 効果 |
| :--- | :--- | :--- | :--- |
| 1 | `ironclaw_core` (Rust) が未使用の wasmtime/wasi を抱え、Nightly 必須・数分ビルド・Edition 衝突の温床 | wasmtime/wasi/cap-std/reqwest を完全除去。Regex 検閲フィルタに特化 (v0.2.0) | **Stable Rust で 1.11 秒ビルド** |
| 2 | オーケストレーターのコンテナ化が Ollama へのネットワーク問題を増幅 | ホスト上で直接実行し、`127.0.0.1:11434` 直結通信 | **`fetch failed` を構造的に根絶** |
| 3 | フォールバック DAG に存在しないエージェント名 (`lp_app_expert`) | `apps_expert` に修正。DAG 正規化を 2-pass 方式に改善 | **DAG 実行の安定化** |

## 設計方針の明文化

> [!IMPORTANT]
> **「IronClaw Core」はシステム全体の名称であり、Rust バイナリ単体を指すものではない。**

| コンポーネント | 実装 | 役割 |
| :--- | :--- | :--- |
| **Orchestrator** | `pm_orchestrator.js` (Node.js) | 計画・ルーティング・LLM 呼び出し・失敗分析。ホスト上で直接実行。 |
| **Safety Guard** | `ironclaw_core` (Rust binary) | 出力検閲フィルタ。LLM 出力を stdin で受け取り、機密情報を Regex で検出・遮断する物理的制約レイヤー。 |
| **Watchdog** | `agent_watchdog.js` (Node.js) | ログのリアルタイム監視と異常検知・アラート。 |

この定義は `docs/architecture/autonomous_system.md` に正式に追記しました。

## 変更ファイル一覧

### コア変更
| ファイル | 操作 | 内容 |
| :--- | :--- | :--- |
| `shared/ironclaw_core/Cargo.toml` | MODIFY | 依存関係を数百クレート → 約 10 クレートに削減 |
| `shared/ironclaw_core/src/main.rs` | REWRITE | stdin → Regex 検閲 → stdout のパイプ型フィルタ (v0.2.0) |
| `shared/ironclaw_core/src/inference.rs` | DELETE | LLM 呼び出しの責務をオーケストレーターに移管 |

### オーケストレーター
| ファイル | 操作 | 内容 |
| :--- | :--- | :--- |
| `.agent/orchestrator/pm_orchestrator.js` | REWRITE | v3: ホスト実行、Ollama `127.0.0.1` 直結、ironclaw_core を pipe フィルタとして呼び出し、DAG 正規化修正 |

### インフラ
| ファイル | 操作 | 内容 |
| :--- | :--- | :--- |
| `scripts/start_agent_system.sh` | REWRITE | v3: ホスト直接起動、Ollama ヘルスチェック、ironclaw_core 自動ビルド |
| `Containerfile` | SIMPLIFY | ビルダー専用（Stable Rust 1.83、Node.js ランタイムステージ削除） |
| `.dockerignore` | CREATE | `target/`, `node_modules/` 等の恒久的除外 |

### ドキュメント
| ファイル | 操作 | 内容 |
| :--- | :--- | :--- |
| `docs/architecture/autonomous_system.md` | UPDATE | 用語定義セクション追加、コンポーネントテーブル追加、コンテナ/ネットワーク記述の更新 |
| `docs/architecture/ironclaw_security_policy.md` | UPDATE | 物理的制約レイヤーを Safety Guard v0.2 仕様に更新、検閲パターン一覧を明記 |
| `docs/architecture/model_selection.md` | UPDATE | 連携フローをホスト直接実行方式に更新 |

## 検証結果

| テスト項目 | 結果 | 備考 |
| :--- | :--- | :--- |
| `cargo build --release` (Stable Rust) | ✅ 成功 | 1.11 秒（以前は Nightly + 数分） |
| セキュリティフィルタ — 安全出力の通過 | ✅ PASS | `"This is safe output"` → そのまま通過 |
| セキュリティフィルタ — 機密情報の遮断 | ✅ BLOCKED | `GITHUB_TOKEN = ghp_...` → 即座に遮断 |
| Ollama ヘルスチェック | ✅ 接続確認 | `qwen2.5:3b`, `gemma2:2b`, `gemma4:e4b`, `gemma:2b` |
| Issue #114 (E2E) 自律処理 | ✅ **3/3 タスク完了** | **プロジェクト史上初の E2E 完走** |
| Issue #123 (GitHub 統合) 自律処理 | ✅ **3/3 タスク完了** | — |
| ポーリング継続 | ✅ IDLE 待機 | エラーなく 60 秒間隔で正常ポーリング |

## セキュリティロードマップ

| フェーズ | セキュリティレイヤー | 状態 |
| :--- | :--- | :--- |
| **Phase 1（現在）** | Regex 出力検閲 + 環境変数デコンタミネーション + Podman Rootless | ✅ 稼働中 |
| **Phase 2（将来）** | WASM Capability-based Security (wasmtime 再導入) | 🔮 Dart 移行時に再導入予定 |

## 今後の展望

1. **エージェントの実行隔離**: 専門家エージェントのコード実行を Podman コンテナ内で隔離する機能を Phase 2 で実装
2. **DAG 計画の精度向上**: Qwen の JSON 出力パース成功率を上げるためのプロンプト最適化
3. **Issue の自動 Close**: 自律処理完了後、GitHub API 経由で Issue を自動 Close する機能追加
4. **モデルの動的選択**: メモリ状況に応じた Qwen / Gemma 4 の自動切り替え

---

**Included Commits:** (Push 後に記入)

**Related Issues:**
- [Issue #126](https://github.com/yama-0t0k0/forAgent/issues/126) — 本構造改革
- [Issue #114](https://github.com/yama-0t0k0/forAgent/issues/114) — E2E テスト（自律完走を確認）
- [Issue #123](https://github.com/yama-0t0k0/forAgent/issues/123) — GitHub 外部記憶統合（自律処理完了）
