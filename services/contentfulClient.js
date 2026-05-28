import { createClient } from 'contentful';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra;
const config = {
  space: extra?.contentfulSpace || extra?.EXPO_PUBLIC_CONTENTFUL_SPACE,
  accessToken: extra?.contentfulAccessToken || extra?.EXPO_PUBLIC_CONTENTFUL_ACCESS_TOKEN,
  environment: extra?.contentfulEnvironment || extra?.EXPO_PUBLIC_CONTENTFUL_ENVIRONMENT || 'master'
};

const contentfulClient = createClient(config);

export default contentfulClient;