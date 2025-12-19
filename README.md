# エンジニア個人登録アプリ (Engineer Registration App)

このアプリケーションは、エンジニアの経歴やスキル情報を登録するためのモバイルアプリケーションです。Expo (React Native) で構築され、データはFirestoreに保存されます。

## 🏗 アーキテクチャ概要

本アプリは、設定ファイル（`engineer-profile-template.json`）を読み込み、その構造に基づいて動的にUIフォームを生成する「メタデータ駆動型UI」アーキテクチャを採用しています。

### ディレクトリ構造

```mermaid
graph TD
    Root[Project Root]
    Root --> App[App.js: エントリーポイント]
    Root --> Assets[assets/]
    Assets --> JSON[json/engineer-profile-template.json: テンプレートデータ]
    Root --> Src[src/]
    Src --> Comps[components/: UIコンポーネント]
    Src --> Context[context/: 状態管理]
    Src --> Const[constants/: 定数・テーマ]
    Src --> Screens[screens/: 画面]
    
    Comps --> Recursive[RecursiveField.js: 再帰的フォーム生成]
    Comps --> Inputs[InputRow.js, etc.: 各種入力部品]
    Context --> DataCtx[DataContext.js: データ保持・更新]
    Screens --> Main[MainScreen.js: メイン画面・保存ロジック]
```

## 🧩 コンポーネント構成とデータフロー

`DataContext` がアプリケーション全体のデータ状態（JSONツリー）を保持し、各コンポーネントに提供します。`RecursiveField` はデータを再帰的に走査し、データの型やメタデータ（`_displayType`）に応じて適切な入力コンポーネントをレンダリングします。

```mermaid
classDiagram
    class App {
        +DataProvider
    }
    class DataContext {
        +data: JSON Object
        +updateValue(path, value)
    }
    class MainScreen {
        +Tab.Navigator
        +handleSave()
    }
    class RecursiveField {
        +render()
        +AccordionItem
    }
    class InputComponents {
        <<Inputs>>
        +InputRow
        +SwitchRow
        +SkillSelector
        +MonthYearPickerInput
        +DatePickerInput
    }

    App --> DataContext : Provides
    App --> MainScreen : Renders
    MainScreen --> DataContext : Consumes & Updates
    MainScreen --> RecursiveField : Renders Root Objects
    RecursiveField --> RecursiveField : Recursively Renders
    RecursiveField --> InputComponents : Renders Leafs
    InputComponents --> DataContext : Call updateValue()
```

## 🔄 処理フロー

### 1. フォーム生成フロー

JSONデータの階層構造をそのままタブとアコーディオンUIに変換します。

```mermaid
sequenceDiagram
    participant User
    participant MainScreen
    participant RecursiveField
    participant DataContext

    MainScreen->>DataContext: Load JSON Template
    DataContext-->>MainScreen: Provide 'data'
    MainScreen->>MainScreen: Generate Tabs from Top-Level Keys
    Note over MainScreen: "基本情報", "スキル経験", ...
    User->>MainScreen: Select Tab
    MainScreen->>RecursiveField: Render Tab Content (Root Object)
    loop Recursive Rendering
        RecursiveField->>RecursiveField: Check value type
        alt is Object
            RecursiveField->>RecursiveField: Render AccordionItem
        else is Boolean
            RecursiveField->>RecursiveField: Render SwitchRow
        else is String/Number
            RecursiveField->>RecursiveField: Render InputRow
        else _displayType specified
            RecursiveField->>RecursiveField: Render Specific Component
        end
    end
```

### 2. データ保存フロー (Firestore)

```mermaid
sequenceDiagram
    participant User
    participant MainScreen
    participant Firestore

    User->>MainScreen: Tap "Save" Button
    MainScreen->>MainScreen: Request ID Generation
    MainScreen->>Firestore: Query existing IDs (yyyyMMdd range)
    Firestore-->>MainScreen: Return existing docs
    MainScreen->>MainScreen: Calculate new ID (CyyyyMMddnnnn)
    MainScreen->>MainScreen: Clean Data (Remove internal metadata)
    MainScreen->>Firestore: setDoc(individual/{newID})
    Firestore-->>MainScreen: Success
    MainScreen->>User: Show "Saved!"
```

## 🛠 Tech Stack

*   **Framework**: Expo (React Native)
*   **Language**: JavaScript (React)
*   **Database**: Firebase Firestore
*   **UI Architecture**: Metadata-Driven UI, Recursive Components
*   **State Management**: React Context API
*   **Components**: Custom Components + `@react-native-community/datetimepicker`

## 📁 主要ファイル解説

| ファイル名 | 説明 |
| --- | --- |
| `App.js` | アプリケーションのエントリーポイント。プロバイダーの設定等。 |
| `src/context/DataContext.js` | JSONデータの読み込み、保持、更新ロジックを提供。 |
| `src/screens/MainScreen.js` | タブナビゲーションの構築と、Firestoreへの保存処理を担当。 |
| `src/components/RecursiveField.js` | JSONツリーを再帰的にコンポーネントに変換する中核コンポーネント。 |
| `assets/json/engineer-profile-template.json` | フォームの構造と初期値を定義するテンプレートファイル。これを編集するだけでUIが変化します。 |
