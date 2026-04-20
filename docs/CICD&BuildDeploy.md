# CI/CD & Build/Deploy

本ドキュメントは、本プロジェクト（engineer-registration-app-yama）の **現状の CI/CD とビルド・デプロイ運用**を整理し、リリース時/リリース後の運用フェイズを見据えた **「今後あるべき姿」**を、現状との差分（ギャップ）込みで記載する。

関連ドキュメント:
- [docs/Hosting.md](./Hosting.md)
- [docs/security/GCP_SecurityProcedures.md](./security/GCP_SecurityProcedures.md)
- [docs/dev_basicinfo.md](./dev_basicinfo.md)

---

## 1. 全体像（何をどこへデプロイしているか）

### 1.1 フロントエンド（Expo / React Native）

- 各アプリは `apps/*/expo_frontend`（LP だけ `apps/lp_app`）に存在する。
- Web 配信（SPA）は Firebase Hosting を利用する（target ごとに別 site）。
  - 設定: [firebase.json](../firebase.json), [.firebaserc](../.firebaserc)
  - Hosting の詳細: [docs/Hosting.md](./Hosting.md)

### 1.2 バックエンド/API

- Matching API は Cloud Run（`matching-functions`）として運用する。
  - GitHub Actions: [deploy-matching-api.yml](../.github/workflows/deploy-matching-api.yml)
  - Dockerfile: [infrastructure/firebase/functions/Dockerfile](../infrastructure/firebase/functions/Dockerfile)
- 追加のバックエンド（`backend-app`）も Cloud Run へデプロイする設計がある。
  - GitHub Actions: [deploy-backend-app.yml](../.github/workflows/deploy-backend-app.yml)
  - Dockerfile: [apps/backend/Dockerfile](../apps/backend/Dockerfile)

### 1.3 Firebase（Functions / Firestore Rules）

- Firebase Functions（Node）は `apps/functions` をデプロイ対象とする。
  - 設定: [firebase.json](../firebase.json) の `"functions": { "source": "apps/functions" }`
- Firestore Security Rules は [firestore.rules](../firestore.rules) を `firebase deploy --only firestore:rules` で反映する。
  - 手順: [GCP_SecurityProcedures.md](./security/GCP_SecurityProcedures.md)

### 1.4 ローカル実行・検証環境
- **Podman (Rootless)**:
  - 自律エージェントのサンドボックス、ローカルでのコンテナビルド、および `Matching API` の動作検証に使用。
  - セキュリティ上の理由から、ホストのルート権限を必要としない Rootless モードを標準とする。

---

## 2. 現状の CI/CD（実装済みの自動化）

### 2.1 ローカル CI（Push 前チェック）

Push は原則として `githooks/safe_push.sh` で実施する運用になっている。

- `safe_push.sh` は以下を実行する:
  - `scripts/local_ci.sh` の実行（存在する場合）
  - `git add -A` → commit → `git push origin yama`
  - Push 後に GitHub Issue を自動作成（`scripts/create_push_issue.js`）
- 該当ファイル:
  - [safe_push.sh](../githooks/safe_push.sh)
  - [local_ci.sh](../scripts/local_ci.sh)
  - [create_push_issue.js](../scripts/create_push_issue.js)

ローカル CI の中身（要点）:
- `shared/common_frontend` の規約チェック（`scripts/check_coding_conventions.js` があれば実行）
- 各アプリ（admin/individual/corporate/job_description/fmjs/admin_app 等）の規約チェック
- フル環境では lint/typecheck/test/expo config の検証も実行するが、環境によりスキップされる

### 2.2 GitHub Actions（Cloud Run デプロイ）

現状、GitHub Actions で **Cloud Run へのデプロイ**が用意されている。

- Matching API:
  - [deploy-matching-api.yml](../.github/workflows/deploy-matching-api.yml)
  - ブランチ: `main`, `master`, `yama` への push（および手動 `workflow_dispatch`）で走る
  - 認証: `secrets.GCP_SA_KEY`（credentials_json）を使用
  - ビルド: **Docker** (GitHub Actions Runner 上) → Artifact Registry へ push → Cloud Run deploy
- Backend App:
  - [deploy-backend-app.yml](../.github/workflows/deploy-backend-app.yml)
  - 変更検知パス: `apps/backend/**`, `shared/**`

注意:
- Workload Identity Federation という表現はあるが、実装は `credentials_json` を使っている。今後は OIDC（`id-token: write`）でキー無し運用に寄せるのが望ましい（§6）。

---

## 3. 現状のビルド/デプロイ（手動作業が必要な領域）

### 3.1 Firebase Hosting（Web 配信）

Hosting は target ごとに `public` が異なる（詳細は [docs/Hosting.md](./Hosting.md)）。

代表例:
- `admin-app`: `apps/admin_app/expo_frontend/dist`
- `lp-domain`: `apps/lp_app/dist`
- `lp-domain-dev`: `apps/lp_domain_hosting/public`

ビルド（dist 生成）の例:

```bash
cd apps/admin_app/expo_frontend
npx expo export -p web

cd ../../lp_app
npx expo export -p web
```

デプロイの例:

```bash
firebase use flutter-frontend-21d0a
firebase deploy --only hosting:admin-app
firebase deploy --only hosting:lp-domain
firebase deploy --only hosting:lp-domain-dev
```

`.well-known` の注意点:
- `lp-domain` は dist 配信のため、`apps/lp_app/dist/.well-known/*` が無いと 404 になる。
- 現在の `.well-known` のソースは `apps/lp_domain_hosting/public/.well-known` にあるため、**デプロイ前の取り込み（コピー/同期）を手順として固定化すること**を推奨する（詳細は [docs/Hosting.md](./Hosting.md) §6）。

### 3.2 Firebase Functions（Node）

関数のデプロイは `apps/functions` を対象に実施する。

```bash
firebase deploy --only functions
```

### 3.3 Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## 4. テスト（現状と運用）

### 4.1 Unit / Static Checks（ローカル）

ローカルでは、`scripts/local_ci.sh` が規約チェックを含めて走る前提。

### 4.2 E2E（Maestro）

E2E はローカルで `tests/run_e2e.sh` を実行する設計がある。
- [run_e2e.sh](../tests/run_e2e.sh)
- 内部で `scripts/start_expo.sh` を起動して Expo URL を抽出し、iOS Simulator で Maestro を実行する。
- Firestore の状態をリセットする処理を含む（`tests/utils/clear_firestore.sh`）。

```bash
./tests/run_e2e.sh admin_app
./tests/run_e2e.sh individual_user_app
./tests/run_e2e.sh lp_app
```

---

## 5. リリース運用（現状の手順）

本プロジェクトは「全部を一括でリリース」ではなく、対象ごとにリリース単位が分かれている。

### 5.1 リリース前チェック（推奨）

- 変更対象の切り分け（Hosting / Functions / Rules / Cloud Run）を明確にする
- Hosting の場合:
  - dist の生成ができている
  - `.well-known` が dist に含まれる（LP）
  - `firebase.json` の rewrites/headers が意図通り
- Cloud Run の場合:
  - **ローカル検証**: **Podman (Rootless)** を使用してビルドおよび動作確認が行われていること。
  - Dockerfile の build が通る前提になっている（shared の参照方法を含む）
  - Artifact Registry のリポジトリ名が正しい（workflow の `REPOSITORY`）

### 5.2 リリース手順（例）

- Cloud Run（Matching API）: GitHub Actions の workflow を push または手動で実行
- Hosting: `expo export` → `firebase deploy --only hosting:<target>`
- Functions / Rules: `firebase deploy --only ...`

---

## 6. リリース後の運用（監視/ロールバック）

### 6.1 監視（最低限）

- Cloud Run:
  - Cloud Logging（エラー率、レイテンシ）
  - リビジョンごとのトラフィック配分
- Firebase:
  - Functions のログ/エラー
  - Hosting の配信（`.well-known` が 200 + JSON か）
  - Firestore Rules の拒否ログ（必要に応じて）

### 6.2 ロールバックの考え方（最低限）

- Cloud Run:
  - 直前の安定リビジョンへトラフィックを戻す
- Hosting:
  - Firebase Hosting のリリース履歴から戻す（運用上の手順は Console / CLI に依存）
- Functions / Rules:
  - 直前のコミットへ戻して再デプロイ（ルールは特に影響が大きいので、E2E を合わせる）

---

## 7. 今後あるべき姿（現状との差分込み）

### 7.1 あるべき姿（原則）

- **PR 単位で品質ゲート**（lint/typecheck/test が通らない変更は merge させない）
- **環境分離**（少なくとも staging を持ち、production へは段階的に出す）
- **デプロイの再現性**（手元の手順に依存しない）
- **秘密情報の最小化**（GitHub Actions から GCP へは OIDC/WIF に寄せ、長期キーを廃止）
- **証跡の自動化**（何が、いつ、どこへ、誰によりデプロイされたかが追える）

### 7.2 ギャップ（現状 → あるべき姿）

| 領域 | 現状 | あるべき姿 | 差分/リスク |
| --- | --- | --- | --- |
| PR チェック | ローカル `safe_push` が中心 | GitHub Actions で PR チェック必須 | “ローカルでしか担保されない” ことによる抜け |
| Hosting デプロイ | 手動（expo export → firebase deploy） | CI で dist 生成 → Hosting deploy | 手順漏れ/人的ミス（特に `.well-known`） |
| `.well-known` 取り込み | 運用として注意喚起 | predeploy/CI で自動コピー | dist 側 404 による Passkey/連携崩壊 |
| Cloud Run 認証 | `credentials_json` を使用 | OIDC/WIF でキー無し | キー漏洩リスク、ローテ負担 |
| リリースノート | Issue 生成はある | デプロイ単位のリリース記録/タグ付け | 変更追跡・障害対応コスト |

### 7.3 推奨ロードマップ（段階導入）

1. PR チェックの自動化（最低限）
   - `scripts/local_ci.sh` 相当を GitHub Actions へ移植（Node/Jest など）
2. Hosting デプロイの自動化（LP/Admin を優先）
   - `expo export -p web` を CI で実行
   - `.well-known` を dist へ確実にコピー（predeploy で固定化）
   - `FirebaseExtended/action-hosting-deploy@v0` の導入（Preview channels を活用）
3. Cloud Run の認証方式を WIF に寄せる
   - `credentials_json` を廃止し、OIDC + Workload Identity Federation に移行
4. staging 環境の導入
   - Hosting/Functions/Cloud Run それぞれで staging を持つ（最低限 “壊して良い” 環境を作る）
5. 運用フェイズの整備
   - ロールバック手順のテンプレ化
   - 監視/アラートの閾値と通知先を定義
