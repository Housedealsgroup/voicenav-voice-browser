export const COLORS = {
  // Dark theme — deep space aesthetic with electric accents
  dark: {
    background: '#0B0B1E',
    surface: '#13132D',
    surfaceLight: '#1C1C3A',
    primary: '#7C5CFC',
    primaryLight: '#9B82FF',
    accent: '#00E5FF',
    success: '#00E676',
    warning: '#FFD600',
    error: '#FF5252',
    text: '#FFFFFF',
    textSecondary: '#B0B0D0',
    textMuted: '#6A6A8A',
    border: '#2A2A4A',
    card: '#161638',
    overlay: 'rgba(11, 11, 30, 0.9)',
    gradient: ['#7C5CFC', '#00E5FF'],
    mic: '#FF2D78',
    micGlow: 'rgba(255, 45, 120, 0.3)',
    waveform: '#7C5CFC',
    taskActive: '#00E5FF',
    taskComplete: '#00E676',
    taskPending: '#6A6A8A',
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
    surfaceLight: '#0A0A0A',
    primary: '#BB86FC',
    primaryLight: '#D4AAFF',
    accent: '#03DAC6',
    success: '#00E676',
    warning: '#FFD600',
    error: '#CF6679',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#666666',
    border: '#1A1A1A',
    card: '#000000',
    overlay: 'rgba(0, 0, 0, 0.95)',
    gradient: ['#BB86FC', '#03DAC6'],
    mic: '#CF6679',
    micGlow: 'rgba(207, 102, 121, 0.3)',
    waveform: '#BB86FC',
    taskActive: '#03DAC6',
    taskComplete: '#00E676',
    taskPending: '#444444',
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
