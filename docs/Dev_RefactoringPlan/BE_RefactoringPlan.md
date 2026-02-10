# Refactoring & Shared Component Plan for Backend (Full-stack Dart Migration)

本ドキュメントでは、現在の Expo (React Native) + Firebase Functions 構成から、**Full-stack Dart アーキテクチャ (Expo/Flutter + Cloud Run Dart Server)** への移行およびリファクタリングの詳細計画を定義します。

## 🎯 目標 (Objective)

1.  **ロジックの集約**: 各アプリに分散しているビジネスロジックを単一の Dart サーバー (`apps/backend`) に集約する。
2.  **言語統一の準備**: 将来的な Flutter 移行を見据え、バックエンドを Pure Dart で構築し、モデルやロジックを共有可能にする。
3.  **パフォーマンスとコスト**: Node.js よりも軽量・高速な Dart AOT コンパイルバイナリを Cloud Run (Distroless) で運用する。

---

## 📅 詳細マイルストーン (Detailed Milestones)

### 🚀 Phase 1: Backend Integration (Current)
**目的**: フロントエンドは Expo (JS) のまま、バックエンドロジックを Dart Server に委譲する。

#### 1.1 Foundation Setup (基盤構築) ✅
- [x] **ディレクトリ作成**: `apps/backend`
- [x] **サーバー実装**: `shelf` + `shelf_router` による軽量HTTPサーバー。
- [x] **デプロイ構成**: `Dockerfile` (Dart AOT -> Scratch image) の整備。
- [x] **CI/CD設定**: GitHub Actions による Cloud Run への自動デプロイパイプライン構築。 (Issue #333)

#### 1.2 Shared Integration (共通資産の結合)
- [ ] **依存関係の解決**: `apps/backend/pubspec.yaml` に以下のローカルパッケージを追加。 (Issue #334)
    - `shared/domain_models`: データベースの型定義 (User, JobDescription 等)。
    - `shared/common_logic`: 汎用計算ロジック (マッチングアルゴリズム等)。
    - `shared/common_backend`: Firebase Admin SDK ラッパーやログ出力ユーティリティ。

#### 1.3 Authentication Middleware (認証基盤)
- [ ] **Firebase Auth 検証**: (Issue #335)
    - Expo から送られる `Authorization: Bearer <ID_TOKEN>` を検証する Middleware を実装。
    - 検証成功時に `UserContext` (uid, email, claims) をリクエストスコープに注入。
- [ ] **Role-Based Access Control (RBAC)**: (Issue #336)
    - エンドポイントごとに `admin`, `corporate`, `individual` の権限チェックを行うガード処理の実装。

#### 1.4 API Design for Expo (REST API)
**戦略**: Expo (JS) からの利用容易性を最優先し、Phase 1 では標準的な REST API (JSON) を採用する。 (Issue #337)
gRPC や Serverpod 等の Dart に最適化された RPC は、フロントエンドが Flutter 化される **Phase 2** で導入する。

- **理由**:
    - Expo (JS) から gRPC-Web や GraphQL を利用するには、追加のクライアントライブラリや複雑な設定が必要となり、移行コストが増大するため。
    - REST であれば `fetch` API だけで完結し、"つなぎ" としての役割を最小コストで果たせる。

- **Endpoint例**:
    - `POST /v1/matching/calculate`: マッチングスコア計算 (Server-side calculation)。
    - `POST /v1/pdf/generate`: 職務経歴書のPDF生成。
    - `POST /v1/admin/users/:id/approve`: ユーザー承認アクション。

---

### 🔮 Phase 2: RPC Optimization for Flutter (Future)
**目的**: フロントエンドの Flutter 化に合わせ、バックエンド側も型安全な通信プロトコル (RPC) を受け入れられるように進化させる。
※フロントエンドのリプレース計画については [FE_RefactoringPlan.md](./FE_RefactoringPlan.md) を参照。

#### 2.1 RPC Framework Integration
- [ ] **RPC Endpoint の並列稼働**:
    - 既存の REST API エンドポイント (`/v1/*`) を維持しつつ、RPC 用のエンドポイント (`/rpc/*` または gRPC ポート) を追加する。
    - Serverpod, gRPC-Dart, または shelf_router_generator の拡張を検討。

#### 2.2 Shared Model Optimization
- [ ] **モデルのシリアライズ最適化**:
    - JSON だけでなく、Protobuf やバイナリ形式でのシリアライズをサポートし、通信量を削減する。

#### 2.3 Legacy REST API Sunset
- [ ] **REST API の段階的廃止**:
    - 全てのフロントエンドアプリが Flutter 化された後、REST API エンドポイントを廃止し、RPC のみに一本化する。

### 📊 Phase 2 技術選定の比較とメリット (Comparison & Merits)

| プロトコル | メリット (Merits) | 注意点 (Considerations) | Dartエコシステム適合性 |
| :--- | :--- | :--- | :--- |
| **gRPC** | - **型安全性**: `.proto` ファイルによる厳密な型定義。<br>- **パフォーマンス**: Protobuf (バイナリ) による高速・軽量通信。<br>- **双方向通信**: Streaming API のサポート。 | - **学習コスト**: Protocol Buffers の習得が必要。<br>- **Web互換**: gRPC-Web プロキシが必要になる場合がある。<br>- **デバッグ**: cURL 等で直接叩きにくい (grpcurl が必要)。 | **◎ 高い**<br>(Google製であり公式サポート充実) |
| **Serverpod** | - **Dart Native**: Dart のために設計されており、`.proto` 不要。<br>- **開発効率**: モデル定義からコード自動生成、ORM統合。<br>- **エコシステム**: キャッシュ、ファイルアップロード等が統合済み。 | - **ベンダーロックイン**: Serverpod 独自の仕組みに依存する。<br>- **成熟度**: gRPC に比べると歴史が浅い。 | **◎ 最高**<br>(Dart to Dart に特化) |
| **GraphQL** | - **柔軟性**: クライアントが必要なデータのみを取得可能 (Over-fetching防止)。<br>- **スキーマ駆動**: 型定義による開発。 | - **複雑性**: クエリの設計、N+1問題への対処、キャッシング戦略。<br>- **Dartサーバー**: エコシステムは存在するが、Go/Node.jsほど成熟していない可能性。 | **◯ 普通**<br>(ライブラリは存在する) |

**推奨方針**:
- **Full-stack Dart (Flutter + Dart Server)** の利点を最大化する場合、**Serverpod** または **gRPC** が有力候補となる。
- 特に **Serverpod** は Dart 言語統一の恩恵 (コード共有、開発体験) を最も享受できるため、最優先で検討する。

---

## 🛠 実装ステップ (Implementation Steps)

### Step 1: Hello World & Deploy Verification
1. ローカルで `dart run bin/server.dart` を実行し、動作確認。
2. Cloud Run への手動デプロイを行い、疎通確認。

### Step 2: Shared Library Linking
1. `apps/backend/pubspec.yaml` を編集:
   ```yaml
   dependencies:
     shared_domain_models:
       path: ../../shared/domain_models
     shared_common_logic:
       path: ../../shared/common_logic
   ```
2. 簡単なロジック（例: `MatchingService`）をインポートしてエンドポイントから呼び出す。

### Step 3: Auth Middleware Implementation
1. `firebase_admin` (Dart port) または JWT 検証ライブラリを導入。
2. 全てのエンドポイントの前に認証チェックを挟む。

### Step 4: First Business Logic Migration
1. 現在 `apps/fmjs/dart_backend` 等にあるロジック、またはクライアントサイドで行っている重い処理を1つ選定。
2. Dart Server 上に移植し、Expo から `fetch` で呼び出すように修正。
