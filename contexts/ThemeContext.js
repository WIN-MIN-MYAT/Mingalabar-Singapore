import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { palettes } from '../constants/theme';
import { storageService } from '../services/storageService';

const ThemeContext = createContext(null);

// mode is the user's choice ('light' | 'dark' | 'system'); resolved is the
// actual palette in effect. When mode === 'system', resolved follows the OS.
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storageService.getTheme().then((stored) => {
      if (stored) setModeState(stored);
      setReady(true);
    });
  }, []);

  const resolved = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = palettes[resolved] || palettes.light;

  const setMode = (next) => {
    setModeState(next);
    storageService.setTheme(next);
  };

  const value = useMemo(
    () => ({ mode, resolved, colors, setMode, ready }),
    [mode, resolved, colors, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
