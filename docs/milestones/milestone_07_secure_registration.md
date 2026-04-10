# Milestone 07: 堅牢な新規登録システムの構築 (Secure Registration Integration)

## 概要
Phase 1 で構築したプロトタイプをベースに、Firebase Auth および Firestore を用いた「本番運用可能」なセキュアな登録システムを統合する。

## ターゲット・成果物
- [ ] **招待コード実証ロジック**: Firestore `invitationCodes` コレクションとの連携完了。
- [ ] **認証連携 (Real Auth)**: Google/GitHub/Email による実機での認証動作。
- [ ] **データ・スプリット実装**: `profiles` (公開) と `private_info` (非公開) への分割書き込み。
- [ ] **セキュリティルール強化**: 招待コードの不正読み取り防止および作成権限の制限。
- [ ] **一貫性チェック**: 登録完了後、自動的に適切な初期ロールが付与されることの確認。

## タスク詳細

### 1. バックエンド基盤 (Firestore)
- [ ] `invitationCodes` のルール追加 (Allow `get` only)
- [ ] `profiles` / `private_info` のルール確認・修正

### 2. サービス層 (`registrationService.js`)
- [ ] `validateInvitationCode` の実実装
- [ ] `registerUser` の実実装 (Auth + Firestore Writes)
- [ ] 招待コードのステータス更新 (`used`)

### 3. UI 連携 (`lp_app`)
- [ ] `InvitationCodeScreen`: ネットワークエラーや無効コードのハンドリング強化
- [ ] `RegistrationMethodScreen`: 各種認証プロバイダーのトリガー実装
- [ ] `RegistrationFormScreen`: 最終登録処理の呼び出しとローディングUI
- [ ] 登録完了後の自動リダイレクト

## 完了定義 (Definition of Done)
1. 有効な招待コードでなければ登録フローを開始できない。
2. 登録完了後、Firestore に `profiles` と `private_info` が正しく生成されている。
3. 使用された招待コードが `used` に変更されている。
4. `RegistrationFormScreen` で入力した属性（職種等）が Firestore に反映されている。
