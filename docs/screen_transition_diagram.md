# 画面遷移図 (Screen Transition Diagrams)

本ドキュメントでは、プロジェクト内の5つの主要サービスの画面遷移フローを定義します。

## 1. 個人ユーザー向けアプリ (individual_user_app)

エンジニアが自身のプロフィールを管理・閲覧するためのアプリケーション。

```mermaid
graph TD
    MyPage[マイページ (MyPageScreen)] -->|編集| Registration[プロフィール編集 (GenericRegistrationScreen)]
    MyPage -->|画像タップ| ImageEdit[画像編集 (ImageEditScreen)]
    MyPage -->|メニュー| Menu[メニュー (MenuScreen)]
    Registration -->|保存/キャンセル| MyPage
    ImageEdit -->|保存/キャンセル| MyPage
    Menu -->|閉じる| MyPage
```

## 2. 企業ユーザー向けアプリ (corporate_user_app)

企業が自社の情報を発信し、求職者へのアピールを行うためのアプリケーション。

```mermaid
graph TD
    CompanyPage[企業トップ (CompanyPageScreen)] -->|編集| Registration[企業情報編集 (GenericRegistrationScreen)]
    CompanyPage -->|画像タップ| ImageEdit[画像編集 (ImageEditScreen)]
    CompanyPage -->|メニュー| Menu[メニュー (MenuScreen)]
    CompanyPage -->|技術スタック| TechStack[技術スタック詳細 (TechStackScreen)]
    
    CompanyPage -->|求人| Jobs[求人一覧 (UnderConstruction)]
    CompanyPage -->|つながり| Connections[つながり (UnderConstruction)]
    CompanyPage -->|ブログ| Blog[ブログ (UnderConstruction)]
    CompanyPage -->|イベント| Events[イベント (UnderConstruction)]

    Registration -->|保存/キャンセル| CompanyPage
    ImageEdit -->|保存/キャンセル| CompanyPage
    Menu -->|閉じる| CompanyPage
    TechStack -->|戻る| CompanyPage
```

## 3. 管理者向けアプリ (admin_app)

プラットフォーム全体の状況を把握・管理するためのダッシュボード。
現在は単一画面で構成されています。

```mermaid
graph TD
    Dashboard[管理ダッシュボード (DashboardScreen)]
    subgraph Dashboard Features
        Stats[KPI統計]
        Charts[各種グラフ]
        UserList[ユーザーリスト]
    end
    Dashboard --- Stats
    Dashboard --- Charts
    Dashboard --- UserList
```

## 4. 求人詳細アプリ (job_description)

求人票（Job Description）の閲覧・編集を行うためのアプリケーション。

```mermaid
graph TD
    JD[求人詳細 (JobDescriptionScreen)] -->|編集| Edit[求人編集 (GenericRegistrationScreen)]
    Edit -->|保存/キャンセル| JD
```

## 5. 選考管理アプリ (fmjs)

選考プロセス（Selection Flow）の進捗管理を行うためのアプリケーション。
現在は単一画面で構成されています。

```mermaid
graph TD
    List[選考進捗リスト (SelectionProgressListScreen)]
    subgraph List Features
        Kanban[カンバン/リスト表示]
        Filter[フィルタリング]
        DetailModal[詳細モーダル]
    end
    List --- Kanban
    List --- Filter
    List --- DetailModal
```

## 凡例

- **GenericRegistrationScreen**: 共通コンポーネントとして実装された、汎用的な登録・編集画面。JSONテンプレートに基づき動的にフォームを生成します。
- **UnderConstruction**: 現在開発中、または将来実装予定の画面。
