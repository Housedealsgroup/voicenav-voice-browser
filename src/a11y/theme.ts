export const COLORS = {
  // Dark theme
  dark: {
    background: '#0A0A1A',
    surface: '#12122A',
    surfaceLight: '#1A1A3A',
    primary: '#6C63FF',
    primaryLight: '#8B83FF',
    accent: '#00D9FF',
    success: '#00E676',
    warning: '#FFD600',
    error: '#FF5252',
    text: '#FFFFFF',
    textSecondary: '#A0A0C0',
    textMuted: '#606080',
    border: '#2A2A4A',
    card: '#16163A',
    overlay: 'rgba(10, 10, 26, 0.85)',
    gradient: ['#6C63FF', '#00D9FF'],
  },
  // Light theme
  light: {
    background: '#F5F5FF',
    surface: '#FFFFFF',
    surfaceLight: '#EEEFFF',
    primary: '#6C63FF',
    primaryLight: '#8B83FF',
    accent: '#00B8D4',
    success: '#00C853',
    warning: '#FFD600',
    error: '#FF1744',
    text: '#1A1A2E',
    textSecondary: '#5A5A7A',
    textMuted: '#9A9AB0',
    border: '#DDDDEE',
    card: '#FFFFFF',
    overlay: 'rgba(245, 245, 255, 0.85)',
    gradient: ['#6C63FF', '#00B8D4'],
  },
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  primaryLight: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  card: string;
  overlay: string;
  gradient: string[];
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  hero: 42,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
