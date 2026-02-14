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

## 6. バックエンド開発の留意点 (Backend Focus)

Pure Dart でのサーバーサイド開発 (Cloud Run / Cloud Functions) における特有の注意点です。

### 6.1 エラーハンドリングとHTTPステータス
サーバーサイドでは、未処理の例外でプロセスがクラッシュすることを防ぐ必要があります。
`try-catch` ブロックを適切に使用し、エラー発生時も適切な HTTP ステータスコードを返してください。

```dart
// Good Pattern
Future<Response> handler(Request request) async {
  try {
    // バリデーション
    if (invalid) return Response.badRequest(body: 'Invalid data');
    
    final result = await service.process();
    return Response.ok(result);
  } catch (e, stackTrace) {
    // ログには詳細を残すが、クライアントには汎用的なメッセージを返す
    print('Error: $e\n$stackTrace'); 
    return Response.internalServerError(body: 'Internal Server Error');
  }
}
```

### 6.2 コールドスタート対策
Cloud Run や Functions はリクエストがない時にインスタンスが停止します（コールドスタート）。
初期化コストの高い処理（DB接続の確立や設定ファイルの読み込みなど）は、**ハンドラ関数の外側（グローバルスコープ）**で行い、再利用可能にしてください。

```dart
// Good: ハンドラの外で初期化（再利用される）
final _firestore = FirebaseFirestore.instance;
final _service = MyService(_firestore);

Future<Response> handler(Request request) async {
  // _service をそのまま使う
  return _service.handle(request);
}
```

### 6.3 環境変数の利用
APIキーや接続文字列などの機密情報は、コードにハードコードせず `Platform.environment` を使用して取得してください。

```dart
import 'dart:io';

final apiKey = Platform.environment['API_KEY'] ?? '';
if (apiKey.isEmpty) {
  throw Exception('API_KEY is not set');
}
```

---

## 7. フロントエンド開発の留意点 (Frontend Focus)

Flutter での UI 開発における特有の注意点です。

### 7.1 build メソッドの軽量化
Widget の `build` メソッドは頻繁に呼び出されます。
この中で重い処理（API通信や複雑な計算）を行うと、UIがカクつく原因になります。
重い処理は `initState` や `Provider` / `Riverpod` のロジック内で行ってください。

### 7.2 非同期処理と UI の整合性
`await` の後に `context` を使用する場合は、Widget がまだマウントされているか確認してください。
非同期処理中に画面遷移が行われると、古い `context` を参照してエラーになることがあります。

```dart
// Good
final result = await api.fetchData();
if (!context.mounted) return; // マウント確認

Navigator.of(context).push(...);
```

### 7.3 定数コンストラクタ (const)
変更されない Widget には `const` を付けることで、Flutter が再描画をスキップし、パフォーマンスが向上します。
IDE の推奨に従って `const` を積極的に付けてください。

```dart
// Good
const Text('Hello World'); // 常に同じ表示なら const
```

---

## 8. リンターとフォーマッター
プロジェクトには標準で `flutter_lints` 推奨の設定が含まれます。
VS Code の設定で「保存時にフォーマット (Format On Save)」を有効にしてください。

- **Lint**: 静的解析でエラーや警告を出します。
- **Format**: `dart format` コマンドでコードスタイルを自動統一します。

---

## 9. まとめ
Dart は「型のある JavaScript」として、JS 開発者にとって非常に親しみやすい言語です。
以下の3点を意識すれば、すぐに書き始めることができます。

1.  変数は `final` で宣言する。
2.  `null` の可能性を常に意識する (`?` をつける)。
3.  引数には名前をつける (`{}` を使う)。
