# Dart Coding Conventions & Migration Guide (Full-stack Dart Edition)

## 1. 概要 (Overview)
本ドキュメントは、**Full-stack Dart アーキテクチャ** (Flutter Frontend & Dart Backend) への移行を見据え、現在 Expo (JS/TS) で開発を行っているエンジニアが、スムーズに Dart へ適応できるための標準規約およびガイドラインです。

JavaScript/TypeScript との比較を交えながら、**「拒絶反応を減らし、かつ Dart の型安全性の恩恵を最大化する」** ことを目的としています。
本規約は、フロントエンド (Flutter) とバックエンド (Dart Server) の両方に適用されます。

---

## 2. 基本原則 (Core Principles)

### 🛡 Type Safe & Null Safe
Dart の最大の特徴は堅牢な型システムです。TS の `any` にあたる `dynamic` は、**移行期の一時的な回避策を除き、基本的には使用禁止**とします。
また、`null` 参照エラーを防ぐため、Nullable (`?`) と Non-nullable を明確に意識してコーディングします。

### 🔒 Immutability (不変性)
React のステート管理と同様、予測可能なコードを書くために**不変性**を重視します。
変数はデフォルトで `final` を使用し、本当に再代入が必要な場合のみ `var` を使用します。

---

## 3. JS開発者向けクイックマッピング (JS vs Dart)

JavaScript/TypeScript の知識をそのまま活かせる部分と、Dart 独自の概念を対比します。

| 概念 | JavaScript / TypeScript | Dart | 解説 |
| :--- | :--- | :--- | :--- |
| **定数** | `const` | `final` / `const` | 実行時に決まる値 (APIのレスポンス等) は `final`。コンパイル時定数 (設定値等) は `const`。 |
| **変数** | `let` | `var` | 型推論が効くため、基本的に `var` でOK。型を明記しても良い。 |
| **文字列** | `` `Hello ${name}` `` | `'Hello $name'` | `${}` はプロパティアクセス時 (`${user.name}`) のみ必要。単体の変数は `$` だけでOK。 |
| **非同期** | `Promise` / `async` / `await` | `Future` / `async` / `await` | 構文はほぼ同じ。`Promise.all` は `Future.wait`。 |
| **Null** | `null` / `undefined` | `null` | **Dart に `undefined` は存在しない。** 値が無い場合はすべて `null`。 |
| **オブジェクト** | `{ key: 'value' }` (Object) | `Map` または `Class` | Dart ではデータ構造には `Class` を定義することを強く推奨 (型安全のため)。 |
| **配列** | `[1, 2, 3]` (Array) | `List` (`[1, 2, 3]`) | 操作メソッド (`map`, `filter` -> `where`) は似ているが名前が違う場合がある。 |
| **ログ** | `console.log()` | `print()` / `debugPrint()` | 開発中は `print` でOK。 |

---

## 4. コーディングスタイル (Coding Style)

### 4.1 変数宣言 (Variables)
JS の `const` の感覚で、**基本は `final`** を使用してください。

```dart
// Good
final userName = 'Yama';
final userCount = await fetchUserCount(); // 非同期の結果も final

// Bad (再代入しないのに var を使う)
var userName = 'Yama'; 

// Note: 型を明示するか推論させるかはチームの方針によるが、右辺で明らかなら推論推奨
final List<String> items = []; // 空配列の場合は型指定が必要なことが多い
```

### 4.2 関数と引数 (Functions & Parameters)
Flutter/Dart では、引数が多い場合 **名前付き引数 (Named Parameters)** を使うのが一般的です。
これは JS の「オブジェクトを引数にして分割代入する」パターンに非常に近いです。

```dart
// JS style
// function updateUser({ id, name }) { ... }

// Dart style
void updateUser({required String id, String? name}) {
  // required があると必須、なければ省略可能 (Nullableにするかデフォルト値が必要)
}

// 呼び出し
updateUser(id: '123', name: 'New Name');
```

### 4.3 Null Safety の扱い
JS のオプショナルチェーン (`?.`) と Null合体演算子 (`??`) は Dart でもそのまま使えます。

```dart
// JS & Dart 共通
final displayName = user?.profile?.nickname ?? 'Guest';
```

**注意**: `!` (Bang operator) は「絶対に null ではない」と断言できる時以外は使わないでください。クラッシュの原因になります。

### 4.4 プライベート変数
Dart に `private` キーワードはありません。変数名やメソッド名の先頭に `_` (アンダースコア) を付けると、そのファイル (ライブラリ) 内でのみアクセス可能になります。

```dart
class UserManager {
  String _apiKey = 'secret'; // private
  
  void login() { ... } // public
}
```

---

## 5. Dart 開発の推奨習慣 (Frontend & Backend)

### 5.1 末尾カンマ (Trailing Commas)
Flutter の Widget ツリーや、バックエンドのネストしたルーティング定義など、Dart では階層が深くなりがちです。
引数リストや定義の**最後に必ずカンマ `,` を付ける**癖をつけてください。
これにより、`dart format` がコードをきれいに整形し、可読性が劇的に向上します。

```dart
// Good
User(
  name: 'Yama',
  age: 30, // <--- このカンマが超重要！
);

// Router Definition (Backend)
app.post('/api/v1/user', (Request request) async {
  // ...
}); // <--- ここもカンマやセミコロンを忘れない
```

### 5.2 データモデルのクラス化
JS ではプレーンなオブジェクト (`{}`) を多用しますが、Dart では **クラス** を定義して型を付けるのが基本です。
フロントエンド・バックエンド共通の `shared` ディレクトリ等でモデルを定義し、再利用します。

---

## 6. バックエンド開発の留意点 (Backend Specifics)

### 6.1 エラーハンドリング (Error Handling)
サーバーサイドでは、未処理の例外でプロセスがクラッシュすることを防ぐ必要があります。
`try-catch` ブロックを適切に使用し、エラー発生時も適切な HTTP ステータスコードを返すようにします。

```dart
try {
  final result = await service.process();
  return Response.ok(result);
} catch (e, stackTrace) {
  print('Error: $e\n$stackTrace'); // 実際はロガーを使用
  return Response.internalServerError(body: 'Internal Server Error');
}
```

### 6.2 非同期処理の並列化 (Concurrency)
JS の `Promise.all` と同様に、依存関係のない複数の非同期処理は `Future.wait` で並列実行し、レスポンス時間を短縮します。

```dart
// Good: 並列実行
final results = await Future.wait([
  db.fetchUser(uid),
  db.fetchJobs(uid),
]);
final user = results[0];
final jobs = results[1];
```

### 6.3 ログ出力 (Logging)
`print` は開発時のみ使用し、本番環境（特にバックエンド）では `logging` パッケージ等の構造化ロガーを使用することを推奨します。標準出力のバッファリング問題を回避するためです。

---

## 6. リンターとフォーマッター
プロジェクトには標準で `flutter_lints` 推奨の設定が含まれます。
VS Code の設定で「保存時にフォーマット (Format On Save)」を有効にしてください。

- **Lint**: 静的解析でエラーや警告を出します。
- **Format**: `dart format` コマンドでコードスタイルを自動統一します。

---

## 7. まとめ
Dart は「型のある JavaScript」として、JS 開発者にとって非常に親しみやすい言語です。
以下の3点を意識すれば、すぐに書き始めることができます。

1.  変数は `final` で宣言する。
2.  `null` の可能性を常に意識する (`?` をつける)。
3.  引数には名前をつける (`{}` を使う)。
