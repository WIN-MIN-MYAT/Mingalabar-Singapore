import 'dotenv/config';

export default {
  name: 'Mingalabar SG',
  slug: 'mingalabar-sg',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.nimbo.mingalabarsg'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.nimbo.mingalabarsg',
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || 'AIzaSyDcq1d_0EsXY0QK5wpSdY4rUXstiTkpBJY'
      }
    }
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    "eas": {
        "projectId": "c395df2c-6713-408c-be19-dffc3e06c3a2"
      },
    contentfulSpace: process.env.EXPO_PUBLIC_CONTENTFUL_SPACE,
    contentfulAccessToken: process.env.EXPO_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
    contentfulEnvironment: process.env.EXPO_PUBLIC_CONTENTFUL_ENVIRONMENT,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    klipyApiKey: process.env.EXPO_PUBLIC_KLIPY_API_KEY
  },
  plugins: ['expo-web-browser']
};