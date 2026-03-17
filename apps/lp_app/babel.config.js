module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@shared': '../../shared/common_frontend',
            '@assets': './assets',
            '@features': './src/features',
            '@core': './src/core',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
