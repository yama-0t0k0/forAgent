module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[t|j]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)',
  ],
};
