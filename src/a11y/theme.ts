export const COLORS = {
  // Dark theme — deep space aesthetic with electric accents
  dark: {
    background: '#000000',
    surface: '#0A0A12',
    surfaceLight: '#12122A',
    primary: '#9B5CFF',
    primaryLight: '#B88AFF',
    accent: '#C084FC',
    success: '#00E676',
    warning: '#FFD600',
    error: '#FF5252',
    text: '#FFFFFF',
    textSecondary: '#C0B0D0',
    textMuted: '#6A5A8A',
    border: '#1A1A3A',
    card: '#08081A',
    overlay: 'rgba(0, 0, 0, 0.92)',
    gradient: ['#9B5CFF', '#C084FC'],
    mic: '#D946EF',
    micGlow: 'rgba(168, 85, 247, 0.4)',
    waveform: '#9B5CFF',
    taskActive: '#C084FC',
    taskComplete: '#00E676',
    taskPending: '#3A2A5A',
  },
  // Light theme — clean, modern, high contrast
  light: {
    background: '#F8F8FF',
    surface: '#FFFFFF',
    surfaceLight: '#F0F0FF',
    primary: '#6C47FF',
    primaryLight: '#8B6FFF',
    accent: '#00B8D4',
    success: '#00C853',
    warning: '#FFD600',
    error: '#FF1744',
    text: '#1A1A2E',
    textSecondary: '#5A5A7A',
    textMuted: '#9A9AB0',
    border: '#E0E0F0',
    card: '#FFFFFF',
    overlay: 'rgba(248, 248, 255, 0.9)',
    gradient: ['#6C47FF', '#00B8D4'],
    mic: '#FF2D78',
    micGlow: 'rgba(255, 45, 120, 0.2)',
    waveform: '#6C47FF',
    taskActive: '#00B8D4',
    taskComplete: '#00C853',
    taskPending: '#9A9AB0',
  },
  // High contrast theme — maximum readability for low vision
  highContrast: {
    background: '#000000',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    primary: '#FFFF00',
    primaryLight: '#FFFF66',
    accent: '#00FFFF',
    success: '#00FF00',
    warning: '#FFD600',
    error: '#FF0000',
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textMuted: '#B0B0B0',
    border: '#FFFFFF',
    card: '#1A1A1A',
    overlay: 'rgba(0, 0, 0, 0.95)',
    gradient: ['#FFFF00', '#00FFFF'],
    mic: '#FF0000',
    micGlow: 'rgba(255, 0, 0, 0.4)',
    waveform: '#FFFF00',
    taskActive: '#00FFFF',
    taskComplete: '#00FF00',
    taskPending: '#808080',
  },
  // AMOLED theme — pure black, battery saving
  amoled: {
    background: '#000000',
    surface: '#000000',
    surfaceLight: '#0A0A15',
    primary: '#A855F7',
    primaryLight: '#C084FC',
    accent: '#D946EF',
    success: '#00E676',
    warning: '#FFD600',
    error: '#CF6679',
    text: '#FFFFFF',
    textSecondary: '#B0A0C0',
    textMuted: '#5A4A7A',
    border: '#1A1028',
    card: '#050510',
    overlay: 'rgba(0, 0, 0, 0.95)',
    gradient: ['#A855F7', '#D946EF'],
    mic: '#D946EF',
    micGlow: 'rgba(168, 85, 247, 0.4)',
    waveform: '#A855F7',
    taskActive: '#D946EF',
    taskComplete: '#00E676',
    taskPending: '#2A1A3A',
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
  mic: string;
  micGlow: string;
  waveform: string;
  taskActive: string;
  taskComplete: string;
  taskPending: string;
};

export type ThemeName = 'dark' | 'light' | 'highContrast' | 'amoled';

export const MIN_TOUCH_TARGET = 44; // Minimum touch target size in points (Apple HIG)

export const ACCESSIBILITY_SCALE = {
  normal: 1,
  large: 1.15,
  extraLarge: 1.3,
  maximum: 1.5,
} as const;

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
