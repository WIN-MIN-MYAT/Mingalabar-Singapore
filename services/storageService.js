import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@mg_sg_onboarding_completed';

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

  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};