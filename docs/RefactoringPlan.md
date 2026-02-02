# Refactoring & Shared Component Plan

このドキュメントでは、`engineer-registration-app-yama` 内の各アプリ（Admin, Corporate, Individual, FMJS, JD App）における共通機能の集約（Shared化）と、コードベースのリファクタリング計画を管理します。

## 完了したリファクタリング (Done)

### ✅ Phase 1: 初期Shared化と基盤整備
1. **ナビゲーション構造の統一 (`GenericBottomNav`)**
   - **ステータス**: ✅ 完了
   - **内容**: `GenericBottomNav` を `shared/common_frontend/src/core/components` に作成し、各アプリ（Admin, Corporate, Individual）で継承・設定注入して利用する形に統一。

2. **メニュー/設定画面の構成統一**
   - **ステータス**: ✅ 完了
   - **内容**: `GenericMenuScreen` (Shared) を正とし、各アプリは `CorporateMenuScreen`, `IndividualMenuScreen` を通じて設定データを渡すだけの構造に統一。

3. **求人詳細表示の完全集約**
   - **ステータス**: ✅ 完了
   - **内容**: 全て `shared/features/job_profile` 以下のコンポーネント利用に統一。Job Description Appのローカルコンポーネントを廃止し、Admin AppからもSharedを参照するように変更。

4. **詳細モーダルの残存移行**
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

## 8. 追加の共通化提案（フェーズ3：品質保証とモデル駆動アーキテクチャの完成）

### 1. Service層のモデル完全適用 (Roadmap Item 2の完遂)
- **現状**: UI層（`IndividualProfileScreen`等）で `User.fromFirestore` していますが、`FirestoreDataService` は生データを返しています。
- **実施**: `FirestoreDataService` が直接モデルインスタンス（`User`, `JobDescription`）を返すように修正し、UI層の変換ロジックを削除して責務を分離します。

### 2. JSDocによる型定義の厳格化
- **目的**: TSを使わずに、IDEの補完と静的解析を強化する。
- **内容**: 全ファイルで `@param {import('./models/User').User} user` のような正確なJSDoc記述を徹底し、`check_coding_conventions.js` で監視します。
