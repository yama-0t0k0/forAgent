# ポストモーテム
ポストモーテムとは、設計や実装上の失敗、インシデント、その影響、インシデントを軽減または解決するために講じられた措置、根本原因、および失敗の再発を防ぐためのフォローアップ措置を文書化したものです。
失敗から学ぶための正式なプロセスがなければ、失敗は際限なく繰り返される可能性があります。
ポストモーテムを作成する主な目的は、失敗が文書化され、すべての根本原因が十分に理解され、特に、再発の可能性や影響を軽減するための効果的な予防措置が講じられていることを確認することです。

# 参考資料
https://sre.google/sre-book/postmortem-culture/
https://sre.google/sre-book/example-postmortem/

# Postmortem: Local AI Worker Execution Failure (Gemma 4/2 Upgrade)

**Date**: 2026-04-16
**Status**: Completed / Resolved
**Authors**: Antigravity (AI Architect)

## Summary
Local AI Worker (IronClaw) の性能向上のため、Gemma 4 (E4B) および Gemma 2 (2B) へのアップグレードを試みましたが、メモリ不足およびモデルの機能制約により、タスク実行が完全に停止しました。最終的に `Qwen 2.5 3B` への切り替えを行うことで、メモリ負荷を抑えつつ「ツール実行（Function Calling）」の安定稼働を達成しました。

## Impact
- **Issue #86 (求人応募フロー実装)**: 約2時間にわたり自律開発が停止。
- **リソース競合**: Gemma 4 (9.6GB) のロードによりホストマシンのメモリが枯渇し、Ollama およびオーケストレーターがタイムアウトを繰り返す不安定な状態となりました。

## Timeline
- **06:30**: Gemma 4 (E4B) のダウンロードと設定を開始。
- **07:18**: `ironclaw run` が Gemma 4 のロード中にタイムアウト。`error sending request` が発生。
- **07:45**: メモリ不足（16GB RAMのうち15.9GBを使用）を検知。
- **08:30**: 代替として Gemma 2 2B (1.6GB) を導入。
- **09:32**: Gemma 2 2B が「ツール呼び出し（tools）」に非対応であることが判明し、実行エラー。
- **09:34**: `Qwen 2.5 3B` の導入を決定。
- **15:01**: `Qwen 2.5 3B` により、Issue #86 の自律実行を再開し、成功。

## Detection
オーケストレーターの `daemon.log` および `status.json` によるリアルタイム進捗監視により、タスクが 5 分間進行していない（タイムアウト）こと、および IronClaw からの LLM 接続エラーが即座に検知された。

## Root Causes
1.  **リソース推算の誤り**: 16GB の Mac において、9.6GB のモデルを他の開発ツール（VS Code, Expo, etc.）と並行して動かすための余裕が考慮されていなかった。
2.  **環境特有の機能制限**: Ollama v0.20.7 において、Gemma 2 2B は `completion` （文章生成）のみサポートしており、`tools` （関数呼び出し / Function Calling）が無効であった。

## What Went Well
*   **キャッシュ削除の先行実施**: モデルダウンロード前に `mac_cache_cleanup.sh` を実行したことで、ディスクフルによる二次障害や OS の致命的なハングアップが防がれた。
*   **フェイルセーフ設計**: オーケストレーターがタイムアウトを厳格に管理していたため、モデルロード遅延時にゾンビプロセスが蓄積されることを回避できた。
*   **代替モデルの即時発見**: `Capabilities: tools` を持つ軽量モデル Qwen 2.5 3B を迅速に特定し、ダウンタイムを最小限に抑えられた。

## Lessons Learned
1.  **Local LLM の境界条件**: 16GB RAM の環境では、モデルサイズを 4GB 未満に抑えることが「安定した自律開発」の絶対条件である。
2.  **Capabilities の事前検証**: モデルを切り替える際は、単にサイズだけでなく `ollama show` にて `tools` 権限が有効であることを事前に確認する必要がある。
3.  **モデルブランドへの執着回避**: 特定のブランド（Gemma等）に固執せず、目的（ツール実行）に最適なモデル（Qwen2.5等）をスペックベースで選定する柔軟性が重要である。

## Action Items
- [x] **モデル切り替え**: デフォルトモデルを `qwen2.5:3b` に固定し、IronClaw 構成を更新。
- [x] **タイムアウト緩和**: モデルのロード時間を考慮し、オーケストレーターのタイムアウトを 5分から 10分に延長。
- [x] **構成の安定化**: WEBフック機能を無効化し、ポート競合のリスクを排除。

# Postmortem: Container Runtime Architecture Mismatch (Intel vs. ARM64)

**Date**: 2026-04-18
**Status**: Resolved
**Authors**: Antigravity (AI Architect)

## Summary
Apple Silicon (M4) 環境において、Intel 版 Homebrew を用いてインストールされた Colima/Lima が起動エラー (`limactl is running under rosetta`) を起こし、自律エージェントのサンドボックス環境が利用不能になりました。ネイティブ版 Homebrew (`/opt/homebrew`) の導入とアーキテクチャの統一により解決しました。

## Impact
- **自律開発の停止**: コンテナが起動できないため、ファイルの書き込みや検証を伴う全タスクが中断。
- **デバッグ工数**: 「Docker Desktop は入っているが、その下の仮想化レイヤー (Lima) が非互換」という階層的な問題の特定に時間を要した。

## Timeline
- **02:30**: Docker Desktop の不安定さを解消するため Colima への移行を開始。
- **07:11**: `colima start` が `limactl is running under rosetta` エラーで失敗。
- **07:15**: マシンが Apple M4 (arm64) であるのに対し、`brew` が `/usr/local/bin` (Intel版) であることを特定。
- **07:38**: ユーザー協力のもと、ネイティブ版 Homebrew を `/opt/homebrew` にインストール。
- **08:18**: arm64 版 Colima が正常起動。
- **08:23**: オーケストレーターがサンドボックスを正常に検知し、自律作業を再開。

## Root Causes
1.  **環境の不整合**: Intel Mac からの移行や旧来の設定により、Apple Silicon 機に Intel 版 Homebrew が混入していた。
2.  **仮想化レジストリの制約**: Colima のベースである Lima は、ネイティブ仮想化を利用するため Rosetta 2 (エミュレーション) 下での動作を許容しない。

## Lessons Learned
1.  **環境診断の徹底**: 新しいマシンでコンテナ等のインフラを扱う際は、まず最初に `uname -m` と `which brew` の整合性を確認すべきである。
2.  **インストールの排他性**: Apple Silicon では `/opt/homebrew` を正（ソース）とし、仮想化ツールは必ずそこから導入するルールを徹底する。

## Action Items
- [x] **ドキュメント更新**: `phase0_setup.md` に Apple Silicon 向けのインストール手順を明記。
- [x] **起動スクリプト強化**: `start_agent_system.sh` に `/opt/homebrew/bin` を優先するパス設定を追加。
