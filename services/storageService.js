import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@mg_sg_onboarding_completed';
const THEME_KEY = '@mg_sg_theme';
const LANGUAGE_KEY = '@mg_sg_language';

export const storageService = {
  async hasCompletedOnboarding() {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading onboarding status:', error);
      return false;
    }
  },

  async setOnboardingCompleted(completed = true) {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  async clearOnboarding() {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch (error) {
      console.error('Error clearing onboarding status:', error);
    }
  },

  // Theme ('light' | 'dark' | 'system')
  async getTheme() {
    try {
      return await AsyncStorage.getItem(THEME_KEY);
    } catch (error) {
      console.error('Error reading theme:', error);
      return null;
    }
  },

  async setTheme(mode) {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  // Language ('en' | 'my' ...)
  async getLanguage() {
    try {
      return await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (error) {
      console.error('Error reading language:', error);
      return null;
    }
  },

  async setLanguage(locale) {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, locale);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};