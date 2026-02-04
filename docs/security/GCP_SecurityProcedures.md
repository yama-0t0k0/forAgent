# GCP Security & Migration Procedures

本ドキュメントは、2026年2月に実施したGCPセキュリティ強化およびデータ構造移行作業の手順をまとめたものである。
PJメンバーは本手順を参照し、環境構築や権限設定の監査を行うこと。

---

## 1. IAM権限の確認と最小化 (Least Privilege)

**目的**: アプリケーションやサービスアカウントに過剰な権限（`Owner` / `Editor`）が付与されていないことを保証する。

### 手順
1. GCPコンソール > **[IAMと管理]** > **[IAM]** を開く。
2. プリンシパル一覧を確認し、以下のロールが付与されているアカウントがないかチェックする。
   - **オーナー (Owner)**
   - **編集者 (Editor)**
3. 該当するアカウントがある場合、以下の「必要最小限のロール」に置き換える。
   - `Cloud Datastore User` (Cloud Datastore ユーザー)
   - `Cloud Datastore Import Export Admin` (バックアップ管理者用)
   - `Firebase Admin SDK Administrator Service Agent` (Firebase管理者用)

---

## 2. APIキーの制限 (API Key Restrictions)

**目的**: フロントエンドで使用するAPIキーの不正利用を防ぐため、利用可能なドメイン（リファラー）を制限する。

### 手順
1. GCPコンソール > **[APIとサービス]** > **[認証情報]** を開く。
2. `Browser key` または `Auto created key` 等の名称のAPIキーをクリックして編集画面へ進む。
3. **「アプリケーションの制限」** セクションで **「ウェブサイト」** を選択。
4. **「ウェブサイトの制限」** に以下のURLを追加する（ワイルドカード `/*` が必須）。
   - `https://flutter-frontend-21d0a.web.app/*`
   - `https://flutter-frontend-21d0a.firebaseapp.com/*`
   - `http://localhost:19006/*` (ローカル開発用)
5. **「APIの制限」** セクションで **「キーを制限」** を選択し、以下の必須APIを含む必要なAPIのみをチェックする。
   - Identity Toolkit API
   - Cloud Firestore API
   - Cloud Storage for Firebase API
   - Firebase Installations API
6. 保存する。

---

## 3. データ移行用サービスアカウントキーの取得

**目的**: データ構造の移行スクリプト（Admin SDK使用）を実行するための認証キーを取得する。

### 手順
1. GCPコンソール > **[IAMと管理]** > **[サービスアカウント]** を開く。
2. リストから **`firebase-adminsdk-xxxxx@...`** で始まるアカウントを選択（クリック）。
3. **「キー (KEYS)」** タブ > **「鍵を追加」** > **「新しい鍵を作成」** > **「JSON」** を選択して作成。
4. ダウンロードされたJSONファイルをリネームし、プロジェクト内の以下のパスに配置する。
   - パス: `engineer-registration-app-yama/scripts/migration/serviceAccountKey.json`
   - **注意**: このファイルは機密情報であり、GitHubにはコミットしないこと（`.gitignore` 対象）。

---

## 4. データ構造の移行実行

**目的**: セキュリティルール適用のため、データを「公開情報」と「個人情報」に分離し、権限管理フィールドを追加する。

### 実行スクリプト
以下のコマンドをプロジェクトルート (`engineer-registration-app-yama/`) で実行する。

#### 前提
```bash
npm install firebase-admin
```

#### ① 個人情報の分離 (Individual -> Public/Private)
`individual` コレクションのデータを `public_profile` (公開) と `private_info` (非公開) に分割する。

```bash
node scripts/migration/migrate_individual.js
```

#### ② ユーザー情報の拡張 (RBAC対応)
`users` コレクションに `companyId` (null) と `role` ('individual') フィールドを追加する。

```bash
node scripts/migration/migrate_users.js
```

---

## 5. 次のステップ (Next Actions)

1. **Firestore Security Rules の適用**:
   - 作成済みの `firestore.rules` をFirebaseにデプロイする。
   - デプロイコマンド: `firebase deploy --only firestore:rules`
2. **フロントエンドの実装修正**:
   - アプリ側が `public_profile` / `private_info` を参照するようにコードを修正する。
