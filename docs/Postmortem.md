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

## Root Causes
1.  **リソース推算の誤り**: 16GB の Mac において、9.6GB のモデルを他の開発ツール（VS Code, Expo, etc.）と並行して動かすための余裕が考慮されていなかった。
2.  **モデル性能の誤認**: Gemma 2 2B が Ollama 環境（v0.20.7）においてツール実行をサポートしていると仮定して進めたが、実際には Capability が `completion` のみであった。

## Lessons Learned
1.  **Local LLM の境界条件**: 16GB RAM の環境では、モデルサイズを 4GB 未満に抑えることが「安定した自律開発」の絶対条件である。
2.  **Capabilities の事前検証**: モデルを切り替える際は、単にサイズだけでなく `ollama show` にて `tools` 権限が有効であることを事前に確認する必要がある。
3.  **モデルブランドへの執着回避**: 特定のブランド（Gemma等）に固執せず、目的（ツール実行）に最適なモデル（Qwen2.5等）をスペックベースで選定する柔軟性が重要である。

## Action Items
- [x] **モデル切り替え**: デフォルトモデルを `qwen2.5:3b` に固定し、IronClaw 構成を更新。
- [x] **タイムアウト緩和**: モデルのロード時間を考慮し、オーケストレーターのタイムアウトを 5分から 10分に延長。
- [x] **構成の安定化**: WEBフック機能を無効化し、ポート競合のリスクを排除。
