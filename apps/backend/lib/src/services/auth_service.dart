import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:googleapis_auth/auth_io.dart' as auth;

class AuthService {
  final String _projectId;
  final auth.ServiceAccountCredentials _credentials;
  static const _scopes = ['https://www.googleapis.com/auth/cloud-platform'];

  AuthService._(this._projectId, this._credentials);

  /// サービスアカウントキーファイルから AuthService を初期化します
  static Future<AuthService> firebase() async {
    // プロジェクトのルートにある serviceAccountKey.json を読み込む
    // Note: server.dart は apps/backend/bin/ にあるため、ルートは ../../
    final keyFile = File('../../serviceAccountKey.json');
    if (!await keyFile.exists()) {
      throw Exception('Service account key file not found at ${keyFile.absolute.path}');
    }

    final data = json.decode(await keyFile.readAsString());
    return AuthService._(
      data['project_id'],
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

      print('Successfully set custom claims for $uid: $claims');
    } finally {
      client.close();
    }
  }
}
