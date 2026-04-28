'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Database,
  Filter,
  Terminal,
  MoreHorizontal,
  Rocket,
  Cog,
  Globe,
  ArrowLeftRight,
  X,
} from 'lucide-react';

// Icon choices map to what each route actually represents:
//   Home       → Home          (entry point)
//   Models     → Database      (DB tables, model definitions)
//   Queries    → Filter        (filtering / lookups on a queryset)
//   Practice   → Terminal      (shell-style coding exercises)
//   Production → Rocket        (deployment / shipping to prod)
//   Internals  → Cog           (engine / how Django works inside)
//   DRF Views  → Globe         (HTTP/API endpoints)
//   DRF Serial → ArrowLeftRight (data transform: model ↔ JSON)
const PRIMARY = [
  { href: '/',              label: 'Home',     icon: Home },
  { href: '/learn/models',  label: 'Models',   icon: Database },
  { href: '/learn/queries', label: 'Queries',  icon: Filter },
  { href: '/practice',      label: 'Practice', icon: Terminal },
];

const MORE = [
  { href: '/learn/production',      label: 'Production',      icon: Rocket },
  { href: '/learn/django',          label: 'Internals',       icon: Cog },
  { href: '/learn/drf-views',       label: 'DRF Views',       icon: Globe },
  { href: '/learn/drf-serializers', label: 'DRF Serializers', icon: ArrowLeftRight },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const moreActive = MORE.some((item) => isActive(item.href));

  return (
    <>
      {/* Bottom dock — visible below lg only */}
      {/* Apple-style liquid-glass bar: fixed to the viewport so content
          scrolls behind it through the blur. */}
      <nav
        className="glass lg:hidden fixed bottom-0 inset-x-0 z-40 border-t"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5 max-w-2xl mx-auto">
          {PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
                  style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-medium" style={{ fontWeight: active ? 600 : 500 }}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              className="w-full flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
              style={{ color: moreActive ? 'var(--text)' : 'var(--text-muted)' }}
            >
              <MoreHorizontal className="w-4.5 h-4.5" strokeWidth={moreActive ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium" style={{ fontWeight: moreActive ? 600 : 500 }}>
                More
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0"
          />

          <div
            className="relative w-full rounded-t-lg border-t shadow-xl animate-fade-in"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Sections
              </p>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-5">
              {MORE.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-3 rounded transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--surface-2)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: active ? 'var(--text)' : 'var(--text-muted)',
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[13px] font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
