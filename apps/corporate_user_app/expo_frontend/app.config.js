/**
 * Expo Config
 * https://docs.expo.dev/workflow/configuration/
 *
 * @param {import('expo/config').ConfigContext} configContext
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  return {
    ...config,
    name: "企業プロフィール登録",
    slug: "corporate-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    plugins: [
      "expo-asset",
      "expo-router"
    ],
    splash: {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    ios: {
      "supportsTablet": true
    },
    android: {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true
    },
    web: {
      "favicon": "./assets/favicon.png"
    }
  };
};
