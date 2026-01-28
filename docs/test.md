# テスト設計書

## 概要
このドキュメントでは、プロジェクトのテスト構成と、新しいアプリ/画面を追加する際の手順を説明します。

---

## テストディレクトリ構成

```
tests/
├── run_e2e.sh           # E2Eテスト実行スクリプト（メインエントリポイント）
├── verify_bundle.sh     # バンドル整合性チェック
├── integration/         # インテグレーションテスト（予約）
└── jobs/                # Maestro E2Eテストフロー
    ├── full_coverage_test.yaml  # 全カバレッジテスト（推奨）
    └── smoke_test.yaml          # シンプルスモークテスト
```

---

## 各ファイルの説明

### `run_e2e.sh`
**メインの実行スクリプト**。以下のステップを順に実行します:
1. `verify_bundle.sh` でモジュール解決エラーをチェック
2. Expoサーバーを起動
3. Simulatorを確認・起動
4. Expo GoでアプリをロードしMaestroテストを実行

```bash
# 実行方法 (アプリ名を指定)
./tests/run_e2e.sh <app_name>
# 例:
# ./tests/run_e2e.sh admin_app
# ./tests/run_e2e.sh individual_user_app
```

### `verify_bundle.sh`
**静的バンドル検証**。`npx expo export` を実行し、以下を検出します:
- `Unable to resolve module` エラー
- その他のバンドリングエラー

Simulatorを起動せずに高速チェックが可能。

### `jobs/full_coverage_test.yaml`
**testIDベースの全カバレッジテスト**（推奨）。

特徴:
- `testID` セレクタで要素を識別（安定性高）
- `runFlow` + `when` で未実装画面を自動スキップ
- `optional: true` で空データ状態を警告のみにするレジリエント設計

テスト対象:
- ダッシュボードの読み込み
- 5つのタブ間のナビゲーション
- 各タブのリストアイテム表示確認
- 詳細モーダルの表示・閉じる

### `jobs/smoke_test.yaml`
**テキストベースのシンプルスモークテスト**。

特徴:
- UI文言でセレクタを指定（開発初期向け）
- 変更に弱いため、`full_coverage_test.yaml` の使用を推奨

---

## 新しいアプリ/画面を追加する際

### 1. testID命名規約に従う

| コンポーネント種別 | パターン | 例 |
|------------------|---------|---|
| タブ | `tab_<name>` | `tab_individual`, `tab_company` |
| リストアイテム | `<type>_item` | `engineer_item`, `job_item` |
| モーダルタイトル | `<type>_title` | `user_detail_title` |
| モーダル閉じる | `<type>_close` | `drill_down_close` |
| モーダルコンテナ | `<type>_modal_view` | `drill_down_modal_view` |

### 2. UIコンポーネントにtestIDを追加

```jsx
// タブの例
<TouchableOpacity testID="tab_new_feature">

// リストアイテムの例
<EngineerListItem testID="new_feature_item" />

// モーダルの例
<View testID="new_modal_view">
  <Text testID="new_modal_title">{title}</Text>
  <TouchableOpacity testID="new_modal_close" />
</View>
```

### 3. テストファイルに条件付きフローを追加

```yaml
# 新しいタブへのナビゲーション
- tapOn:
    id: "tab_new_feature"

# 要素が存在する場合のみテスト実行（レジリエント）
- runFlow:
    when:
      visible:
        id: "new_feature_item"
    commands:
      - tapOn:
          id: "new_feature_item"
          index: 0
      # 詳細画面が実装されている場合のみ
      - runFlow:
          when:
            visible:
              id: "new_modal_title"
          commands:
            - tapOn:
                id: "new_modal_close"
```

### 4. テストを実行して確認

```bash
./tests/run_e2e.sh
```

---

## テスト結果の読み方

| アイコン | 意味 |
|---------|-----|
| ✅ | テスト成功 |
| ⚪️ | スキップ（条件を満たさなかった） |
| ⚠️ | 警告（optional: trueで失敗） |
| ❌ | 失敗（必須テストが通らなかった） |

---

## トラブルシューティング

### Maestroが見つからない
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Javaが見つからない
```bash
brew install openjdk
```

### testIDが認識されない
- React Native の `testID` は Expo Go 経由で Maestro に伝播します
- Modalコンポーネント内部の要素はモーダルが開いてから検出可能になります
- `extendedWaitUntil` でタイムアウトを設定してください
