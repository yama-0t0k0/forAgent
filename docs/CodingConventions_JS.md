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
