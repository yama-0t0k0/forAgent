const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  let appMode = process.env.EXPO_PUBLIC_APP_MODE;

  // Fallback to reading from file if env var is not set
  try {
    const configPath = path.join(__dirname, 'src/apps/mode_config.js');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const match = configContent.match(/APP_MODE = ['"]([^'"]+)['"]/);
      if (match) {
        appMode = match[1];
      }
    }
  } catch (e) {
    console.error('Error reading mode_config.js:', e);
  }

  let appName = "my-expo-app";

  if (appMode === 'engineer') {
    appName = "エンジニア個人登録";
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
