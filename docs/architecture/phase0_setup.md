# Phase 0: IronClaw & Gemma 4 セットアップ手順

Antigravity、IronClaw、そして最新の Gemma 4 を組み合わせた最強の自律開発環境の構築
2026年現在の標準的なツールセットに基づき、リポジトリの入手から疎通確認（Phase 0）までの手順を整理します。

---

## 1. コンポーネントの入手元と準備

### Podman (Native & Rootless Container Runtime)
Docker Desktop や Colima に代わる、セキュリティ重視の実行環境です。
* **入手元:** `/opt/homebrew/bin/brew install podman`
* **設定:** `podman machine init --cpus 2 --memory 2048 --now`
* **役割:** エージェントが非特権ユーザー権限でコードを実行するための隔離空間（Sandbox）を提供します。

### Qwen 2.5 3B (Local LLM Engine)
オーケストレーターの「思考・分析エンジン」として、Apple M4 での高速動作が確認されています。
* **ツール:** `ollama.com` から Ollama をインストール。
* **モデルの取得:** `ollama run qwen2.5:3b`
* **役割:** 失敗原因の自動分析、タスクの動的な DAG 分解を担当。

---

## 2. Phase 0：インストールと疎通テスト手順

まずは、個々のコンポーネントが正しく動くか、そしてそれらが繋がるかを確認します。

### Step 1: Apple Silicon ネイティブ環境の構築
MacBook Pro (M4) 等の Apple Silicon 機では、Intel 版バイナリとの混在を避けるため、以下の手順でネイティブ版 Homebrew を導入します。
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# インストール後、/opt/homebrew/bin/brew が使えることを確認
```

### Step 2: Podman の初期化と起動確認
コンテナ環境を立ち上げ、Docker コマンド（またはエイリアス）が `rootless: true` として認識されるか確認します。
```bash
podman machine init --cpus 2 --memory 2048 --now
podman info | grep rootless
# 出力に "rootless: true" とあれば成功
```

### Step 3: Qwen 2.5 の疎通テスト
ターミナルでモデルを立ち上げ、レスポンスが返るか確認します。
```bash
ollama run qwen2.5:3b "環境構築が完了しました。"
```
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
