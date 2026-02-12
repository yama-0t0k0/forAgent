ExpoとFirestore、そしてMaestroの組み合わせは、現在のモバイル開発において非常にスピーディかつ強力なスタックであり、
本ドキュメントは、単なる「ボタンを押して画面が変わった」という表面的なテストから脱却し、**「Firestoreに正しいデータが書き込まれたか」というバックエンドの整合性までを検証対象に含める**設計書である。
Maestro単体では外部DBを直接覗くことはできないため、**「テスト専用のデバッグ画面（Hidden Dev Menu）」**や**「ログ出力インターフェース」**をアプリ側に仕込むアプローチを組み込んでいるが、AIがFirebaseへのアクセス権限を持っているため、ログ出力インターフェースを通じてテスト中に発生したI/OをMaestroが検証可能にする。

---

# E2Eテスト詳細設計書：Reliable Firestore Integration Test

## 1. 目的と意図

本設計の目的は、ExpoアプリにおけるUI操作がFirestoreのデータ状態と完全に同期しているかを保証することにある。

* **整合性の担保**: UI上の表示更新だけでなく、実際のFirestoreドキュメントの作成・更新・削除が期待通りに行われたかを検証する。
* **副作用の検知**: 特定のアクションが意図しないコレクションに影響を与えていないかをログレベルで確認する。
* **モック排除**: 可能な限りFirebase Emulator Suiteを使用し、本番に近い環境でI/Oをテストする。

---

## 2. テストアーキテクチャ

Maestroはブラックボックステストツールであるため、内部のFirestoreの状態を直接読み取ることができない。これを解決するために以下の構成をとる。

| コンポーネント | 役割 |
| --- | --- |
| **Maestro CLI** | テストランナー。YAML定義に基づきアプリを操作。 |
| **Firebase Emulator** | ローカルでFirestoreを動作させ、テスト終了ごとにデータをリセット。 |
| **Debug Overlay** | テスト実行時のみ有効化される不可視のログ出力UI。FirestoreのI/Oを画面上のテキストとして出力し、Maestroの`assertVisible`で検証可能にする。 |

---

## 3. 詳細設計：データI/Oの検証戦略

### 3.1 Logger Hookの導入

Firestoreへの書き込み（`setDoc`, `addDoc`, `updateDoc`）をラップするカスタムフックまたはユーティリティを作成し、実行時にテスト用ログを画面に描画する。

```typescript
// src/hooks/useFirestoreTestLogger.ts
export const logFirestoreIO = (action: string, collection: string, data: any) => {
  if (__DEV__) {
    // Maestroが読み取れるように、画面の端に不可視または極小のTextコンポーネントとして出力
    // もしくは、テスト専用の「LogView」コンポーネントにディスパッチする
    console.log(`[FIRESTORE_IO]|${action}|${collection}|${JSON.stringify(data)}`);
  }
};
```

### 3.2 Maestroでのアサーション

Maestroの `runScript` または `assertVisible` を用いて、ログの内容を検証する。

---

## 4. Maestro フロー定義 (例: ユーザープロフィール更新)

`tests/user_profile_update.yaml`

```yaml
appId: com.yourname.yourapp
---
- launchApp
- tapOn: "Profile Tab"
- tapOn: "Edit Name"
- inputText: "New Modern User"
- tapOn: "Save Button"

# --- データI/Oの検証 ---
# アプリ内のデバッグログ領域に、Firestoreへの書き込みログが出現するのを待つ
- waitForVisible:
    text: ".*\\[FIRESTORE_IO\\]\\|UPDATE\\|users\\|.*New Modern User.*"
    regex: true

# --- UIの変化の検証 ---
- assertVisible: "New Modern User"
```

---

## 5. テスト実行環境の詳細

### 5.1 プリセット・クリーンアップ

テストごとに副作用を排除するため、Firebase EmulatorのREST APIを使用してデータをクリアするスクリプトを `env.sh` に記述する。

```bash
# clear_firestore.sh
curl -v -X DELETE "http://localhost:8080/emulator/v1/projects/your-project-id/databases/(default)/documents"
```

### 5.2 コレクション名を含めた詳細ログ設計

検証対象とするコレクションとアクションの命名規則を以下のように定義する。

| ログ形式 | 検証内容の例 |
| --- | --- |
| `[IO] | CREATE` | 新規作成 |
| `[IO] | UPDATE` | 更新 |
| `[IO] | DELETE` | 削除 |

---

## 6. 実装状況と未実装機能の報告

### 6.1 実装完了機能
以下の機能は設計通り実装され、`tests/run_e2e.sh` および `tests/user_profile_update.yaml` に組み込まれました。

*   **Firestore Emulatorとの連携**: `tests/utils/clear_firestore.sh` によるテストごとのデータクリーンアップ（5.1項）。
*   **Logger Hook (Debug Overlay)**: `FirestoreLogger.js` および `TestLogOverlay.js` を実装し、Firestoreへの書き込み操作を画面上にオーバーレイ表示する仕組み（3.1項）。
*   **Maestroアサーション**: `user_profile_update.yaml` 内で `extendedWaitUntil` と正規表現を用いて、ログオーバーレイの内容（[UPDATE] public_profile ...）を検証する仕組み（3.2項）。
*   **バンドル検証**: `tests/verify_bundle.sh` による静的解析（RunCommand禁止ルール下ではユーザー実行推奨）。

### 6.2 未実装・変更機能とその理由

| 機能・項目 | 実装ステータス | 理由・代替案 |
| :--- | :--- | :--- |
| **Hidden Dev Menu** | **変更** | "Hidden" ではなく、開発環境（`__DEV__`）において常時または特定の条件下で表示される **Overlay UI** として実装しました。Maestroが操作・視認しやすくするため、隠しメニューを開くステップを省略し、直接ログを確認できるオーバーレイ方式を採用しました。 |
| **Corporate App E2E** | **未実装** | 今回のスコープは `admin_app` (管理者による個人エンジニア編集) の検証フロー確立を優先しました。`run_e2e.sh` には `corporate_user_app` の枠組みのみ用意しています。 |
| **AI Sandboxでの自動実行** | **制限** | プロジェクトルール（`sandbox_prohibition.md`）により、AI環境での `maestro test` や `npm start` の実行は禁止されています。スクリプトの構築と検証までを行い、実際の実行はユーザーのローカル環境に委ねる運用としています。 |
