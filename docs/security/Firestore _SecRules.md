# Firestoreのセキュリティルールに関するドキュメント

## firestore.rulesの場所
engineer-registration-app-yama/firestore.rules

## 現在のセキュリティルール

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
    // ユーザーが特定のロールを持っているか確認 (ユーザープロファイルに基づく)
    function hasRole(role) {
      // Note: This requires a read. For high-traffic, Custom Claims are recommended.
      // Current implementation relies on 'users' collection lookup.
      // 注: これには読み取り操作が必要です。高トラフィックの場合はCustom Claimsの使用を推奨します。
      // 現在の実装は 'users' コレクションの参照に依存しています。
      return isAuthenticated() 
             && exists(/databases/$(database)/documents/users/$(request.auth.uid))
             && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // 管理者ロールかどうかを確認
    function isAdmin() {
      return hasRole('admin');
    }

    // Check if the user is a member of the specific company
    // ユーザーが特定の企業のメンバーであるか確認
    function isCompanyMember(companyId) {
      // Note: Safe navigation for optional fields isn't fully supported in rules, 
      // but we assume schema consistency (role and companyId exist if role is corporate)
      // 注: ルールではオプショナルフィールドの安全なナビゲーションは完全にはサポートされていませんが、
      // スキーマの一貫性 (roleがcorporateならcompanyIdが存在する) を前提としています。
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return isAuthenticated() 
             && userDoc != null
             && userDoc.data.role == 'corporate' 
             && userDoc.data.companyId == companyId;
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
      allow create: if isOwner(userId) 
                    && (!('role' in request.resource.data) || request.resource.data.role != 'admin');
                    
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
      allow write: if isOwner(userId) || isAdmin();
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
      // TODO: Refine this to ensure only valid applications/scouts can be created
      // 作成/更新: 認証済みユーザーに許可
      // TODO: 有効な応募/スカウトのみ作成できるように制限を強化する
      allow write: if isAuthenticated();
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
      allow create: if isAuthenticated() && (
        isAdmin() ||
        request.resource.data.individual_ID == request.auth.uid ||
        isCompanyMember(request.resource.data.company_ID)
      );

      allow update: if isAuthenticated() && (
        isAdmin() ||
        resource.data.individual_ID == request.auth.uid ||
        isCompanyMember(resource.data.company_ID)
      );
      
      allow delete: if isAdmin();
    }
  }
}


## セキュリティルールの課題

現在のFirestoreルールは、明確な構造と意図を持ち、一部は堅牢なアクセス制御を実現していますが、 プロダクションレベルの要件を満たすにはいくつかの重要な改善点があります。
以下に主な評価ポイントをまとめます。

### 良い点 (Strengths):

Helper関数の活用: isAuthenticated() , isOwner() , hasRole() , isAdmin() , isCompanyMember() , isMatched() といったヘルパー関数を定義しており、ルールの可読性と再利用性が非常に高いです。これは複雑なロジックを管理する上で非常に効果的です。

ロールベースのアクセス制御 (RBAC) の試み: hasRole や isAdmin といった関数を通じて、ユーザーの役割に基づいたアクセス制御を実装しようとしています。

所有者ベースのアクセス制御: 多くのコレクションで isOwner(userId) を利用し、データ所有者のみが特定の操作を行えるように設計されています。

権限昇格の防止: users コレクションの create および update ルールでは、ユーザー自身が admin ロールを設定したり、既存の role や companyId を変更したりするのを防ぐロジックが含まれており、これはセキュリティ上非常に重要です。

機密データ ( private_info ) への詳細なアクセス制御: オーナー、管理者、そして allowed_companies に基づくマッチング企業のみが読み取れるように設計されており、P.I.I. (個人識別情報) などの機密データの保護に配慮しています。

### 改善が必要な点 (Areas for Improvement for Production):

ルール内での get() 呼び出しのパフォーマンスとコスト:
hasRole() , isAdmin() , isCompanyMember() , isMatched() の各ヘルパー関数が、ユーザーのロールや企業情報を取得するために get(/databases/$(database)/documents/users/$(request.auth.uid)) を使用しています。

問題点: 
Firestoreルール内で get() を呼び出すと、ルールの評価ごとにデータベースへの読み取り操作が発生します。
これは、特に高トラフィックなアプリケーションでは、パフォーマンスの低下や不必要な読み取りコストの増加につながる可能性があります。

プロダクションでの推奨: 
ユーザーの役割や所属企業などの認証に頻繁に利用する情報は、Firebase Authenticationの カスタムクレーム (Custom Claims) として保存し、 request.auth.token.role のようにルール内で直接参照することが推奨されます。これにより、ルールの評価が高速化され、コストも最適化されます。

selection_progress コレクションの書き込み権限が広すぎる:

allow write: if isAuthenticated(); の行があり、コメントに「TODO: 有効な応募/スカウトのみ作成できるように制限を強化する」と明記されています。

問題点: 現在のルールでは、認証されたユーザーであれば誰でも selection_progress に書き込むことができてしまいます。これはプロダクション環境では重大なセキュリティホールとなり得ます。悪意のあるユーザーが大量の無効なデータを書き込んだり、既存のデータを改ざんしたりする可能性があります。

プロダクションでの推奨: TODO にある通り、特定の条件（例: 応募者本人か、関連する企業メンバーか、管理者かなど）を満たす場合にのみ書き込みを許可するよう、ルールを詳細化する必要があります。
データ検証ルールの不足:
現在のルールは主に「誰が何をできるか」というアクセス制御に焦点を当てています。

問題点: ドキュメントの作成 ( create ) や更新 ( update ) 時に、書き込まれるデータの形式、必須フィールドの存在、データ型、値の範囲などを検証するルール（例: request.resource.data.fieldName == 'expectedValue' や request.resource.data.keys().hasAll(['field1', 'field2']) など）がほとんど見られません。

プロダクションでの推奨: データの一貫性と整合性を保つため、各コレクションの create および update 操作に対して、スキーマ検証やビジネスロジックに基づくデータ検証ルールを追加することが不可欠です。

### 結論:
現在のFirestoreルールは、その構造と意図において素晴らしい基盤を持っています。しかし、特に ルール内での get() 呼び出しの最適化（カスタムクレームへの移行） と、 selection_progress コレクションの書き込み権限の厳格化 は、プロダクションレベルのセキュリティとパフォーマンス要件を満たすために最優先で取り組むべき課題です。
また、各書き込み操作に対するデータ検証を追加することで、アプリケーション全体の堅牢性が大幅に向上します。

### 詳細を深掘りするために、以下の質問をご検討ください。
hasRole や isCompanyMember の関数で使用している get() 呼び出しを、Firebase Authenticationのカスタムクレームに移行するにはどうすればよいですか？
selection_progress コレクションの TODO となっている書き込み権限を、よりセキュアなプロダクションレベルにするための具体的なルール例を教えてください。
users コレクションのドキュメントが作成または更新される際に、特定のフィールド（例： email や displayName ）が必須であることや、特定の形式を満たしていることを検証するデータ検証ルールはどのように書けばよいですか？