module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/security_stub/verify_rules_authenticated.test.js',
    '**/firestore.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/'
  ]
};
