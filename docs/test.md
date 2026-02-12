# テスト設計書

## 概要
このドキュメントでは、プロジェクトのテスト方針とE2Eテスト構成について説明します。

---

## 🧪 テスト方針：実世界テスト（Real World Testing）

我々は、**「テストのためのテスト（Smoke Test）」を排除し、「ユーザーの実際の利用シナリオ」のみを検証します。**

### 1. ユーザー中心の検証シナリオ
- **スモークテストの撤廃**: 「画面が表示されるか」「ボタンが存在するか」といった浅い確認は、開発者がExpo Previewで一瞬で判断できるため、自動テストの価値は低いです。
- **実用フローの検証**: 「管理者としてログインし、ユーザー詳細を開き、つながり候補を確認して保存する」といった、実際の業務フローそのものをテストシナリオとします。これにより、「テストは通ったが、現場で使えない」という事態を防ぎます。

### 2. 環境の忠実性
- **シミュレーター/エミュレーター必須**: `run_e2e.sh` は必ずiOS Simulator / Android Emulator上で実行されます。
- **データI/Oの保証**: UIの変化だけでなく、「Firestoreに正しいデータが書き込まれたか」までを検証範囲とします（参照: `E2Etest_DesignDocument.md`）。

---

## テストディレクトリ構成

```
tests/
├── run_e2e.sh           # E2Eテスト実行スクリプト（メインエントリポイント）
├── verify_bundle.sh     # バンドル整合性チェック
├── jobs/                # Maestro E2Eテストフロー
│   ├── full_coverage_test.yaml           # 全カバレッジ網羅テスト
│   ├── admin_modal_interaction_test.yaml # モーダル操作・詳細確認
│   └── (user_profile_update.yaml)        # データ更新・I/O検証
└── utils/
    └── clear_firestore.sh                # テスト毎のデータクリーンアップ
```

---

## 主なテストシナリオ

### `run_e2e.sh admin_app` で実行されるシナリオ

1.  **`jobs/full_coverage_test.yaml`**
    -   **目的**: アプリ全体の回遊性確認。
    -   **内容**: ダッシュボードの全タブ（個人・法人・求人・選考）を巡回し、リスト表示、フィルタリング、初期ロードが正常に行われることを検証します。

2.  **`jobs/admin_modal_interaction_test.yaml`**
    -   **目的**: 詳細機能の深掘り検証。
    -   **内容**: 特定のユーザー・求人を選択し、詳細モーダルを展開。内部のタブ切り替えや情報表示が崩れていないかを確認します。

3.  **`user_profile_update.yaml`**
    -   **目的**: データ整合性の保証。
    -   **内容**: 実際にフォームに入力し、保存アクションを実行。画面上のフィードバックだけでなく、バックエンド（Firestore）への書き込みが完了したことを検証します。

---

## テストの実行方法

基本的にはルートディレクトリから以下を実行するだけです。

```bash
./tests/run_e2e.sh admin_app
```

### オプション
特定のYAMLファイルのみをデバッグ実行したい場合:

```bash
./tests/run_e2e.sh admin_app tests/jobs/your_specific_test.yaml
```

---

## 新しいテストを追加する際

「それが**実際のユーザーの操作**か？」を常に問いかけてください。

- **NG**: `assertVisible: "ボタンA"` （ただの存在確認）
- **OK**: `tapOn: "ボタンA"` -> `assertVisible: "完了しました"` （操作と結果のセット）

実装時は `reference_information_fordev/instructions/E2Etest_DesignDocument.md` に記載されている `testID` の規約や、Firestoreデータ検証の仕組みに従ってください。
