# リファクタリング計画：共通コンポーネント化推進

本ドキュメントは、Issue #212 で言及された「他の重複コンポーネントの共通化推進」に関する具体的な実行プランをまとめたものです。

## 1. モーダル実装の完全統一

- **目的**: アプリ内で散在する独自モーダル実装を排除し、ユーザー体験を統一する。
- **期待される効果**: アプリ内の全モーダルの挙動とデザイン（オーバーレイ、閉じるボタン、アニメーション）が統一され、メンテナンス性が向上する。

`UserDetailModal` と `JobDetailModal` は共通化済みですが、`DrillDownModal` がまだ独自実装のまま残っています。これを共通コンポーネントに移行します。

- **対象**:
  - `apps/admin_app/expo_frontend/src/features/dashboard/components/modals/DrillDownModal.js`
  - `apps/fmjs/expo_frontend/src/screens/SelectionProgressListScreen.js` (追加対応)
- **現状**: `Modal` コンポーネントを直接使用し、独自のヘッダーや閉じるボタンを実装している。
- **アクション**: `shared/common_frontend/src/core/components/DetailModal.js` を使用するようにリファクタリングする。
- **ステータス**: ✅ 完了
  - `DrillDownModal` 対応完了
  - `SelectionProgressListScreen` 対応完了
  - `ConnectionScreen` の未使用 `Modal` import 削除完了
  - ※コードベース全体で `react-native` の `Modal` を直接使用している箇所は `DetailModal.js` 以外になくなりました。

## 2. TechStackView の切り出し

- **目的**: Corporate App の会社詳細画面にある有用なUIコンポーネントを他アプリでも再利用可能にする。
- **期待される効果**: Admin App の会社詳細画面など他画面での実装工数削減と、コードの重複排除。

Corporate App の会社詳細画面に定義されている技術スタック表示コンポーネントは、Admin App や Job Description App でも再利用価値が高い機能です。

- **対象**: `apps/corporate_user_app/expo_frontend/src/features/company_profile/CompanyPageScreen.js` 内の `TechStackView`
- **現状**: ファイル内でインライン定義されており、他から参照できない。
- **アクション**: `shared/common_frontend/src/features/company/components/TechStackView.js` として独立させる。
- **ステータス**: ✅ 完了

## 3. 基本UIコンポーネントの整備

- **目的**: 各画面で散在する基本的なUI要素（ボタン、バッジ）の実装を統一し、デザインの一貫性を担保する。
- **期待される効果**: アプリ全体での色使いや操作感の統一、およびデザイン変更時の修正コスト削減。

現在、各画面で `TouchableOpacity` や `Text` に直接スタイルを当ててボタンやバッジを作成している箇所が散見されます。これらを共通化します。

- **対象**: ボタン、ステータスバッジ
- **アクション**:
    - `PrimaryButton.js` / `SecondaryButton.js`: 統一されたデザインのボタンコンポーネントを作成。
    - `StatusBadge.js`: 「未対応」「対応中」などのステータス表示を統一。
- **ステータス**: ✅ 完了

## 4. Buttonコンポーネントの機能拡張と適用拡大

- **目的**: 各アプリで独自実装されているボタンを共通コンポーネントに置き換え、実装パターンを統一する。
- **期待される効果**: 独自実装の削減によるコード量削減と、ボタンの振る舞い（ローディング、非活性時など）の統一。

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

- **ステータス**: ✅ 完了

## 5. IconButton と BottomNavItem の共通化

- **目的**:
  - アプリ全体でのアイコンボタンとボトムナビゲーションのタッチ領域、視覚的フィードバック（Opacity）、スタイルを統一する。
  - 個別実装によるコードの重複を排除し、メンテナンス性を向上させる。

- **ステータス**: ✅ 完了
  - 2026-01-30: Individual App (MyPageScreen) 起動確認済み。
  - 2026-01-30: Job App / Admin App 起動確認済み。

- **変更内容**:
  - `shared/common_frontend/src/core/components/IconButton.js` を作成 (hitSlop, disabled, children対応)。
  - `shared/common_frontend/src/core/components/BottomNavItem.js` を作成 (Active/Inactive状態, アイコン+ラベル)。
  - 以下の画面での個別 `TouchableOpacity` 実装を共通コンポーネントに置き換え:
    - Corporate App: `CompanyPageScreen.js`, `MenuScreen.js`
    - Individual App: `MyPageScreen.js`
    - Job App: `JobDescriptionContent.js` (編集ボタン)
    - Admin App: `DashboardScreen.js`

## 6. 全アプリ共通化の中期実行計画（俯瞰分析に基づく）

現在、複数のアプリで機能重複が見られる領域と、将来的に共通化が必要となる領域についての分析結果と実行計画です。

### 🚨 即時対応（メンテナンスコスト削減）

1. **画像編集・アップロード機能の統一**
   - **ステータス**: ✅ 完了
   - **内容**: `GenericImageEditScreen` (Shared) に統合。各アプリのローカル `ImageEditScreen` を廃止し、Shared のラッパー (`CorporateImageEditScreen`, `IndividualImageEditScreen`) へ移行。

2. **メニュー/設定画面の構成統一**
   - **ステータス**: ✅ 完了
   - **内容**: `GenericMenuScreen` (Shared) を正とし、各アプリは `CorporateMenuScreen`, `IndividualMenuScreen` を通じて設定データを渡すだけの構造に統一。

3. **求人詳細表示の完全集約**
   - **ステータス**: ✅ 完了
   - **内容**: 全て `shared/features/job_profile` 以下のコンポーネント利用に統一。Job Description Appのローカルコンポーネントを廃止し、Admin AppからもSharedを参照するように変更。

## 4. **詳細モーダルの残存移行**
   - **内容**: Adminの `UserDetailModal` 等の再点検と完全な正規化を行う。
   - **ステータス**: ✅ 完了
     - 2026-01-30: Admin App の `UserDetailModal` を `DetailModal` に完全準拠確認。
     - 内部ナビゲーション (`UserDetailContent`) と `IndividualProfileScreen` の連携動作確認済み。

### 🔮 中期的・戦略的共通化（機能拡張への備え）

1. **企業プロフィール表示 (`CompanyPageScreen`) のShared化**
   - **ステータス**: ✅ 完了
   - **目的**: Admin（審査・閲覧）とIndividual（企業研究）で同じビューを利用可能にする。
   - **計画**: 現在Corporateアプリにある `CompanyPageScreen` を `shared/features/company_profile` に移動し、編集モード/閲覧モードを切り替えられる設計にする。
   - **完了内容**: `CompanyProfileView` をSharedコンポーネント化し、Corporate AppとAdmin Appで共有可能に。相対パスやJSDocの規約も遵守。

2. **選考プロセスエディタ (`SelectionFlowEditor`) のShared化**
   - **ステータス**: ✅ 完了
   - **目的**: Adminアプリでのテンプレート管理機能実装を見越した共通化。
   - **計画**: 現在FMJSにあるエディタを `shared/features/selection` へ移動。
   - **完了内容**: `SelectionFlowEditor.js` を `shared/common_frontend/src/features/selection/` に移動し、FMJSからの参照を更新。

3. **エンジニアスキル分析 (Heatmap/TechStack) の高度化**
   - **ステータス**: ✅ 完了
   - **目的**: Corporate, Individual, Admin, JD 全てのアプリでの共通利用。
   - **計画**: `heatmap_engine` のロジックとUIコンポーネントをセットで再利用可能なパッケージとして整備する。
    - **完了内容**: Heatmap関連コンポーネント(Grid, Mini, Calculator等)とTechStackViewを `shared/features/analytics` に集約。各アプリからの参照パスを `@shared` エイリアス経由に統一し、依存関係を整理しました。


## 7. 追加の共通化提案（フェーズ2：基盤と一貫性の強化）
- **ステータス**: ✅ 完了 (2026-02-01)
- **完了内容**:
  - `AppShell` による基盤ボイラープレートの集約。
  - `THEME` オブジェクトへの Typography / Spacing システムの導入。
  - `EmptyState`, `ErrorState`, `GlobalLoadingOverlay` によるエラー/ローディング表示の共通化。
  - `useFirestore`, `useFirestoreSnapshot`, `useForm` カスタムフックの整備。
  - `ROUTES` 定数によるナビゲーション管理の集約。
  - `ScreenHeader` によるヘッダーコンポーネントの標準化。
  - `IndividualProfileScreen`, `SelectionProgressListScreen`, `DashboardScreen` 等への適用。

### 1. App Shell (共通基盤コンポーネント) の導入
- **目的**: 各アプリの `App.js` にある共通のボイラープレートを統一。
- **内容**: `SafeAreaProvider`, `StatusBar`, 初期ロード画面 (`ActivityIndicator`) を内包した `AppShell.js` を作成。

### 2. デザインシステム (Typography & Spacing) の拡張
- **目的**: 「マジックナンバー」を排除し、デザインの一貫性を担保。
- **内容**: `shared/theme.js` にフォントサイズ (`h1`, `h2`, `body`...) と余白定数 (`sm: 8`, `md: 16`...) を追加。

### 3. ステート表示 (Empty / Error / Loading) の共通化
- **目的**: 状態に応じた標準的なUIフィードバックを全アプリで一貫させる。
- **内容**: `EmptyState.js`, `ErrorState.js`, `GlobalLoadingOverlay.js` の作成と適用。

### 4. 共通カスタムフックの整備 (useFirestore / useForm)
- **目的**: ロジックの再利用性を高め、各画面のコードを簡潔にする。
- **内容**: ローディング・エラー処理をラップしたデータ取得フックや、バリデーション機能付きフォーム管理フックの作成。

### 5. ナビゲーション定数 (Route Names) の集約
- **目的**: 文字列リテラルによる遷移エラーの防止。
- **内容**: `shared/constants/navigation.js` でルート名（`CompanyDetail` 等）を定数化。

### 6. 共通ヘッダーコンポーネント (`ScreenHeader`)
- **目的**: 戻るボタンやアクションボタンを含む標準的なヘッダーを統一。
- **内容**: 各アプリの実装を `shared` の標準コンポーネントに移行。
