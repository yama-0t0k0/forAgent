import 'dart:convert';
import 'dart:io';
import 'package:googleapis_auth/auth_io.dart' as auth;
import 'package:logging/logging.dart';

class AuthService {
  static final Logger _logger = Logger('AuthService');
  static const String _serviceAccountKeyPath = '../../serviceAccountKey.json';
  static const String _envServiceAccountKeyPath = 'SERVICE_ACCOUNT_KEY_PATH';
  static const String _envGoogleApplicationCredentials = 'GOOGLE_APPLICATION_CREDENTIALS';
  static const List<String> _scopes = <String>[
    'https://www.googleapis.com/auth/cloud-platform',
  ];

  final String _projectId;
  final auth.ServiceAccountCredentials _credentials;

  AuthService._(this._projectId, this._credentials);

  /// サービスアカウントキーファイルまたは環境変数から AuthService を初期化します
  static Future<AuthService> firebase() async {
    Map<String, dynamic>? data;

    // 1. 環境変数から JSON 文字列を直接読み込む試行
    final jsonString = Platform.environment['FIREBASE_SERVICE_ACCOUNT_JSON'];
    if (jsonString != null && jsonString.isNotEmpty) {
      try {
        data = json.decode(jsonString) as Map<String, dynamic>;
        _logger.info('Initialized using FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
      } catch (e) {
        _logger.warning('Failed to decode FIREBASE_SERVICE_ACCOUNT_JSON: $e');
      }
    }

    // 2. ファイルの読み込み試行（既存互換）
    if (data == null) {
      final keyPath = Platform.environment[_envServiceAccountKeyPath] ??
          Platform.environment[_envGoogleApplicationCredentials] ??
          _serviceAccountKeyPath;
      final keyFile = File(keyPath);
      if (await keyFile.exists()) {
        try {
          data = json.decode(await keyFile.readAsString()) as Map<String, dynamic>;
          _logger.info('Initialized using service account key file: $keyPath');
        } catch (e) {
          throw Exception('Failed to decode service account key file: $e');
        }
      }
    }

    if (data == null) {
      throw Exception('No service account credentials found (checked ENV and file)');
    }

    final projectIdRaw = data['project_id'];
    if (projectIdRaw is! String || projectIdRaw.trim().isEmpty) {
      throw Exception('project_id is missing in service account key JSON');
    }
    final projectId = projectIdRaw.trim();
    return AuthService._(
      projectId,
      auth.ServiceAccountCredentials.fromJson(data),
    );
  }

  /// 指定した UID に対してカスタムクレーム（ロール等）を付与します
  Future<void> setCustomClaims(String uid, Map<String, dynamic> claims) async {
    final client = await auth.clientViaServiceAccount(_credentials, _scopes);

    try {
      final url = 'https://identitytoolkit.googleapis.com/v1/projects/$_projectId/accounts:update';

      final response = await client.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'localId': uid,
          'customAttributes': json.encode(claims),
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to set custom claims: ${response.body}');
      }

      _logger.info('Successfully set custom claims for $uid: $claims');
    } finally {
      client.close();
    }
  }
}
