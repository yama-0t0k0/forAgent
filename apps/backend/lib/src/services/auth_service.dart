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

  /// サービスアカウントキーファイルから AuthService を初期化します
  static Future<AuthService> firebase() async {
    // プロジェクトのルートにある serviceAccountKey.json を読み込む
    // Note: server.dart は apps/backend/bin/ にあるため、ルートは ../../
    final keyPath = Platform.environment[_envServiceAccountKeyPath] ??
        Platform.environment[_envGoogleApplicationCredentials] ??
        _serviceAccountKeyPath;
    final keyFile = File(keyPath);
    if (!await keyFile.exists()) {
      throw Exception('Service account key file not found at ${keyFile.absolute.path}');
    }

    final Map<String, dynamic> data =
        json.decode(await keyFile.readAsString()) as Map<String, dynamic>;
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
