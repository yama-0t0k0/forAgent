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
            '@shared': '../../../shared/common_frontend',
            '@job_app': '../../../apps/job_description/expo_frontend',
            '@corporate_app': '../../../apps/corporate_user_app/expo_frontend',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
