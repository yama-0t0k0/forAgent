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
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
