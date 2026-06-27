import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n'; // init i18next once
import { storageService } from '../services/storageService';

const I18nContext = createContext(null);

// Font family map by weight for the active locale. Inter for English; the
// Burmese font (loaded centrally in App.js) for Burmese. Burmese only ships
// Regular + Bold, so medium/semibold fall back to Bold.
const interFont = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
const myanmarFont = {
  regular: 'NotoSansMyanmar-Regular',
  medium: 'NotoSansMyanmar-Bold',
  semibold: 'NotoSansMyanmar-Bold',
  bold: 'NotoSansMyanmar-Bold',
};

export function I18nProvider({ children }) {
  const { t, i18n } = useTranslation();
  const [locale, setLocaleState] = useState(i18n.language || 'en');

  // Apply a persisted locale on mount (overrides the device-locale default).
  useEffect(() => {
    storageService.getLanguage().then((stored) => {
      if (stored && stored !== i18n.language) {
        i18n.changeLanguage(stored);
        setLocaleState(stored);
      }
    });
  }, [i18n]);

  const setLocale = (next) => {
    i18n.changeLanguage(next);
    setLocaleState(next);
    storageService.setLanguage(next);
  };

  const font = locale === 'my' ? myanmarFont : interFont;

  const value = useMemo(() => ({ t, locale, setLocale, font }), [t, locale, font]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
