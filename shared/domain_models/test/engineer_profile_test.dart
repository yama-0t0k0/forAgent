import 'package:domain_models/domain_models.dart';
import 'package:test/test.dart';

void main() {
  group('EngineerProfile', () {
    test('supports value equality', () {
      final profile1 = EngineerProfile(
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      );
      final profile2 = EngineerProfile(
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      );

      expect(profile1, equals(profile2));
    });

    test('props contains all properties', () {
      final profile = EngineerProfile(
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      );

      expect(profile.props, equals(['1', 'John', 'Doe', 'john@example.com']));
    });

    test('toJson returns correct map', () {
      final profile = EngineerProfile(
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      );

      expect(profile.toJson(), {
        'id': '1',
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john@example.com',
      });
    });
  });
}
