'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeMode;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'xplore_theme_mode_v1';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  isLight: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLight: theme === 'light',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
