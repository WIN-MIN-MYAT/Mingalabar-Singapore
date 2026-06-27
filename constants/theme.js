// Semantic color palettes for light & dark mode. Screens read these via
// useTheme().colors instead of hardcoded hex values.

export const light = {
  primary: '#00288e',
  primaryEnd: '#0058be',
  bg: '#ffffff',
  surface: '#f2f4f6',
  surfaceAlt: '#eceef0',
  border: '#e0e3e5',
  borderStrong: '#c4c5d5',
  text: '#191c1e',
  textSecondary: '#444653',
  textTertiary: '#757684',
  muted: '#8E8E93',
  error: '#ba1a1a',
  star: '#FFB800',
  overlay: 'rgba(0,0,0,0.4)',
  headerBorder: '#E5E5E5',
  bubbleTheirs: '#f2f4f6',
  // surfaces inverting for dark mode
  isDark: false,
};

export const dark = {
  primary: '#4d7cff',
  primaryEnd: '#2b5fff',
  bg: '#0f1115',
  surface: '#1b1e24',
  surfaceAlt: '#242831',
  border: '#2a2f38',
  borderStrong: '#3a3f4a',
  text: '#f0f1f3',
  textSecondary: '#c2c6ce',
  textTertiary: '#8b909a',
  muted: '#6b7080',
  error: '#ff6b6b',
  star: '#FFB800',
  overlay: 'rgba(0,0,0,0.6)',
  headerBorder: '#2a2f38',
  bubbleTheirs: '#1b1e24',
  isDark: true,
};

export const palettes = { light, dark };
