import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import my from './locales/my.json';

// Default to the device locale if we recognize it, else English.
const deviceLang = Localization.getLocales?.()?.[0]?.languageCode || 'en';
const defaultLocale = deviceLang === 'my' ? 'my' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    my: { translation: my },
  },
  lng: defaultLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
