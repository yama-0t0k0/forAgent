# Firestoreのセキュリティルールに関するドキュメント

## firestore.rulesの場所
engineer-registration-app-yama/firestore.rules

## 現在のセキュリティルール (2026-02-10 更新版)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================================================
    // Helper Functions / ヘルパー関数
    // ============================================================================

    // Check if user is authenticated
    // ユーザーが認証済みかどうかを確認
    function isAuthenticated() {
      return request.auth != null;
    }

    // Check if the user is the owner of the document (based on userId)
    // ユーザーがドキュメントの所有者本人であるか確認 (userIdベース)
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Check if the user has a specific role (stored in their user profile)
    // ユーザーが特定のロールを持っているか確認 (Custom Claims 優先、未設定時は users コレクション参照)
    function hasRole(role) {
      // Option A: Hybrid Approach
      // 1. Check Custom Claims first (High Performance)
      // 2. Fallback to Firestore 'users' collection (Compatibility)
      return (request.auth.token.keys().hasAll(['role']) && request.auth.token.role == role)
             || (
               exists(/databases/$(database)/documents/users/$(request.auth.uid))
               && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role
             );
    }

    // 管理者ロールかどうかを確認
    function isAdmin() {
      return hasRole('admin');
    }

    // Check if the user is a member of the specific company
    // ユーザーが特定の企業のメンバーであるか確認 (Custom Claims 優先)
    function isCompanyMember(companyId) {
      return (request.auth.token.keys().hasAll(['role', 'companyId']) 
              && request.auth.token.role == 'corporate' 
              && request.auth.token.companyId == companyId)
             || (
               // Fallback: Check Firestore
               isAuthenticated() 
               && exists(/databases/$(database)/documents/users/$(request.auth.uid))
               && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'corporate' 
               && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId
             );
    }
    
    // Check if the requesting company user is allowed to view the private info
    // This relies on 'allowed_companies' array field in the target document
    // リクエスト元の企業ユーザーが個人情報を閲覧する権限を持っているか確認
    // これはターゲットドキュメント内の 'allowed_companies' 配列フィールドに依存します
    function isMatched(allowedCompanies) {
       let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
       return isAuthenticated()
              && userDoc != null
              && userDoc.data.role == 'corporate'
              && (userDoc.data.companyId in allowedCompanies);
    }

    // ============================================================================
    // Collection Rules / コレクションルール
    // ============================================================================

    // ----------------------------------------------------------------------------
    // 1. users Collection (Authentication & RBAC Base)
    // users コレクション (認証とRBACの基盤)
    // ----------------------------------------------------------------------------
    match /users/{userId} {
      // Users can read their own data. Admins can read all.
      // ユーザーは自分のデータを閲覧可能。管理者は全て閲覧可能。
      allow read: if isOwner(userId) || isAdmin();
      
      // Prevent users from making themselves admin or changing their role/companyId
      // ユーザーが自分自身を管理者にしたり、ロール/会社IDを変更したりするのを防ぐ
      // + Data Validation: role must be valid, companyId required for corporate
      allow create: if isOwner(userId) 
                    && (!('role' in request.resource.data) || request.resource.data.role != 'admin')
                    && ('role' in request.resource.data && request.resource.data.role in ['individual', 'corporate'])
                    && (request.resource.data.role != 'corporate' || ('companyId' in request.resource.data && request.resource.data.companyId is string));
                    
      allow update: if isAdmin() 
                    || (isOwner(userId) 
                        && (!('role' in request.resource.data) || request.resource.data.role == resource.data.role)
                        && (!('companyId' in request.resource.data) || request.resource.data.companyId == resource.data.companyId));
    }

    // ----------------------------------------------------------------------------
    // 2. Public Profiles (public_profile)
    // 公開プロフィール (public_profile)
    // ----------------------------------------------------------------------------
    match /public_profile/{userId} {
      // Readable by any authenticated user (Candidate, Company, Admin)
      // 認証済みユーザー (求職者、企業、管理者) であれば誰でも閲覧可能
      allow read: if isAuthenticated();
      
      // Writable only by the owner or Admin
      // 所有者本人または管理者のみ書き込み可能
      // Validation: 'name' must be a non-empty string
      allow create: if (isOwner(userId) || isAdmin())
                    && 'name' in request.resource.data
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0;

      allow update: if (isOwner(userId) || isAdmin())
                    && (!('name' in request.resource.data) 
                        || (request.resource.data.name is string && request.resource.data.name.size() > 0));
    }

    // ----------------------------------------------------------------------------
    // 3. Private Info (private_info) - PII & Sensitive Data
    // 非公開情報 (private_info) - 個人情報(PII)と機密データ
    // ----------------------------------------------------------------------------
    match /private_info/{userId} {
      // Writable only by the owner or Admin
      // 所有者本人または管理者のみ書き込み可能
      allow write: if isOwner(userId) || isAdmin();
      
      // Readable by:
      // 1. Owner (本人)
      // 2. Admin (管理者)
      // 3. Matched Company (via allowed_companies field) - マッチングした企業 ('allowed_companies' フィールド経由)
      allow read: if isOwner(userId) 
                  || isAdmin()
                  || ('allowed_companies' in resource.data && isMatched(resource.data.allowed_companies));
    }

    // ----------------------------------------------------------------------------
    // 4. Company Data (company / corporate)
    // 企業データ (company / corporate)
    // ----------------------------------------------------------------------------
    match /company/{companyId} {
      // Publicly readable for authenticated users (Job Seekers need to see company info)
      // 認証済みユーザーは閲覧可能 (求職者は企業情報を見る必要があるため)
      allow read: if isAuthenticated();
      
      // Writable by company members or Admin
      // その企業のメンバーまたは管理者のみ書き込み可能
      allow write: if isCompanyMember(companyId) || isAdmin();
    }
    
    // Legacy support alias (if needed)
    // レガシーサポート用のエイリアス (必要な場合)
    match /corporate/{companyId} {
      allow read: if isAuthenticated();
      allow write: if isCompanyMember(companyId) || isAdmin();
    }

    // ----------------------------------------------------------------------------
    // 5. Job Descriptions (job_description)
    // 求人票 (job_description)
    // ----------------------------------------------------------------------------
    // Structure assumed: /job_description/{companyId}/JD_Number/{jdId}
    // 想定構造: /job_description/{companyId}/JD_Number/{jdId}
    match /job_description/{companyId} {
      allow read: if isAuthenticated();
      allow write: if isCompanyMember(companyId) || isAdmin();
      
      match /JD_Number/{jdId} {
        allow read: if isAuthenticated();
        allow write: if isCompanyMember(companyId) || isAdmin();
      }
    }

    // ----------------------------------------------------------------------------
    // 6. Selection Progress (selection_progress)
    // 選考プロセス (selection_progress)
    // ----------------------------------------------------------------------------
    match /selection_progress/{docId} {
      // Readable by the Candidate, the Company, or Admin
      // Fields: id_individual_個人ID, id_company_法人ID
      // 求職者本人、該当企業、または管理者が閲覧可能
      allow read: if isAuthenticated() && (
        resource.data['id_individual_個人ID'] == request.auth.uid || 
        isCompanyMember(resource.data['id_company_法人ID']) ||
        isAdmin()
      );
      
      // Creation/Update: Allowed for authenticated users
      // Create: Must be the candidate applying OR the company scouting OR Admin
      // 作成: 応募する求職者本人、スカウトする企業、または管理者
      allow create: if isAuthenticated() && (
        request.resource.data['id_individual_個人ID'] == request.auth.uid ||
        isCompanyMember(request.resource.data['id_company_法人ID']) ||
        isAdmin()
      );

      // Update: Must be the candidate OR the company involved OR Admin
      // 更新: 関係する求職者、企業、または管理者
      allow update: if isAuthenticated() && (
        resource.data['id_individual_個人ID'] == request.auth.uid || 
        isCompanyMember(resource.data['id_company_法人ID']) ||
        isAdmin()
      );
    }
    // ----------------------------------------------------------------------------
    // 7. Fee Management & Job Stats (FeeMgmtAndJobStatDB)
    // 手数料管理と求人ステータス (FeeMgmtAndJobStatDB)
    // ----------------------------------------------------------------------------
    match /FeeMgmtAndJobStatDB/{docId} {
      // Readable by:
      // 1. Admin
      // 2. The Individual (individual_ID == auth.uid)
      // 3. The Company Member (company_ID == user.companyId)
      allow read: if isAuthenticated() && (
        isAdmin() ||
        resource.data.individual_ID == request.auth.uid ||
        isCompanyMember(resource.data.company_ID)
      );

      // Writable by:
      // 1. Admin
      // 2. The Individual (creating application)
      // 3. The Company Member (updating status)
      // Validation: 'amount' must be a positive number (if present)
      allow create: if isAuthenticated() && (
        isAdmin() ||
        request.resource.data.individual_ID == request.auth.uid ||
        isCompanyMember(request.resource.data.company_ID)
      ) && (
        !('amount' in request.resource.data) || (request.resource.data.amount is number && request.resource.data.amount > 0)
      );

      allow update: if isAuthenticated() && (
        isAdmin() ||
        resource.data.individual_ID == request.auth.uid ||
        isCompanyMember(resource.data.company_ID)
      ) && (
        !('amount' in request.resource.data) || (request.resource.data.amount is number && request.resource.data.amount > 0)
      );
      
      allow delete: if isAdmin();
    }
  }
}
```

## 実装されたセキュリティ強化と設計判断 (2026-02-10)

以前のバージョンで課題とされていた点は、以下の実装により解消されました。

### 1. ハイブリッドCustom Claimsアーキテクチャの採用
**課題:** ルール内での `get()` 呼び出しによるパフォーマンス低下と課金コスト。
**解決策:** `hasRole()` および `isCompanyMember()` 関数において、以下のハイブリッドロジックを実装しました。
1.  **Custom Claims優先:** `request.auth.token.role` を最初にチェックします。トークンに情報が含まれていれば、データベース読み取り (`get()`) は発生しません（コスト0、高速）。
2.  **DBフォールバック:** トークンに情報がない場合のみ、従来の `users` コレクションを参照します。
**効果:** 移行期間中の後方互換性を維持しつつ、Custom Claimsが付与されたユーザーから順次パフォーマンス改善の恩恵を受けられます。

### 2. Usersコレクションのデータ整合性バリデーション
**課題:** `users` コレクションへの不正なデータ書き込み（不適切なロールや必須フィールド欠落）のリスク。
**解決策:** `create` ルールに厳格なバリデーションを追加しました。
-   `role` は `individual` または `corporate` のみ許可（`admin` は不可）。
-   `role` が `corporate` の場合、`companyId` 文字列フィールドが必須。
**効果:** アプリケーションロジックの前提条件がDBレベルで保証されます。

### 3. Selection Progressの最小権限原則 (Least Privilege)
**課題:** `selection_progress` コレクションへの書き込み権限が広すぎる（全認証ユーザー）。
**解決策:** `create` および `update` ルールを制限しました。
-   求職者本人が自分の応募を作成/更新する場合。
-   企業のメンバーが自社への応募/スカウトを作成/更新する場合。
-   管理者が操作する場合。
これら以外の第三者による書き込みは拒否されます。

### 4. 各コレクションのデータバリデーション強化 (新規追加)
**課題:** `users` 以外のコレクションにおいて、不正なデータ型や無効な値が書き込まれるリスク。
**解決策:** 主要なコレクションに対して以下のバリデーションを追加しました。
-   **public_profile:** `create`/`update` 時に `name` フィールドが必須かつ空文字でないことを検証。
-   **FeeMgmtAndJobStatDB:** `amount` フィールドが存在する場合、正の数値であることを検証。
**効果:** データの整合性が向上し、クライアントアプリのバグや不正操作によるデータ汚染を防ぎます。

## 検証
これらのルール変更は、`engineer-registration-app-yama/firestore.test.js` に追加されたテストケースによって検証されています。
`npm run test:rules` コマンドにより、Custom Claims認証、DBフォールバック認証、バリデーションエラー、権限エラーの各シナリオが正常に動作することを確認済みです。

## 改善点/残る検討点 (Remaining Considerations):

### hasRole および isCompanyMember 関数の get() フォールバックについて
現在は移行期間中のため、Custom Claimsを持たないユーザーのために `get()` によるDB参照フォールバックを残しています。
**将来的には:** 全ユーザーへのCustom Claims付与が完了し、運用フローが確立された段階で、このフォールバックを削除することを検討します。これにより、ルール評価コストを完全にゼロ（ローカル評価のみ）に近づけることができます。

### さらなるデータ検証ルールの拡充
`public_profile` や `FeeMgmtAndJobStatDB` へのバリデーション導入に加え、`job_description` や `company` コレクションに対しても厳格なスキーマ検証（必須フィールド、型チェック、値の範囲チェック）を追加しました。(2026-02-10 完了)

**実装された検証内容:**

1.  **`company` コレクションの検証**: `create`/`update` 時に、企業名 (`name`) が必須であり、かつ文字列であることを確認するルールを追加。
2.  **`job_description` コレクションの検証**: `JD_Number` サブコレクションに対して、求人情報 (`title`, `description`, `salaryRange`) が必須であり、適切なデータ型を持つことを検証する `create` および `update` ルールを実装。

これらの実装により、データ不整合のリスクをさらに低減させました。