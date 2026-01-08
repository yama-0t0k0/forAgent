# 法人ユーザーアプリ（corporate_user_app）設計概要

- フレームワーク: Expo（React Native）
- 共有モジュール: shared/common_frontend（UI, 状態, 登録画面, Firebase設定）
- データソース: Firestore（プロジェクトは環境変数で指定）、テンプレートJSONのフォールバック
- 目的: 企業プロフィールの表示・編集、技術スタックや魅力/特徴の提示、将来的な求人・つながり導線の提供

## Firestore 接続
- Firestoreへの接続は共有設定 [firebaseConfig.js](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/shared/common_frontend/src/core/firebaseConfig.js) を介して行います
- 使用環境変数（Expoの公開環境変数）:
  - EXPO_PUBLIC_FIREBASE_API_KEY
  - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  - EXPO_PUBLIC_FIREBASE_PROJECT_ID
  - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - EXPO_PUBLIC_FIREBASE_APP_ID
  - EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
- Firestore プロジェクト（管理画面、要ログイン）:
  - https://console.firebase.google.com/u/0/project/flutter-frontend-21d0a/firestore/data
- 参照コレクション/ID仕様（登録画面）
  - コレクション: company
  - IDフィールド: id
  - ID接頭辞: B（例: B20260108xxxx）
  - 参照ドキュメント例:
    - コレクション: company
    - ドキュメントID: B00000

## データフロー
- 画面（企業トップ）: [CompanyPageScreen.js](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/apps/corporate_user_app/expo_frontend/src/features/company_profile/CompanyPageScreen.js)
- フォールバックデータ: DataContext により初期テンプレート（assets/json/company-profile-template.json）を保持
- 登録画面（保存処理）: [GenericRegistrationScreen.js](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/shared/common_frontend/src/features/registration/GenericRegistrationScreen.js)
- 技術スタック表示: [TechStackScreen.js](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/apps/corporate_user_app/expo_frontend/src/features/company_profile/TechStackScreen.js)

```mermaid
graph LR
    A["DataContext (company-profile-template.json)"]
    B["CompanyPageScreen (企業トップ)"]
    C["GenericRegistrationScreen (プロフィール登録)"]
    D["Firestore (company/ByyyymmddNNNN)"]

    A -->|initialData| B
    B -->|edit| C
    C -->|setDoc| D
```

## 共有モジュール構成
- UI: shared/common_frontend/src/core/components
  - GlassCard, RecursiveField, 入力系コンポーネント
- 登録機能: shared/common_frontend/src/features/registration
  - GenericRegistrationScreen（テンプレートベースのフィールド編集と保存）
- 状態: shared/common_frontend/src/core/state/DataContext
  - initialDataの受け渡しと更新API
- テーマ: shared/common_frontend/src/core/theme/theme
  - 色・フォント・レイアウト基準
- Firebase: shared/common_frontend/src/core/firebaseConfig
  - initializeApp と getFirestore の初期化

```mermaid
graph TD
    App["corporate_user_app (Expo)"] --> Nav["StackNavigator (画面遷移)"]
    Nav --> Company["CompanyPageScreen (企業トップ)"]
    Nav --> TechStack["TechStackScreen (使用技術)"]
    Nav --> Menu["MenuScreen (メニュー)"]
    Nav --> ImageEdit["ImageEditScreen (画像編集)"]
    Nav --> Registration["GenericRegistrationScreen (プロフィール登録)"]

    Company --> SharedUI["shared/common_frontend/components"]
    Company --> SharedState["shared/common_frontend/state"]
    Registration --> Firebase["shared/common_frontend/firebaseConfig"]
```

## 画面遷移（法人ユーザーアプリ）
```mermaid
graph TD
    Company["企業トップ (CompanyPageScreen)"] -->|編集| Registration["プロフィール登録 (GenericRegistrationScreen)"]
    Company -->|画像編集| ImageEdit["画像編集 (ImageEditScreen)"]
    Company -->|メニュー| Menu["メニュー (MenuScreen)"]
    Company -->|使用技術| TechStack["使用技術 (TechStackScreen)"]
    Registration -->|保存/キャンセル| Company
    ImageEdit -->|保存/キャンセル| Company
    Menu -->|閉じる| Company
```

## セキュリティと設定
- Firebase鍵はコードに直書きせず、EXPO_PUBLIC_* の環境変数で提供
- 秘密情報のログ出力やリポジトリへのコミットは避ける
- 開発/本番のプロジェクト切り替えは環境変数で管理

## 起動方法（法人ユーザーアプリ）
- スクリプト: [scripts/start_expo.sh](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/scripts/start_expo.sh)
- 実行例:
  - ./scripts/start_expo.sh corporate_user_app
- 接続URL（例）:
  - exp://lm8s_7u-anonymous-8082.exp.direct

## データスキーマ（推奨フォーマット）
### 前提
- 登録/保存は共有ロジック [GenericRegistrationScreen.js](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/shared/common_frontend/src/features/registration/GenericRegistrationScreen.js) に準拠します
- 企業トップはテンプレート [company-profile-template.json](file:///Users/yamakawamakoto/ReactNative_Expo/engineer-registration-app-yama/apps/corporate_user_app/expo_frontend/assets/json/company-profile-template.json) を初期表示に用います

### 会社概要（例）
```json
{
  "会社概要": {
    "社名": "ヤヲー株式会社",
    "WEBサイトURL": "https://www.yawoo.co.jp",
    "事業内容": "インターネット広告事業ほか",
    "代表者名": "入澤 ツヨシ",
    "所在地": {
      "郵便番号(ハイフンなし)": "1028282",
      "都道府県": "東京都",
      "市区町村": "千代田区",
      "町名_番地": "紀尾井町99-99",
      "建物名_部屋番号等": "東京ガーデンプラス紀尾井町 紀尾井の塔"
    },
    "平均年収": 650,
    "正社員数": 11176,
    "資本金": 24800000000,
    "設立年月日": "1996-01−20",
    "男女比率": "50:50",
    "エンジニア人口比率": "38%",
    "背景画像URL": "https://example.com/bg.png",
    "ロゴ画像URL": "https://example.com/logo.png"
  }
}
```

### 魅力/特徴（例）
```json
{
  "魅力/特徴": {
    "CEOが元エンジニア": false,
    "CTOが取締役になっている": false,
    "OSSやクラウド中心の開発": false,
    "会社のテックblogが定期投稿": false,
    "原則フルリモート勤務": false,
    "副業OK": false,
    "エンジニアにとってのその他の魅力": ""
  }
}
```

### 支払い情報（例）
```json
{
  "決済": {
    "クレジットカード": {
      "カード名義人": "",
      "カード番号": 0,
      "有効期限_MM/YY": 0,
      "CVV_セキュリティコード": 0
    },
    "銀行": {
      "金融機関名": "",
      "支店名": "",
      "口座名義人": "",
      "口座番号": 0,
      "口座種別": {
        "当座": false,
        "普通": false,
        "貯蓄": false
      }
    }
  }
}
```

### ドキュメント全体例（Corporate）
```json
{
  "id": "B00000",
  "会社概要": { /* 例を参照 */ },
  "魅力/特徴": { /* 例を参照 */ },
  "決済": { /* 例を参照 */ },
  "繋がり": { /* 必要に応じて拡張 */ }
}
```

```mermaid
classDiagram
    class Company {
      会社概要
      魅力特徴
      決済
      繋がり
    }
    class 会社概要 {
      社名
      WEBサイトURL
      事業内容
      所在地
      設立年月日
      資本金
      正社員数
      平均年収
    }
    class 魅力/特徴 {
      エンジニア比率
      技術文化
      リモート可否
      その他の魅力
    }
    class 決済 {
      クレジットカード
      銀行
    }
    class 繋がり {
      個人
      法人
      招待権限
    }
    Company --> 会社概要
    Company --> 魅力特徴
    Company --> 決済
    Company --> 繋がり
```

### 記述ガイドライン
- キー名は既存テンプレートの構造に従う（例: 会社概要 / 魅力/特徴 / 決済 / 繋がり）
- 企業ID（id）は登録時に自動採番（ByyyymmddNNNN形式）
