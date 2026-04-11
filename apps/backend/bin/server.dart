// ignore_for_file: avoid_print

// 機能概要:
// - Dartバックエンドサーバーのエントリーポイント (Cloud Run対応)
// - Shelf Routerを使用したHTTPリクエストハンドリング
// - ミドルウェアによるリクエストログ出力
//
// ディレクトリ構造:
// engineer-registration-app-yama/yama/apps/backend/bin/server.dart
//
// デプロイ・実行方法:
// - ローカル実行: dart bin/server.dart
// - Cloud Runデプロイ: gcloud run deploy ...

import 'dart:convert';
import 'dart:io';

import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';
import 'package:shelf_router/shelf_router.dart';
import '../lib/src/services/auth_service.dart';

// Configure routes.
final _router = Router()
  ..get('/', _rootHandler)
  ..get('/echo/<message>', _echoHandler)
  ..post('/api/v1/auth/set-role', _setRoleHandler);

Response _rootHandler(Request req) {
  return Response.ok('Hello, World! This is the Full-stack Dart Backend on Cloud Run.\n');
}

Response _echoHandler(Request request) {
  final message = request.params['message'];
  return Response.ok('$message\n');
}

Future<Response> _setRoleHandler(Request request) async {
  try {
    final payload = json.decode(await request.readAsString());
    final uid = payload['uid'];
    final role = payload['role'];

    if (uid == null || role == null) {
      return Response.badRequest(body: 'Missing uid or role');
    }

    final authService = await AuthService.firebase();
    await authService.setCustomClaims(uid, {'role': role});

    return Response.ok(json.encode({'status': 'success', 'uid': uid, 'role': role}),
        headers: {'Content-Type': 'application/json'});
  } catch (e) {
    return Response.internalServerError(body: 'Error setting role: $e');
  }
}

void main(List<String> args) async {
  // Use any available host or container IP (usually `0.0.0.0`).
  final ip = InternetAddress.anyIPv4;

  // Configure a pipeline that logs requests.
  final handler = Pipeline().addMiddleware(logRequests()).addHandler(_router.call);

  // For running in containers, we respect the PORT environment variable.
  final port = int.parse(Platform.environment['PORT'] ?? '8080');

  final server = await serve(handler, ip, port);
  print('Server listening on port ${server.port}');
}
