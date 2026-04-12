'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',                   label: 'Dashboard',     icon: LayoutDashboard, color: null },
  { href: '/learn/models',       label: 'Learn Models',  icon: Database,        color: 'indigo' },
  { href: '/learn/queries',      label: 'Learn Queries', icon: BookOpen,        color: 'sky' },
  { href: '/learn/production',   label: 'Production',    icon: Flame,           color: 'amber' },
  { href: '/practice',           label: 'Practice',      icon: Zap,             color: null },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ─── Logo ─────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <Database className="w-4 h-4" />
            </span>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Django <span className="text-indigo-500">ORM</span> Master
            </span>
          </Link>

          {/* ─── Desktop nav links ─────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, color }) => {
              const active = isActive(href);
              const activeClasses =
                color === 'amber'
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : color === 'sky'
                  ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                  : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400';
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? activeClasses
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ─── Right controls ───────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile menu ──────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-3 pb-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon, color }) => {
                const active = isActive(href);
                const activeClasses =
                  color === 'amber'
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : color === 'sky'
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                    : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400';
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      active
                        ? activeClasses
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    )}
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
  );
}
