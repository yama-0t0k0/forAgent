module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-template-literals',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@shared': '../../../shared/common_frontend',
            '@job_app': '../../../apps/job_description/expo_frontend',
            '@corporate_app': '../../../apps/corporate_user_app/expo_frontend',
            '@individual_app': '../../../apps/individual_user_app/expo_frontend',
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
