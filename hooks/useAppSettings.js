'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const STORAGE_DARK = 'app-dark-mode';

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function prefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = read(STORAGE_DARK, null);
    return saved !== null ? saved === 'true' : prefersDark();
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const dark = read(STORAGE_DARK, null);
    const dark2 = dark !== null ? dark === 'true' : prefersDark();
    if (dark2) root.classList.add('dark'); else root.classList.remove('dark');
  }, []);

  const toggleDark = useCallback((event) => {
    const apply = () => {
      setIsDark(prev => {
        const next = !prev;
        try { localStorage.setItem(STORAGE_DARK, String(next)); } catch {}
        const root = document.documentElement;
        if (next) root.classList.add('dark'); else root.classList.remove('dark');
        return next;
      });
    };

    // Capture the click position for a circular reveal animation.
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const x = event?.clientX ?? (typeof window !== 'undefined' ? window.innerWidth - 40 : 0);
      const y = event?.clientY ?? 40;
      root.style.setProperty('--reveal-x', `${x}px`);
      root.style.setProperty('--reveal-y', `${y}px`);
    }

    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }, []);

  return (
    <AppSettingsContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
