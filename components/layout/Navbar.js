'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Maximize, Minimize } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const NAV_LINKS = [
  { href: '/',                      label: 'Home' },
  { href: '/learn/models',          label: 'Models' },
  { href: '/learn/queries',         label: 'Queries' },
  { href: '/learn/production',      label: 'Production' },
  { href: '/learn/django',          label: 'Internals' },
  { href: '/learn/drf-views',       label: 'DRF Views' },
  { href: '/learn/drf-serializers', label: 'DRF Serializers' },
  { href: '/practice',              label: 'Practice' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleDark } = useAppSettings();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center justify-center w-7 h-7 rounded text-[13px] font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
            >
              D
            </div>
            <span className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text)' }}>
              Django
            </span>
            <span className="hidden sm:inline text-[13px]" style={{ color: 'var(--text-subtle)' }}>
              / by Uzair
            </span>
          </Link>

          {/* Desktop center nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 text-[13px] font-medium rounded transition-colors duration-150"
                  style={{
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    backgroundColor: active ? 'var(--surface-2)' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right actions — same on mobile/desktop */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              aria-label={mounted && isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
            >
              {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="inline-flex p-2 rounded transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
