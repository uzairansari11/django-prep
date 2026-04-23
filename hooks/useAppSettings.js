'use client';

import { useState, useCallback, createContext, useContext } from 'react';

export const THEMES = [
  { id: '',        label: 'Claude',   accent: '#ea580c', emoji: '🤖' },
  { id: 'vscode',  label: 'VS Code',  accent: '#007acc', emoji: '💙' },
  { id: 'spotify', label: 'Spotify',  accent: '#1db954', emoji: '🎵' },
  { id: 'marvel',  label: 'Marvel',   accent: '#dc2626', emoji: '⚡' },
  { id: 'dracula', label: 'Dracula',  accent: '#8b5cf6', emoji: '🧛' },
  { id: 'discord', label: 'Discord',  accent: '#5865f2', emoji: '🎮' },
  { id: 'slack',   label: 'Slack',    accent: '#0ea5e9', emoji: '💬' },
];

export const FONTS = [
  { id: 'inter',   label: 'Inter',             family: 'Inter, system-ui, sans-serif' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { id: 'dm',      label: 'DM Sans',           family: '"DM Sans", system-ui, sans-serif' },
  { id: 'grotesk', label: 'Space Grotesk',     family: '"Space Grotesk", system-ui, sans-serif' },
  { id: 'geist',   label: 'Geist',             family: 'Geist, system-ui, sans-serif' },
];

const STORAGE_DARK   = 'app-dark-mode';
const STORAGE_THEME  = 'app-color-theme';
const STORAGE_FONT   = 'app-font';

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
  /* ── Dark mode ─────────────────────────────────────────────────────── */
  const [isDark, setIsDark] = useState(() => {
    const saved = read(STORAGE_DARK, null);
    return saved !== null ? saved === 'true' : prefersDark();
  });

  /* ── Color theme ───────────────────────────────────────────────────── */
  const [colorTheme, setColorThemeState] = useState(() => read(STORAGE_THEME, ''));

  /* ── Font ──────────────────────────────────────────────────────────── */
  const [font, setFontState] = useState(() => read(STORAGE_FONT, 'inter'));

  /* Apply to DOM once on mount — syncs server-default HTML with real prefs */
  useState(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const dark  = read(STORAGE_DARK, null);
    const dark2 = dark !== null ? dark === 'true' : prefersDark();
    if (dark2) root.classList.add('dark'); else root.classList.remove('dark');
    const theme = read(STORAGE_THEME, '');
    if (theme) root.setAttribute('data-theme', theme); else root.removeAttribute('data-theme');
    const f = read(STORAGE_FONT, 'inter');
    if (f && f !== 'inter') root.setAttribute('data-font', f); else root.removeAttribute('data-font');
  });

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_DARK, String(next)); } catch {}
      const root = document.documentElement;
      if (next) root.classList.add('dark'); else root.classList.remove('dark');
      return next;
    });
  }, []);

  const setColorTheme = useCallback((theme) => {
    setColorThemeState(theme);
    try { localStorage.setItem(STORAGE_THEME, theme); } catch {}
    const root = document.documentElement;
    if (theme) root.setAttribute('data-theme', theme); else root.removeAttribute('data-theme');
  }, []);

  const setFont = useCallback((f) => {
    setFontState(f);
    try { localStorage.setItem(STORAGE_FONT, f); } catch {}
    const root = document.documentElement;
    if (f && f !== 'inter') root.setAttribute('data-font', f); else root.removeAttribute('data-font');
  }, []);

  return (
    <AppSettingsContext.Provider value={{ isDark, toggleDark, colorTheme, setColorTheme, font, setFont }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
