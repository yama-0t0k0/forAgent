module.exports = ({ config }) => {
  const appMode = process.env.EXPO_PUBLIC_APP_MODE;
  let appName = "my-expo-app";

  if (appMode === 'engineer') {
    appName = "個人マイページ";
  } else if (appMode === 'company') {
    appName = "企業プロフィール登録";
  }

  return {
    ...config,
    name: appName,
    slug: "my-expo-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
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
