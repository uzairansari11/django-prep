'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'django-practice-theme';

function getSystemPreference() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // During SSR, default to 'light'; real value set on mount
    return 'light';
  });

  // On mount, read from localStorage or system preference
  useEffect(() => {
    const saved = getSavedTheme();
    const resolved = saved === 'dark' || saved === 'light' ? saved : getSystemPreference();
    setTheme(resolved);
  }, []);

  // Apply / remove the 'dark' class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setDark = useCallback(() => setTheme('dark'), []);
  const setLight = useCallback(() => setTheme('light'), []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setDark,
    setLight,
  };
}
