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
