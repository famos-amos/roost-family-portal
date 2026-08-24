import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ColorScheme, darkColors, lightColors } from './colors';
import { fonts, radii, spacing } from './typography';
import { useSettingsStore } from '../store/useAppStore';

type Theme = {
  colors: ColorScheme;
  fonts: typeof fonts;
  radii: typeof radii;
  spacing: typeof spacing;
  isDark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePreference = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');

  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      fonts,
      radii,
      spacing,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used within a ThemeProvider');
  return ctx;
}
