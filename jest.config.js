module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/firestore.test.js',
    '<rootDir>/shared/common_frontend/tests/heatmap_geometry.spec.js',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/common_frontend/$1',
    '^@job_app/(.*)$': '<rootDir>/apps/job_description/expo_frontend/$1',
    '^@corporate_app/(.*)$': '<rootDir>/apps/corporate_user_app/expo_frontend/$1',
    '^@individual_app/(.*)$': '<rootDir>/apps/individual_user_app/expo_frontend/$1',
    '^@assets/(.*)$': '<rootDir>/apps/admin_app/expo_frontend/assets/$1',
    '^@features/(.*)$': '<rootDir>/apps/admin_app/expo_frontend/src/features/$1',
    '^@core/(.*)$': '<rootDir>/apps/admin_app/expo_frontend/src/core/$1',
  }
};
