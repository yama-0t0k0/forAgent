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
- **MiniHeatmap.js**: スキルや稼働状況を可視化するための小型ヒートマップコンポーネント。

#### 3. Theme (`theme/theme.js`)
- アプリ全体で統一された色定義 (`THEME`) を提供。
- 例: `background`, `cardBg`, `accent` (#0EA5E9)

#### 4. Firebase (`firebaseConfig.js`)
- Firebase SDKの初期化と `Firestore` インスタンス (`db`) のエクスポート。
- 環境変数 (`EXPO_PUBLIC_FIREBASE_*`) を使用。

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

#### Engineer (`features/engineer`)
- **EngineerListItem.js**: エンジニア一覧表示用のリストアイテム。スキルタグやヒートマップを表示。

#### Job (`features/job`)
- **JobListItem.js**: 求人一覧表示用のリストアイテム。募集要項やヒートマップを表示。

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
   - UIコンポーネントは `shared/common_frontend` に配置し、各アプリからインポートして使用する。
   - 状態管理は `DataContext` を通じて行うことを基本とする。

2. **Backend/Logic**:
   - データモデルの変更は `domain_models` で行い、必要に応じて `build_runner` でコード生成を実行する。
   - コマンド: `dart run build_runner build`
