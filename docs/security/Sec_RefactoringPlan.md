# Firestore Security & Data Structure Refactoring Plan

## 1. 概要
本ドキュメントは、Firestoreのセキュリティ強化およびデータアクセス制御の適正化に向けたリファクタリング計画を定義する。
ユーザーの属性（管理者、個人、法人）および関係性（マッチング成立有無、企業所属）に基づいた厳密なアクセス権限を実装する。
また、アプリケーション層からインフラ層までの各レイヤーにおける包括的なセキュリティ対策についても定義する。

**GitHub Milestone:** [Security Refactoring & Access Control (Milestone 12)](https://github.com/yama-0t0k0/engineer-registration-app/milestone/12)


## 2. レイヤー別セキュリティ対策方針

### A. アプリケーション層 (Frontend / Client)
- **入力バリデーション**: UI側での形式チェックに加え、ライブラリ（Zod等）を用いた厳格なスキーマ検証を行い、不正なデータの送信を防ぐ。
- **機密情報の排除**: APIキー（公開可能なものを除く）、Service Account Key、環境変数のシークレットをクライアントバンドルに含めない。
- **XSS対策**: React/Expoの標準エスケープ機能を活用し、ユーザー入力の直接的なHTMLレンダリングを禁止する。
- **認証トークン管理**: Firebase Authのトークン管理機構を利用し、手動でのLocalStorageへの保存（XSS脆弱性リスク）を避ける。
- **エラーハンドリング**: スタックトレースや内部構造に関する情報をユーザーに表示しない。

### B. バックエンド層 (Backend / Firebase)
- **認証・認可 (Authentication & Authorization)**:
    - **Firestore Security Rules**: デフォルト拒否（`allow read, write: if false;`）を基本とし、必要なパスのみ明示的に許可するホワイトリスト方式を採用。
    - **Firebase Authentication**: メール認証、ソーシャルログイン等の堅牢な認証基盤を利用。
- **サーバーサイドバリデーション**:
    - **Cloud Functions**: クライアントからの入力を信頼せず、関数内でも再度型チェックと権限検証を行う。
- **データ分離**: 機密情報（連絡先等）と公開情報（スキル等）を物理的にコレクション/ドキュメントレベルで分離し、読み取り権限を制御しやすくする。

### C. ミドルウェア層 (Network / API)
- **通信の暗号化**: 全ての通信（HTTPS/TLS）を強制する（Firebase Hosting / Cloud Functionsの標準機能）。
- **CORS設定**: Cloud Functions等のAPIエンドポイントにおいて、許可されたドメイン（自社アプリのホスティングURL等）からのリクエストのみを受け付ける設定を行う。
- **App Check (導入検討)**: 未認可のアプリや不正なクライアントからのAPIアクセスを遮断するため、Firebase App Checkの導入をロードマップに含める。

### D. インフラ層 (Infrastructure / GCP)
- **アクセス制御 (IAM)**:
    - **最小権限の原則 (Least Privilege)**: 開発者・運用者に対し、業務に必要な最小限のGCP/Firebase権限のみを付与する。
        - *Checklist*: Service Accountには `Cloud Datastore User` 等の必要最小限のロールのみを付与し、`Project Owner/Editor` は避ける。
    - **Service Account管理**: CI/CDパイプライン等で使用するサービスアカウントのキーローテーションと権限管理を徹底する。
- **APIキーの制限**: GCPコンソールにて、使用するAPIキーに対し、HTTPリファラー（Web）やバンドルID（App）による利用制限を設定する。
    - *Checklist*: Web API Keyには `https://your-domain.web.app/*` 等のリファラー制限を設定済みか確認する。
- **監査とモニタリング**: Cloud Loggingを活用し、セキュリティルール違反の試行や異常なアクセスパターンを監視する。

## 3. Firestoreデータ構造・権限設計詳細

### 基本原則
- **アプリケーション側**: UI制御により、権限のないデータへのリクエスト自体を行わない（利便性・UX）。
- **Firestore Security Rules側**: リクエスト元の属性とターゲットデータの関係性を検証し、不正アクセスを確実にブロックする（安全性）。

### コレクション別アクセスポリシー

#### A. FeeMgmtAndJobStatDB (手数料・統計)
- **閲覧**:
    - 管理者: 全データ閲覧可
    - 法人ユーザー: **自社に関連するデータのみ**閲覧可 (`companyId` 一致)
- **編集**:
    - 管理者: 全データ編集可
    - 法人ユーザー: **自社に関連するデータのみ**編集可
- **実装要件**:
    - ドキュメントに `companyId` フィールドを必須とする。
    - Security Rulesで `request.auth.token.companyId == resource.data.companyId` を検証。

#### B. individual (エンジニア個人情報)
- **データ構造の分離**:
    - 個人情報を以下の2つに物理的に分離する（ドキュメント単位の制御のため）。
    1.  **`public_profile` (公開プロフィール)**: スキル、経歴、ハンドルネームなど。
    2.  **`private_info` (非公開情報)**: 氏名、連絡先（メール、電話番号）など。
- **閲覧権限**:
    - `public_profile`: 全ユーザー（認証済み）が閲覧可。
    - `private_info`:
        - 本人: 閲覧可
        - 管理者: 閲覧可
        - **マッチング成立済みの相手**: 閲覧可
- **編集権限**:
    - 本人および管理者のみ。
- **実装要件**:
    - Security Rulesにて、`private_info` へのアクセス時に「リクエスト元ユーザーと対象ユーザーのマッチング成立」を検証するロジック（`isConnected` フラグや `matches` コレクションの参照など）を組み込む。

#### C. Users (ユーザー管理・権限)
- **スキーマ拡張**:
    - 法人ユーザー向けに、以下のフィールドを追加する。
        - `companyId`: 所属企業のID
        - `role`: 企業内での役割
- **Role定義**:
    1.  **`employee` (従業員)**:
        - 閲覧のみ（自社情報、JDなど）。編集権限なし。
    2.  **`recruiter` (採用関係者)**:
        - 企業情報 (`corporate`) および求人票 (`job_description`) の編集が可能。
    3.  **`admin` / `manager` (採用責任者)**:
        - 上記に加え、「内定」ステータスへの変更など、重要な意思決定アクションが可能。

#### D. corporate / job_description (企業情報・求人票)
- **閲覧**: 全ユーザー（認証済み）が閲覧可。
- **編集**:
    - 管理者: 全データ編集可
    - 法人ユーザー:
        - **自社データのみ** (`companyId` 一致)
        - かつ、Roleが `recruiter` または `admin` であること。

## 4. 実装ステップ

1.  **IAM & API Key Security Check** [Issue #287](https://github.com/yama-0t0k0/engineer-registration-app/issues/287)
    - [x] Service Accountの権限棚卸し（最小権限の原則適用）。
    - [x] API Keyのリファラー制限/IP制限の設定確認。
    - [x] クレデンシャル（`serviceAccountKey.json`）のGit履歴からの削除 [Issue #294](https://github.com/yama-0t0k0/engineer-registration-app/issues/294)。

2.  **データ構造の移行 (Schema Migration)** [Issue #288](https://github.com/yama-0t0k0/engineer-registration-app/issues/288)
    - [x] `individual` コレクションを `public_profile` / `private_info` 構成へ分離・移行スクリプト作成。
    - [x] `users` コレクションへの `companyId`, `role` フィールド追加とデータバックフィル。


    ### データマッピング定義 (Data Mapping Definition)
    
    | Category | Field (Actual Data Structure) | Source (`individual`) | Target Public (`public_profile`) | Target Private (`private_info`) | Note |
    | :--- | :--- | :--- | :--- | :--- | :--- |
    | **氏名** | `基本情報.姓`, `基本情報.名` | ✅ | ❌ Remove | ✅ Move | PII |
    | **メール** | `基本情報.メール` | ✅ | ❌ Remove | ✅ Move | PII |
    | **電話番号** | `基本情報.TEL` | ✅ | ❌ Remove | ✅ Move | PII |
    | **住所** | `基本情報.住所` | ✅ | ❌ Remove | ✅ Move | PII |
    | **生年月日** | `基本情報.生年月日` | ✅ | ❌ Remove | ✅ Move | PII |
    | **経歴** | `職歴` | ✅ | ✅ Keep | - | Public |
    | **スキル** | `スキル経験` | ✅ | ✅ Keep | - | Public |

3.  **Security Rules の実装** [Issue #289](https://github.com/yama-0t0k0/engineer-registration-app/issues/289), [#297](https://github.com/yama-0t0k0/engineer-registration-app/issues/297)
    - [x] `firestore.rules` の書き換え。
    - [x] 各コレクションごとの `match` ブロックと `allow` 条件の詳細定義。
    - [x] カスタム関数（`isCompanyAdmin()`, `isMatched()` 等）の定義。
    - *Note: `isMatched()` logic relies on `allowed_companies` field in `private_info`, which must be populated in Step 4.*

4.  **クライアントアプリ (Frontend) の改修** [Issue #290](https://github.com/yama-0t0k0/engineer-registration-app/issues/290)
    - [x] データ取得ロジックの修正（`private_info` はマッチング成立時のみ取得するように分岐）。
      - `FirestoreDataService.js` にて実装済み。`fetchIndividualById` 等で `private_info` 取得失敗時（権限不足）は無視して `public_profile` のみ返す仕様。
    - [x] ユーザー情報の更新画面（Profile Edit）の修正（分離されたコレクションへの書き込み）。
      - [x] テキスト情報更新 (`GenericRegistrationScreen`): `AppNavigator.js` にて `customSaveLogic` を適用し、`User.splitData` で分離保存するよう実装済み。
      - [x] 画像情報更新 (`GenericImageEditScreen`): `IndividualImageEditScreen.js` に `customSaveLogic` を実装し、`User.splitData` を用いて `public_profile` と `private_info` に適切に分離保存するよう改修済み。
    - [x] 管理画面 (Admin App) の表示ロジック修正。
      - `UserDetailModal.js` および `AdminAppWrapper` にて `customSaveLogic` を適用済み。
      - `IndividualProfileScreen` は `User` モデルを通じて統合されたデータを表示するため、Admin権限があれば自動的にPrivate情報も表示される（実装変更不要）。

    #### 画像編集・保存処理のビフォーアフター比較 (Profile Image Update Flow)
    
    | Category | Item | Before Refactoring (Risk State) | After Refactoring (Secure State) | Note |
    | :--- | :--- | :--- | :--- | :--- |
    | **Component** | **Target Component** | `GenericImageEditScreen` (Direct Use) | `IndividualImageEditScreen` (Wrapper) | Wrapper injects logic |
    | **Logic** | **Save Strategy** | Direct `setDoc` to collection | `customSaveLogic` callback | Logic injection pattern |
    | **Data Flow** | **Data Handling** | `DataContext` (Public+Private) → `public_profile` | `User.splitData(data)` → Split Save | **Critical Security Fix** |
    | **Storage** | **Destination** | ❌ `public_profile` (Mixed Data) | ✅ `public_profile` (Public) <br> ✅ `private_info` (Private) | Correct separation |
    | **Risk** | **PII Exposure** | ⚠️ **High** (Private info exposed) | 🔒 **None** (PII isolated) | PII = Name, Email, Tel, etc. |

5.  **検証 (Verification)** [Issue #291](https://github.com/yama-0t0k0/engineer-registration-app/issues/291)
    - [x] Firestore Emulator を用いたユニットテスト。
        - *Status*: `firestore.test.js` 作成済み。
    - [x] アプリケーション結合テスト（E2E）。各ロール（管理者、個人）でのアクセス権限確認テスト。
        - *Status*: E2E実行・レポート基盤（`tests/run_e2e.sh`）構築完了。
        - *Scenarios*:
            - Admin: `tests/jobs/security_verification_admin.yaml` (Public/Private情報へのアクセス確認)
            - Individual: `tests/jobs/security_verification_individual.yaml` (自身のPublic/Private情報へのアクセス確認)
        - *Pending*: 法人ロールの検証シナリオ。


## 5. 備考
- 本計画は `FMJS` (Fee Management Job System) と共通のポリシーとして適用する。
- 今後の機能追加時も、この「ドキュメント分離」と「Roleベース制御」の原則を遵守する。
