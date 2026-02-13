module.exports = ({ config }) => {
  // 環境変数 PORT が 8086 (auth_portal) の場合は表示名を変更
  const isAuthPortal = process.env.PORT === '8086';
  const appName = isAuthPortal ? "ログイン画面" : "管理画面";

  return {
    ...config,
    name: appName,
    slug: "admin-app",
    version: "1.0.0",
    scheme: "admin-app",
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
