# JavaScript コーディング規約 (Phase 1.5)
**〜Flutter (Dart) への円滑な移行を見据えた記述スタイル〜**

本プロジェクトは将来的にFlutterへの移行を予定しています。
そのため、JavaScriptコードであっても静的型付け言語（Dart）の構造や概念に寄せた記述を行うことで、将来的な移植コストの最小化を目指します。

---

## 1. 基本原則：Dartライクな記述

### 1.1 クラスベースのデータ構造
複雑なデータ構造はオブジェクトリテラル（`{}`）ではなく、ES6クラスを使用して定義してください。これにより、Dart移行時にそのままクラス定義として移植可能になります。

**❌ Bad (単なる連想配列)**
```javascript
const user = {
  name: 'Tanaka',
  age: 30,
  isActive: true
};
```

**✅ Good (クラス定義)**
```javascript
class User {
  /**
   * @param {string} name 
   * @param {number} age 
   * @param {boolean} isActive 
   */
  constructor(name, age, isActive = false) {
    this.name = name;
    this.age = age;
    this.isActive = isActive;
  }
}
const user = new User('Tanaka', 30, true);
```

### 1.2 変数初期化とNull Safety対策
DartのNull Safety（Null許容性の厳格化）を意識し、変数は宣言時に可能な限り初期化してください。`undefined` は極力使用せず、値がない場合は `null` を明示的に代入してください。

**❌ Bad (undefined放置)**
```javascript
let title;      // undefinedかstringか不明
let count;
```

**✅ Good (型を確定させる初期化)**
```javascript
let title = ""; // string型として確定
let count = 0;  // int型として確定
let user = null; // null許容のオブジェクトとして確定
```

---

## 2. 型定義：JSDocの義務化

すべての関数、メソッド、主要な変数にはJSDocを使用して型を明記してください。これにより、IDEの型チェック機能を有効活用し、Dart移行時の型決定の拠り所とします。

### 2.1 関数の型定義
引数と戻り値の型を必ず記載してください。

```javascript
/**
 * ユーザーの有効性を検証する
 * @param {string} userId - ユーザーID
 * @param {number} loginCount - ログイン回数
 * @returns {boolean} - 有効な場合true
 */
const isValidUser = (userId, loginCount) => {
  return !!userId && loginCount > 0;
};
```

### 2.2 複雑なオブジェクトの型定義
`@typedef` を使用して、Dartのクラスやインターフェースに相当する型定義を行ってください。

```javascript
/**
 * @typedef {Object} JobDescription
 * @property {string} id - 求人ID
 * @property {string} title - 求人タイトル
 * @property {number} [salary] - 給与（省略可能）
 */

/**
 * @param {JobDescription} job
 */
const processJob = (job) => { ... }
```

---

## 3. 定数管理：Enumライクな記述

マジックナンバーや文字列リテラルの直接使用を避け、オブジェクトを `const` で定義してEnum（列挙型）のように扱ってください。

**❌ Bad (文字列リテラル)**
```javascript
if (status === 'pending') { ... }
```

**✅ Good (Enumライクな定数)**
```javascript
/**
 * @readonly
 * @enum {string}
 */
const UserStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
};

if (status === UserStatus.PENDING) { ... }
```

---

## 4. ファイル・ディレクトリ構成

- ファイル名は `camelCase` ではなく、クラスを含むファイルは `PascalCase`（例: `UserDetailModal.js`）、ユーティリティや関数群は `camelCase`（例: `dateUtils.js`）とします（Dart/Flutterの慣習とは異なりますが、現在のReact Nativeの慣習に合わせつつ、中身はクラス構造を意識します）。
- Sharedコンポーネントは、将来的にFlutterのPackageとして切り出せるよう、依存関係を疎結合に保ってください。

---

## 5. チェックリスト（PR提出前）

- [ ] 変数は宣言時に初期化されているか？（`undefined` になっていないか）
- [ ] JSDocで引数と戻り値の型が明記されているか？
- [ ] データ構造はクラス（または明確な構造体）として定義されているか？
- [ ] マジックナンバーを使用せず、定数（Enum）を使用しているか？

---

## 6. 本規約遵守のメリット（JS環境での継続運用における価値）

本規約に従って実装することは、将来的なDart移行を円滑にするだけでなく、仮にJavaScript/React Nativeでの運用を継続する場合においても、技術的負債を最小化し、以下の多大なメリットをもたらします。

1.  **可読性と保守性の向上**:
    JSDocによる型定義とクラスベースのデータ構造化により、コードが自己文書化されます。「どのデータがどこにあるか」が一目で理解できるようになり、スパゲッティコード化を防ぎます。

2.  **変更影響範囲の極小化**:
    データアクセスをモデルクラスやユーティリティに隠蔽することで、APIレスポンスの構造変更などの影響を局所化できます。これにより、機能追加や改修時のバグ発生リスクを大幅に低減します。

3.  **テスト容易性の向上**:
    ビジネスロジックをUIから切り出し、純粋な関数やクラスとして定義することで、UIレンダリングに依存しない高速かつ堅牢なユニットテストが可能になります。

4.  **オンボーディングコストの削減**:
    構造化されたコードベースは、新規参画メンバーにとって理解しやすく、学習コストを大幅に削減します。

---

## 付録: TypeScriptへの移行を行わず、JavaScript改善から直接Flutter(Dart)へ移行する理由

TypeScriptへのリプレイス（JS → TS → Dart）という二段階の移行プロセスを採用せず、現在のJavaScriptコードを改善した上で直接Flutter(Dart)へ移行する（JS → Dart）戦略を採用した理由は以下の通りです。

1.  **二重の移行コストの削減**:
    TypeScript化には型定義の追加やビルド構成の変更など、多大な工数が必要です。最終目標がDart（静的型付け言語）である以上、TypeScript化で行う型定義作業の多くはDart移行時に再度やり直すことになり、二度手間となります。

2.  **ロジックと構造の整理への集中**:
    現在の課題は「型がないこと」よりも「コンポーネントの責任範囲が不明確」「ビジネスロジックがUIに結合している」といった構造的な問題です。JSDocとリファクタリングによってこれらの構造的問題を解決する方が、Dartへの移行準備として本質的かつ効率的です。

3.  **移行期間の短縮**:
    TypeScript化を経由することで開発サイクルが長期化し、Flutter移行への着手が遅れるリスクがあります。JSコードの品質を「Dartに移植しやすい状態（Classベース、明確な入出力）」に高めることに注力することで、最短経路でのFlutter移行を目指します。

---

## 付録: リファクタリングロードマップ

Dart移行を見据えた、手戻りの少ない効率的なリファクタリング順序は以下の通りです。
基本原則は **「データモデル（Shared）→ ビジネスロジック（Shared）→ 各アプリのUI（Leaf Apps → Admin App）」** です。

### 1. 【最優先】Shared領域へのモデル定義 (Data Modeling)
Dart移行において最も重要な「型（クラス設計）」の基盤を作成します。
生JSONを各画面でパースする現状を改め、`shared/common_frontend/src/core/models/` にモデルクラスを集約します。

*   **作成対象**:
    *   `User.js` (個人ユーザー: `individual_user_app`用)
    *   `Company.js` (企業情報: `CompanyAdapter.js`の代替・強化)
    *   `JobDescription.js` (求人票: `job_description`用)

### 2. Shared Utilitiesの型適用 (Service Layer)
既存のユーティリティ（例: `CompanyAdapter.js`）が、生JSONではなく上記モデルクラスを扱う（または生成する）ように修正します。

### 3. Individual User App (Feature Layer 1)
個人アプリの主要画面（`MyPageScreen.js`等）を、生JSONアクセス（`data['基本情報']`）からモデルプロパティアクセス（`user.firstName`）に変更します。

### 4. Job Description App (Feature Layer 2)
求人詳細画面などを同様にモデルベースにリファクタリングします。

### 5. FMJS App (Feature Layer 3)
FMJS（Fee Management & Job Status）は選考進捗や契約管理を扱うため、`SelectionProgress`モデルや契約関連モデルの整備と合わせてリファクタリングを実施します。
特に`SelectionProgressListScreen.js`等の主要画面で、生Firestoreデータアクセスを排除します。

### 6. Admin App (Integration Layer)
個人・企業・求人・FMJSの全データを扱う最も複雑なアプリであるため、1〜5のモデルが揃ってから着手します。
これにより、Adminアプリ特有の「データの混在」や「不整合」を防ぎやすくなります。
