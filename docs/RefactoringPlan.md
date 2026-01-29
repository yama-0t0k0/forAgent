# リファクタリング計画：共通コンポーネント化推進

本ドキュメントは、Issue #212 で言及された「他の重複コンポーネントの共通化推進」に関する具体的な実行プランをまとめたものです。
UIの一貫性向上とメンテナンスコストの削減を目的としています。

## 1. モーダル実装の完全統一

`UserDetailModal` と `JobDetailModal` は共通化済みですが、`DrillDownModal` がまだ独自実装のまま残っています。これを共通コンポーネントに移行します。

- **対象**:
  - `apps/admin_app/expo_frontend/src/features/dashboard/components/modals/DrillDownModal.js`
  - `apps/fmjs/expo_frontend/src/screens/SelectionProgressListScreen.js` (追加対応)
- **現状**: `Modal` コンポーネントを直接使用し、独自のヘッダーや閉じるボタンを実装している。
- **アクション**: `shared/common_frontend/src/core/components/DetailModal.js` を使用するようにリファクタリングする。
- **期待効果**: アプリ内の全モーダルの挙動とデザイン（オーバーレイ、閉じるボタン、アニメーション）が統一される。
- **ステータス**: ✅ 完了
  - `DrillDownModal` 対応完了
  - `SelectionProgressListScreen` 対応完了
  - `ConnectionScreen` の未使用 `Modal` import 削除完了
  - ※コードベース全体で `react-native` の `Modal` を直接使用している箇所は `DetailModal.js` 以外になくなりました。

## 2. TechStackView の切り出し

Corporate App の会社詳細画面に定義されている技術スタック表示コンポーネントは、Admin App や Job Description App でも再利用価値が高い機能です。

- **対象**: `apps/corporate_user_app/expo_frontend/src/features/company_profile/CompanyPageScreen.js` 内の `TechStackView`
- **現状**: ファイル内でインライン定義されており、他から参照できない。
- **アクション**: `shared/common_frontend/src/features/company/components/TechStackView.js` として独立させる。
- **期待効果**: 会社情報の表示パーツとして、Admin App の会社詳細画面 (`CompanyDetailScreen`) などでも容易に利用可能になる。
- **ステータス**: ✅ 完了

## 3. 基本UIコンポーネントの整備

現在、各画面で `TouchableOpacity` や `Text` に直接スタイルを当ててボタンやバッジを作成している箇所が散見されます。これらを共通化します。

- **対象**: ボタン、ステータスバッジ
- **アクション**:
    - `PrimaryButton.js` / `SecondaryButton.js`: 統一されたデザインのボタンコンポーネントを作成。
    - `StatusBadge.js`: 「未対応」「対応中」などのステータス表示を統一。
- **期待効果**: アプリ全体での色使いや操作感の統一、およびデザイン変更時の修正コスト削減。
- **ステータス**: ✅ 完了

## 4. Buttonコンポーネントの機能拡張と適用拡大

既存の `PrimaryButton` / `SecondaryButton` を拡張し、各アプリの独自実装ボタンを共通コンポーネントに置き換えます。

- **機能拡張**:
  - `shared/common_frontend/src/core/components/PrimaryButton.js` / `SecondaryButton.js`
    - `children` プロパティのサポート（アイコン＋テキスト対応）
    - `variant` / `style` の柔軟性向上（Rounded, Smallなど）

- **適用対象**:
  - `apps/individual_user_app/expo_frontend/src/features/profile/MyPageScreen.js`
    - 「職歴書作成」ボタン → `PrimaryButton` (Small)
    - 「経歴詳細」ボタン → `PrimaryButton` (Rounded + Icon)
  - `apps/job_description/expo_frontend/src/features/job_description/components/JobDescriptionContent.js`
    - 「求人詳細」ボタン → `PrimaryButton` (Rounded + Icon)
  - `apps/fmjs/expo_frontend/src/screens/SelectionProgressListScreen.js`
    - アクションボタン等の確認と共通化

- **ステータス**: ⏳ 未着手
