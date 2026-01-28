/**
 * Babel Configuration
 *
 * @param {import('@babel/core').API} api
 * @returns {import('@babel/core').TransformOptions}
 */
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
                        '@individual_app': '../../../apps/individual_user_app/expo_frontend',
                        '@assets': './assets',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
