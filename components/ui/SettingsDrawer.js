'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Palette, Type, Check } from 'lucide-react';
import { useAppSettings, THEMES, FONTS } from '@/hooks/useAppSettings';

export default function SettingsDrawer({ open, onClose }) {
  const { colorTheme, setColorTheme, font, setFont, isDark, toggleDark } = useAppSettings();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col shadow-2xl"
            style={{ backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Preferences
              </h2>
              <button
                onClick={onClose}
                aria-label="Close preferences"
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">

              {/* ── Appearance ── */}
              <section>
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  Appearance
                </p>
                <div
                  className="flex rounded-xl p-1 gap-1"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <button
                    onClick={() => { if (isDark) toggleDark(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={!isDark
                      ? { backgroundColor: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                      : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
                    }
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => { if (!isDark) toggleDark(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={isDark
                      ? { backgroundColor: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
                      : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
                    }
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </section>

              {/* ── Color Theme ── */}
              <section>
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Color Theme
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((theme) => {
                    const isSelected = colorTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setColorTheme(theme.id)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-medium transition-all duration-200"
                        style={isSelected
                          ? { borderColor: theme.accent, backgroundColor: `${theme.accent}18`, color: 'var(--text)' }
                          : { borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }
                        }
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = theme.accent; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative"
                          style={{ backgroundColor: theme.accent }}
                        >
                          {isSelected
                            ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            : <span className="text-base leading-none">{theme.emoji}</span>
                          }
                        </span>
                        <span className="truncate w-full text-center">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Font ── */}
              <section>
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <Type className="w-3.5 h-3.5" />
                  Font
                </p>
                <div className="flex flex-col gap-2">
                  {FONTS.map((f) => {
                    const isSelected = font === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFont(f.id)}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all duration-150 text-left"
                        style={isSelected
                          ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
                          : { borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }
                        }
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <span style={{ fontFamily: f.family }}>{f.label}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />}
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
