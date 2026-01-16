// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'engineer_profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

EngineerProfile _$EngineerProfileFromJson(Map<String, dynamic> json) =>
    EngineerProfile(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String,
    );

Map<String, dynamic> _$EngineerProfileToJson(EngineerProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'email': instance.email,
    };
