'use client';

import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Database,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Zap,
  LayoutDashboard,
  Flame,
  Settings,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import SettingsDrawer from '@/components/ui/SettingsDrawer';

const NAV_LINKS = [
  { href: '/',                  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/learn/models',      label: 'Models',     icon: Database },
  { href: '/learn/queries',     label: 'Queries',    icon: BookOpen },
  { href: '/learn/production',  label: 'Production', icon: Flame },
  { href: '/learn/django',      label: 'Internals',  icon: Search },
  { href: '/practice',          label: 'Practice',   icon: Zap },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleDark } = useAppSettings();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleToggleDark = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    document.documentElement.style.setProperty('--reveal-x', `${x}px`);
    document.documentElement.style.setProperty('--reveal-y', `${y}px`);

    if (!document.startViewTransition) {
      toggleDark();
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => toggleDark());
    });
  };

  const iconBtnStyle = {
    color: 'var(--text-muted)',
  };

  function IconButton({ onClick, label, children }) {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className="p-2 rounded-lg transition-all duration-150"
        style={iconBtnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--surface-2)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          opacity: 0.95,
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">

            {/* ─── Logo ─────────────────────────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group"
              onClick={() => setMobileOpen(false)}
            >
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white transition-all duration-150"
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)',
                }}
              >
                <Database className="w-4 h-4" />
              </span>
              <span className="font-bold text-base tracking-tight hidden sm:block" style={{ color: 'var(--text)' }}>
                Django <span style={{ color: 'var(--accent)' }}>by</span> Uzair
              </span>
            </Link>

            {/* ─── Desktop nav links ─────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-0.5 flex-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                    style={
                      active
                        ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
                        : { color: 'var(--text-muted)' }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                        e.currentTarget.style.color = 'var(--text)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* ─── Right controls ───────────────────────────────────────── */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Dark / Light toggle — circular reveal */}
              <IconButton
                onClick={handleToggleDark}
                label={mounted && isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </IconButton>

              {/* Fullscreen */}
              <IconButton onClick={toggleFullscreen} label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </IconButton>

              {/* Settings */}
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label="Open preferences"
                className="p-2 rounded-lg transition-all duration-150"
                style={settingsOpen
                  ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-muted)' }
                }
                onMouseEnter={(e) => {
                  if (!settingsOpen) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!settingsOpen) {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden p-2 rounded-lg transition-all duration-150"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ─── Mobile menu ──────────────────────────────────────────────── */}
          {mobileOpen && (
            <div className="md:hidden border-t py-3 pb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                      style={
                        active
                          ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
                          : { color: 'var(--text-muted)' }
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Settings drawer rendered outside nav stacking context */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
