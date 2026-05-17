import { create } from 'zustand';
import { COLORS, ThemeColors } from '../a11y/theme';

type ThemeState = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: true,
  colors: COLORS.dark,
  toggleTheme: () =>
    set((state) => ({
      isDark: !state.isDark,
      colors: state.isDark ? COLORS.light : COLORS.dark,
    })),
  setDark: (dark) =>
    set({
      isDark: dark,
      colors: dark ? COLORS.dark : COLORS.light,
    }),
}));
