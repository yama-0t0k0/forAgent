# Phase 0: IronClaw & Gemma 4 セットアップ手順

Antigravity、IronClaw、そして最新の Gemma 4 を組み合わせた最強の自律開発環境の構築
2026年現在の標準的なツールセットに基づき、リポジトリの入手から疎通確認（Phase 0）までの手順を整理します。

---

## 1. コンポーネントの入手元と準備

### IronClaw (Safety Sandbox & MCP Server)
IronClawは、Rustで記述されたWASMベースのセキュア実行環境です。
* **入手元:** `github.com/google/ironclaw` (Open Source Repository)
* **バイナリ:** GitHub Releasesから、自分のOS（macOS/Linux/Windows）に合った `ironclaw-cli` をダウンロードします。
* **役割:** Antigravity（MCPクライアント）からの命令を受け取り、隔離環境でコード実行やファイル操作を行います。

### Gemma 4 (Local LLM Engine)
Gemma 4をローカルで高速に動かすには、Googleが推奨する **Ollama 2.0** または **vLLM** を使用します。
* **ツール:** `ollama.com` から Ollama をインストール。
* **モデルの取得:** ターミナルで `ollama run gemma4:26b` (またはプロジェクト規模に応じたサイズ) を実行。
* **役割:** 専門エージェント（skill.md）の「脳」として、オフライン・低コストで推論を提供します。

---

## 2. Phase 0：インストールと疎通テスト手順

まずは、個々のコンポーネントが正しく動くか、そしてそれらが繋がるかを確認します。

### Step 1: Gemma 4 の起動確認
ターミナルでモデルを立ち上げ、レスポンスが返るか確認します。
```bash
ollama run gemma4:26b "こんにちは。自律開発の準備はできていますか？"
```
> **確認事項:** 爆速でレスポンスが返ってくれば、GPUアクセラレーションが正しく効いています。

### Step 2: IronClaw の初期化とサンドボックス確認
IronClawを立ち上げ、あなたのプロジェクトディレクトリのみを「安全な作業場」として認識させます。
```bash
# プロジェクトディレクトリをマウントして起動
ironclaw init --path ./my-dev-project --allow-read-write
```
次に、隔離環境内でファイルが読み書きできるかテストします。
```bash
ironclaw exec "ls -la"
```
> **確認事項:** 指定したディレクトリ以外のファイル（例：`~/.ssh`など）が見えないことを確認してください。

### Step 3: Antigravity との接続（MCPテスト）
Antigravityのコンソール設定（Settings > Tools）で、IronClawをMCPサーバーとして登録します。
* **Endpoint:** `http://localhost:8080` (IronClawのデフォルト)
* **疎通テスト:** Antigravityのチャット画面で、いずれかの `skill.md` を選択し、以下のように指示を出します。
    > 「IronClawを使って、プロジェクト直下に `connection_test.txt` というファイルを作成し、中身に 'Gemma 4 is online' と書き込んでください。」

---

## 3. Phase 0 完了の定義

以下の状態になっていれば、Phase 0 は大成功です。

1.  **物理的制限:** IronClawが、指定したディレクトリ以外へのアクセスを拒否している。
2.  **推論の自立:** Antigravityの指示が、外部API（Gemini）を経由せず、ローカルのGemma 4によって処理されている。
3.  **成果物の生成:** Antigravity上の指示だけで、あなたのPC上のフォルダに実際にファイルが生成された。

---

### 次のステップへの準備
疎通が確認できたら、次は **「複数の skill.md（専門エージェント）を、どうやって IronClaw 内で並列に衝突させずに走らせるか」** というオーケストレーション（Phase 1）に移行します。
