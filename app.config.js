import 'dotenv/config';

export default {
  name: 'mg-sg',
  slug: 'mg-sg',
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
    bundleIdentifier: 'com.mgsg.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.mgsg.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    contentfulSpace: process.env.EXPO_PUBLIC_CONTENTFUL_SPACE,
    contentfulAccessToken: process.env.EXPO_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
    contentfulEnvironment: process.env.EXPO_PUBLIC_CONTENTFUL_ENVIRONMENT,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL
  },
  plugins: ['expo-web-browser']
};