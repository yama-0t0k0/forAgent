// 役割（機能概要）:
// - エンジニアの基本プロフィール情報を表すドメインモデル
// - ID, 氏名, メールアドレスなどの基本属性を保持
// - Equatableによる値等価性の比較
// - JSONシリアライズ対応
//
// ディレクトリ構造:
// shared/domain_models/lib/src/engineer_profile.dart
//
// デプロイ・実行方法:
// - コード生成: dart run build_runner build

import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'engineer_profile.g.dart';

@JsonSerializable()
class EngineerProfile extends Equatable {
  final String id;
  final String firstName;
  final String lastName;
  final String email;

  const EngineerProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  factory EngineerProfile.fromJson(Map<String, dynamic> json) =>
      _$EngineerProfileFromJson(json);

  Map<String, dynamic> toJson() => _$EngineerProfileToJson(this);

  @override
  List<Object?> get props => [id, firstName, lastName, email];
}
