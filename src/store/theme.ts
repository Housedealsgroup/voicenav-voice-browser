import { create } from 'zustand';
import { COLORS, ThemeColors, ThemeName } from '../a11y/theme';

type ThemeState = {
  themeName: ThemeName;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
  setTheme: (name: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeName: 'dark',
  isDark: true,
  colors: COLORS.dark,
  toggleTheme: () =>
    set((state) => {
      const newDark = !state.isDark;
      return {
        isDark: newDark,
        themeName: newDark ? 'dark' : 'light',
        colors: newDark ? COLORS.dark : COLORS.light,
      };
    }),
  setDark: (dark) =>
    set({
      isDark: dark,
      themeName: dark ? 'dark' : 'light',
      colors: dark ? COLORS.dark : COLORS.light,
    }),
  setTheme: (name: ThemeName) =>
    set({
      themeName: name,
      isDark: name !== 'light',
      colors: COLORS[name],
    }),
}));
