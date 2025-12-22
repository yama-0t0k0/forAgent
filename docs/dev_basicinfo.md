# エンジニア登録アプリ / キャリアデベロップメントSNS：開発基本情報

本ドキュメントは、エンジニアのキャリア実現度を最大化させるためのプラットフォーム「キャリアデベロップメントSNS」の開発基本情報です。

-----

## 🎯 プロジェクト概要

本サービスは「**エンジニア個人のキャリア実現度を最大化させる**」ことを目的とした「キャリアデベロップメントSNS」です。
エンジニアの「**価値増幅者（Value Amplifier）**」として、その人の未来価値を起点としたキャリア形成を支援します。

### 🚀 システム特徴
- **高精度マッチング (心臓部)**: ヒートマップ可視化によるスキル/志向の定量的なギャップ分析。
- **純粋 Dart バックエンド**: Node.js を一切使用しない、Firebase + Dart によるバックエンド実装。
- **ヒートマップ実装 (Pure Dart)**: ギャップ分析のロジックは別リポジトリの `Shared` ディレクトリにて Dart で実装済み。
- **メタデータ駆動型UI**: JSON テンプレートから動的にフォームを生成する柔軟なアーキテクチャ。
- **専門AIによる情報デリバリー**: Gemini API を統合し、キャリアドメイン知識に基づいた高度な分析とフィードバックを提供。
- **候補者の未来価値起点**: 現状スキルだけでなく、エンジニアの「想い（志向）」を起点に戦略的なマッチングを実現。

### 🏢 エコシステムとドメイン定義

本プロジェクトは以下の5つのドメイン要素で構成されるエコシステムです。

- **Admin (管理者)**: 有料職業紹介事業者（自社）。システム全体の統括。
- **Individual (個人)**: **求職者（エンジニア）**。本アプリのメインユーザー。
- **Corporate (法人)**: **求人企業（テック系）**。
- **JD (Job Description)**: 求人詳細。Corporateが管理。
- **FMJS (Fee Management & Job Status)**: 求職者と求人が結びついた「選考進捗」および「手数料管理」データ。

### データベース優先順位 ⭐️
1. **🥇 Individual** (個人ユーザー) - 核となる経歴・スキル・志向データ。
2. **🥈 Corporate/Company** (法人ユーザー) - 企業の基本情報。
3. **🥉 JD** (求人票) - 案件詳細および求められるスキル・志向のデータ。
4. **🏅 FMJS** (選考・手数料) - トランザクションデータ。（転職活動期の選考状況データ、入社時の手数料データ、入社後のサーベイデータ）

---

## 📊 技術スタック

### フロントエンド / モバイル (移行期)
- **Framework**: Expo (React Native)
- **UI Architecture**: Metadata-Driven UI / Recursive Components
- **Responsive Strategy**: **Mobile-first デザイン**。PC UI は別途実装せず、モバイル UI をレスポンシブデザインで最適化して共通利用する。

### バックエンド & データベース
- **Cloud Infrastructure**: Firebase
- **Database**: Cloud Firestore
- **AI Integration**: Google Gemini API (分析・職歴生成等)

---

## 👥 ターゲットユーザー

### 個人ユーザー（エンジニア）
- **役割**: ソフトウェアエンジニア、フロントエンド・バックエンド・フルスタック開発者。
- **目標**: 自身のスキルの客観的評価、キャリアパスの明確化、未来価値の最大化。
- **当社の価値**: スキルの「通訳者」に留まらず、キャリアの「価値増幅者」として伴走。

### 企業ユーザー（採用担当者・技術責任者）
- **目標**: 技術スキルの正確な評価、候補者の志向（想い）との深い適合性の確認。
- **当社の価値**: 人的資本の戦略投資支援として、真にフィットするエンジニアとの出会いを提供。

---

## 🎨 開発方針：UX & AI 中心主義

### ユーザーエクスペリエンス最優先
ユーザーが直感的に操作でき、自己のキャリアログを残すこと自体に価値を感じられるインターフェースを追求します。

### 専門AIによる高速デリバリー
テクノロジー人材におけるキャリア関連ドメイン知識を AI に組み込み、それを高速にユーザーへ提供することで、エンジニアの適応力を深めます。

---

## 🏗 アーキテクチャ構成とロードマップ

本プロジェクトは、言語的な統一（Pure Dart）と効率的なクロスプラットフォーム開発を最終目標としています。
また、単一リポジトリ内で複数の独立したアプリケーションとドメインロジックを管理する **Modular Monolith (Monorepo)** アーキテクチャを採用しています。

- **現在の構成 (Phase 1)**:
    - **アーキテクチャ**: モジュラーモノリス形式。各機能モジュール（Admin, Individual, Corporate, etc.）が独立して存在。
    - **テスタック**: 
        - フロントエンド: **Expo (React Native) + JavaScript** (各アプリ配下の `expo_frontend/` に実装)
        - バックエンド: **Firebase + Pure Dart** (各アプリ配下の `dart_backend/` に実装)
- **ロードマップ (Phase 2)**:
    - 将来的にはモバイルフロントエンドも **Flutter** へ移行。
    - これにより、Admin/Individual/Corporate などの全アプリが **Dart で統一**され、JavaScript を完全に排除した Pure Dart プロジェクトが完成します。

### 💡 モジュラーモノリス（モノレポ）採用の根拠
本プロジェクトが旧来の技術スタック別分類ではなく、ドメイン主軸のモジュラーモノリスを採用している理由は以下の3点です。

1. **ドメイン駆動による境界の明確化**:
   技術的な役割（Apps, Shared等）ではなく、ビジネスドメイン（個人・法人・求人等）を独立した「サービス」として定義することで、将来の拡張や変更の影響範囲を局所化します。
2. **高凝集・疎結合の実現**:
   各アプリディレクトリ内に `expo_frontend` と `dart_backend` を共存させることで、一つの機能開発がそのディレクトリ内で完結するよう「凝集度」を高めています。同時に、JD（求人）や FMJS（選考・手数料）を並列なモジュールとして独立させることで、役割の「疎結合」を保ちます。
3. **Shared の健全性維持**:
   `Shared` を「何でも置き場」にせず、純粋な計算エンジン（ヒートマップ等）と共通モデルのみに限定することで、依存関係の複雑化と管理コストの増大を防ぎます。


> [!IMPORTANT]
> **バックエンドの唯一性**: バックエンド実装は Firebase + Dart に限定されており、Node.js などの他言語への依存を完全に排除する設計思想（Pure Dart）を貫いています。

---

## 📦 パッケージ管理の基本方針

本プロジェクトは、モノレポ化に伴う依存関係の複雑化とモジュール解決エラーを未然に防ぐため、**NPM Workspaces** を基盤とした一元管理を採用しています。

### 1. 依存関係の「シングルソースオブトゥルース（信頼できる唯一の情報源）」
- **コアライブラリのルート集約**:
  `react`, `react-native`, `expo`, `firebase` などの全パッケージで共通利用する基盤ライブラリは、必ず**ルートディレクトリの `package.json`** で管理します。
- **ホイスティング（Hoisting）の活用**:
  依存関係をルートに集約（ホイスティング）することで、アプリ（`apps/`）や共通部品（`shared/`）の間でバージョン競合が発生するのを防ぎ、一つの大きなプロジェクトとして安定的にビルドできる状態を維持します。

### 2. `shared` モジュールのパッケージ化
- `shared/common_frontend` などの共通ディレクトリは、単なるファイルの置き場ではなく、`@shared/common-frontend` という名称の**内部パッケージ（Workspace Package）**として定義します。
- **Skeleton（骨組み）化の徹底**:
  各ディレクトリ配下の `package.json` は、NPMワークスペースやコード補完のための「マーカー（標識）」としてのみ機能させます。
  - **原則として `dependencies` への追記は禁止**です（すべてルートで管理）。
  - 各アプリの `scripts` も最小限（`expo start` 用のみ）に留め、主要な操作はルートの `scripts` を介して行います。
- **`peerDependencies` の利用**:
  共通モジュール側で独自の `node_modules` を持たず、ルートのライブラリ（React等）を要求する `peerDependencies` 設定にすることで、メモリ効率の最適化と型定義の不整合を排除します。

### 3. モジュール解決のエラー防止（根本治療）
- **Babelエイリアスの統一**:
  `../../../../` のような相対パスではなく、エイリアス（`@shared/src/...`）を用いたインポートに統一します。
- **Metro構成の最適化**:
  新しいディレクトリが追加された際も、ルートの `node_modules` から優先的に解決するよう `metro.config.js` を調整し、ディレクトリ分割が進んでも「どこからでも確実に参照できる」状態を保証します。

-----

## 🛡️ モノレポ整合性維持のガイドライン

本セクションは、プロジェクトが拡大しても依存関係の競合やモジュール解決エラーを防ぐための「教訓」をまとめたものです。

### 🚨 絶対に守るべき原則（Critical Rules）

#### 1. **依存関係の追加は必ずルートで行う**
新しいライブラリをインストールする際は、**必ずプロジェクトのルートディレクトリ**で実行してください。

```bash
# ✅ 正しい方法（ルートで実行）
cd /path/to/engineer-registration-app-yama
npm install --save <package-name> --legacy-peer-deps

# ❌ 間違った方法（アプリディレクトリで実行）
cd apps/individual_user_app/expo_frontend
npm install <package-name>  # これは絶対に避ける
```

**理由**: アプリディレクトリで個別にインストールすると、ルートとは異なるバージョンが `node_modules` に作られ、バージョン競合や「二重解決」の原因になります。

#### 2. **プラグイン依存関係の明示的な解決**
Babel プラグインや Metro プラグインが内部で別のパッケージを要求する場合、npm alias を使用して明示的にマッピングします。

**実例**: `react-native-reanimated` v4 は内部で `react-native-worklets/plugin` を要求しますが、実際のパッケージ名は `react-native-worklets-core` です。この場合、以下のように alias を設定します。

```json
{
  "dependencies": {
    "react-native-worklets": "npm:react-native-worklets-core@^1.6.2",
    "react-native-worklets-core": "^1.6.2"
  }
}
```

#### 3. **相対パスの禁止（境界を越える場合）**
`apps/` から `shared/` へのインポートは、**必ず Babel エイリアス（`@shared`）を使用**してください。

```javascript
// ✅ 正しい方法
import { THEME } from '@shared/src/core/theme/theme';

// ❌ 間違った方法
import { THEME } from '../../../../shared/common_frontend/src/core/theme/theme';
```

**理由**: 相対パスはディレクトリ構造の変更に脆弱で、Metro の解決順序によっては失敗する可能性があります。

#### 4. **サブパッケージの `package.json` は「標識」として扱う**
`apps/*/expo_frontend/package.json` や `shared/*/package.json` は、NPM Workspaces の識別用マーカーです。

- **編集禁止項目**: `dependencies`, `devDependencies`（Expo 必須モジュールを除く）
- **編集可能項目**: `name`, `version`, `main`, `scripts`

新しいライブラリが必要な場合は、必ずルートの `package.json` に追加してください。

### 🔍 定期的なチェック項目（Periodic Audits）

新しいアプリやサービスを追加した際は、以下を確認してください。

#### 1. **重複した `node_modules` の検出**
```bash
find . -name "node_modules" -type d | grep -v "^\./node_modules"
```

このコマンドで何か表示された場合、サブディレクトリに不要な `node_modules` が作られています。削除してルートで再インストールしてください。

#### 2. **相対パスインポートの検出**
```bash
grep -r "from '\.\./\.\./\.\./" apps/ --exclude-dir=node_modules
```

結果が表示された場合、エイリアスへの変換が必要です。

#### 3. **Babel/Metro 設定の一貫性確認**
すべてのアプリで `babel.config.js` と `metro.config.js` が同一の構造を持っているか確認してください。特に以下の項目：

- **Babel**: `@shared` エイリアスの定義
- **Metro**: `workspaceRoot` の設定、`EXPO_USE_METRO_WORKSPACE=1` の環境変数

### 📋 新規アプリ追加時のチェックリスト

新しいアプリ（例: `apps/recruiter_user_app`）を追加する際は、以下の手順を厳守してください。

1. **ディレクトリ構造の作成**
   ```
   apps/recruiter_user_app/expo_frontend/
   ├── App.js
   ├── index.js
   ├── package.json (最小限の標識)
   ├── babel.config.js (既存アプリからコピー)
   ├── metro.config.js (既存アプリからコピー)
   └── src/
   ```

2. **`package.json` の作成**（テンプレート）
   ```json
   {
     "name": "recruiter-user-app",
     "version": "1.0.0",
     "main": "index.js",
     "private": true,
     "scripts": {
       "start": "expo start --tunnel --clear"
     },
     "dependencies": {
       "expo": "~54.0.29",
       "expo-asset": "~12.0.12",
       "expo-constants": "~18.0.12",
       "expo-linking": "~8.0.11",
       "expo-router": "~6.0.21",
       "@shared/common-frontend": "*"
     }
   }
   ```

3. **ルートの `package.json` に起動スクリプトを追加**
   ```json
   {
     "scripts": {
       "start:recruiter": "EXPO_USE_METRO_WORKSPACE=1 npm start --workspace=recruiter-user-app"
     }
   }
   ```

4. **依存関係の再構築**
   ```bash
   npm install --legacy-peer-deps
   ```

5. **動作確認**
   ```bash
   npm run start:recruiter
   ```

### ⚠️ トラブルシューティング

#### 問題: "Cannot find module" エラー
**原因**: プラグインの内部依存関係が解決できていない  
**解決策**: npm alias を使用して明示的にマッピング（上記「原則2」参照）

#### 問題: バージョン競合エラー
**原因**: サブディレクトリで個別にインストールされたパッケージが存在  
**解決策**: 
```bash
rm -rf apps/*/expo_frontend/node_modules shared/*/node_modules
npm install --legacy-peer-deps
```

#### 問題: Metro が `@shared` を解決できない
**原因**: `babel.config.js` のエイリアス設定が不足、または Metro のキャッシュが古い  
**解決策**:
```bash
npm run start:individual -- --clear
```

---

##  セキュリティ & 品質

- **データ保護**: Firestore セキュリティルールによる厳格なアクセス制御。
- **品質目標**: 品質保証方針として「軽微な警告も即解消」を徹底。
- **検証**: Playwright による E2E テスト、Dart によるバックエンドロジックの統合検証。