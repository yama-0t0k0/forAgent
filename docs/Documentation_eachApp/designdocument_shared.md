# 共有モジュール（shared）設計概要

プロジェクト全体で再利用されるフロントエンドおよびバックエンド（Dart）の共通コードベースです。

## ディレクトリ構造

```
shared/
├── common_frontend/     # Expo (React Native) アプリ向け共有コンポーネント・ロジック
│   ├── src/
│   │   ├── core/        # 基本機能 (UI, State, Theme, Firebase)
│   │   └── features/    # 機能別モジュール (Registration, Profile)
│   └── package.json
├── common_backend/      # Dartバックエンド向け共有ロジック
├── common_logic/        # プラットフォーム非依存の共通ロジック (Dart)
├── domain_logic/        # ドメイン特化ロジック (ヒートマップ計算など)
└── domain_models/       # ドメインエンティティ定義 (Dart)
```

---

## Common Frontend (Expo/React Native)

各Expoアプリ (`individual_user_app`, `corporate_user_app` 等) で利用されるReact Nativeコンポーネントとロジックです。

### Core Modules (`src/core`)

#### 1. State Management (`state/DataContext.js`)
- **概要**: アプリケーション全体の初期データと更新ロジックを提供します。
- **機能**:
  - `initialData` を受け取り、React Contextで配信
  - `updateValue(path, newValue)` による深い階層のデータ更新
- **利用例**:
  ```javascript
  const { data, updateValue } = useContext(DataContext);
  updateValue(['基本情報', '氏名'], '山田 太郎');
  ```

#### 2. UI Components (`components/`)
- **RecursiveField.js**: JSONデータ構造に基づき、再帰的に入力フォームを生成する中核コンポーネント。
- **GlassCard.js**: すりガラス効果を持つカードUI。
- **InputRow.js / StatusRow.js**: 標準的な入力行コンポーネント。
- **GenericSearchBar.js**: 検索ボックスとクイックフィルター（チップ）を備えた汎用検索コンポーネント。
- **GenericDataList.js**: データ一覧を表示するためのFlatListラッパー。空の状態（Empty State）のハンドリングを含む。
- **MiniHeatmap.js / HeatmapGrid.js**: スキルや稼働状況を可視化するためのヒートマップコンポーネント。スコア計算ロジックとジオメトリ計算は `src/core/utils` 配下の共通ロジック（HeatmapCalculator / HeatmapGeometry / HeatmapMapper）を利用し、Individual/Job/Admin の各アプリで共通動作するように設計。

#### 3. Theme (`theme/theme.js`)
- アプリ全体で統一された色定義 (`THEME`) を提供。
- 例: `background`, `cardBg`, `accent` (#0EA5E9)

#### 4. Firebase (`firebaseConfig.js`)
- Firebase SDKの初期化と `Firestore` インスタンス (`db`) のエクスポート。
- 環境変数 (`EXPO_PUBLIC_FIREBASE_*`) を使用。

#### 5. Services (`services/FirestoreDataService.js`)
- **概要**: Firestoreデータ取得ロジックを一元化した共通サービス。生データではなく、**モデルインスタンス**（`User`, `JobDescription`, `Company` 等）を直接返却します。
- **機能**:
  - `fetchAllIndividuals()`: 全個人ユーザー取得（戻り値: `Promise<User[]>`）。`public_profile` コレクションから取得し、権限があれば `private_info` も結合します。
  - `fetchIndividualById(id)`: 単一ユーザー取得（戻り値: `Promise<User|null>`）。`public_profile` と `private_info` を取得し、`User.fromPublicPrivate` で結合して返します。
  - `fetchAllJobDescriptions()`: 全JD取得（ネスト構造対応, 戻り値: `Promise<JobDescription[]>`）
  - `fetchAllCorporates()`: 全企業取得（複数コレクション名対応, 戻り値: `Promise<Company[]>`）
  - `fetchAdminData()`: Admin App用一括取得（各プロパティもモデルインスタンス化済み）
  - `fetchIndividualAppData(userId, template)`: Individual App用データ取得
  - `fetchCorporateAppData(id, template)`: Corporate App用データ取得
- **利用例**:
  ```javascript
  import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
  const users = await FirestoreDataService.fetchAllIndividuals();
  // users[0] is instanceof User (Merged public + private data)
  console.log(users[0].fullNameKanji); 
  ```

#### 6. Models (`src/core/models`)
- **概要**: アプリケーション全体で使用されるデータモデル定義。
- **主要クラス**:
  - `User`: 個人ユーザー（エンジニア）。`public_profile`（公開情報）と `private_info`（PII）の分割管理に対応。
  - `Company`: 法人ユーザー
  - `JobDescription`: 求人票
  - `SelectionProgress`: 選考進捗・手数料
- **設計方針**:
  - `fromFirestore` / `fromPublicPrivate` ファクトリメソッドによるインスタンス化
  - ゲッターによるデータアクセスのカプセル化
  - `rawData` プロパティによる後方互換性の維持

#### 7. Constants (`src/core/constants`)
- **概要**: アプリケーション全体で使用される定数定義。マジックナンバー/文字列の排除と、設定の一元管理を目的とします。
- **主要ファイル**:
  - `system.js`: システム全般の設定（プラットフォームID、データ型、HTTPステータスなど）
  - `ui.js`: UI関連の定数（タブ設定、テーマキーなど）
  - `field.js`: 入力フィールドの設定（ラベル、バリデーションルール、選択肢など）
  - `selection.js`: 選考フローのステータス定義、レーン定義
  - `heatmap.js`: ヒートマップの重み付け、計算パラメータ
- **利用方針**:
  - ハードコードされた文字列や数値は使用せず、必ずこれらの定数をインポートして使用する。
  - 各アプリ固有の定数は、各アプリ内の `src/core/constants` に配置し、sharedの定数とは分離する。

### Feature Modules (`src/features`)

#### Registration (`features/registration/GenericRegistrationScreen.js`)
- **概要**: 汎用的なプロフィール登録・編集画面。
- **機能**:
  - Firestoreへのデータ保存（`setDoc`）
  - ID自動採番ロジック（`Prefix` + `YYYYMMDD` + 連番）
  - タブによるカテゴリ切り替え表示
- **パラメータ**:
  - `collectionName`: 保存先コレクション（例: `engineer`）
  - `idPrefixChar`: ID接頭辞（例: `C`）

#### Analytics (`features/analytics`)
- **HeatmapGrid.js / MiniHeatmap.js**: スキルや稼働状況を可視化するためのヒートマップコンポーネント。
- **TechStackView.js**: 技術スタックの視覚化コンポーネント。
- **utils/**: `HeatmapCalculator`, `HeatmapGeometry`, `HeatmapMapper` などの計算ロジックを含む。

#### Job Profile (`features/job_profile`)
- **JobDescriptionContent.js**: 求人詳細情報の統一表示コンポーネント。AdminアプリとJobアプリで共通利用される。
- **JobDescriptionScreen.js**: 求人詳細画面のコンテナ。

#### Profile (`features/profile`)
- **GenericMenuScreen.js**: 各アプリのメニュー画面の基底コンポーネント。
- **IndividualProfileScreen.js**: 個人ユーザー向けプロフィール画面。
- **ImageEditScreen.js**: 画像編集・アップロード機能（Corporate/Individual/Generic）。

#### Selection (`features/selection`)
- **SelectionFlowEditor.js**: 選考プロセスの進捗管理・編集コンポーネント。フェーズごとのステータス管理や日付設定を行う。

#### Engineer (`features/engineer`)
- **EngineerListItem.js**: エンジニア一覧表示用のリストアイテム。スキルタグやヒートマップを表示。

#### Job (`features/job`)
- **JobListItem.js**: 求人一覧表示用のリストアイテム。募集要項やヒートマップを表示。

#### Company (`features/company`)
- **CompanyListItem.js**: 法人一覧表示用のリストアイテム。使用技術スタック（Main）のバッジを表示。
- **CompanyProfileView.js**: 法人プロフィール表示コンポーネント。

---

## Domain Modules (Dart)

Flutter/Dartバックエンドやロジック共有のためのパッケージ群です。

### Domain Models (`domain_models`)
- **概要**: エンティティクラスの定義。
- **主要クラス**:
  - `EngineerProfile`: エンジニアの基本情報（ID, 氏名, メール等）。`Equatable` と `JsonSerializable` を実装。

### Domain Logic (`domain_logic`)
- **概要**: ドメイン固有の計算ロジック。
- **例**: `heatmap_engine` (ヒートマップ計算ロジック)

### Common Backend (`common_backend`)
- バックエンドサービスで共通利用されるインフラ層やサービス層の実装。

---

## 開発ガイドライン

1. **Frontend**:
   - **コーディング規約の遵守**: `docs/CodingConventions_JS.md` に従い、JSDocの記述、マジックナンバーの排除（定数化）、厳格な変数初期化を徹底してください。
   - **パスエイリアスの利用**: 相対パス（`../../../`）の使用を避け、`babel.config.js` / `jsconfig.json` で定義されたエイリアス（`@core`, `@features`, `@shared` 等）を使用してください。
   - **モデル利用の徹底**: `FirestoreDataService` から取得したデータは既にモデルインスタンス化されています。UI層で再変換せず、そのままモデルのプロパティやメソッドを利用してください。
   - UIコンポーネントは `shared/common_frontend` に配置し、各アプリからインポートして使用する。
   - 状態管理は `DataContext` を通じて行うことを基本とする。
   - **定数の活用**: 文字列や数値リテラルを直接コードに記述せず、`src/core/constants` 配下の定数ファイルを使用してください。

2. **Backend/Logic**:
   - データモデルの変更は `domain_models` で行い、必要に応じて `build_runner` でコード生成を実行する。
   - コマンド: `dart run build_runner build`
