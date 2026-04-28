'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { modelTopics } from '@/data/models-topics';
import { queryTopics } from '@/data/query-topics';
import { productionTopics } from '@/data/production-topics';
import { djangoInternalsTopics } from '@/data/django-internals-topics';
import { drfViewsTopics } from '@/data/drf-views-topics';
import { drfSerializersTopics } from '@/data/drf-serializers-topics';

const SECTIONS = [
  { href: '/learn/models',          label: 'Models',          desc: 'Field types, relationships, Meta options.',     list: modelTopics },
  { href: '/learn/queries',         label: 'QuerySet & ORM',  desc: 'Filter, annotate, aggregate, lookups.',         list: queryTopics },
  { href: '/learn/production',      label: 'Production',      desc: 'Auth, caching, Celery, deployment.',            list: productionTopics },
  { href: '/learn/django',          label: 'Internals',       desc: 'Middleware, signals, project flow.',            list: djangoInternalsTopics },
  { href: '/learn/drf-views',       label: 'DRF Views',       desc: 'APIView, ViewSets, permissions, filters.',      list: drfViewsTopics },
  { href: '/learn/drf-serializers', label: 'DRF Serializers', desc: 'Validation, nested, relations, performance.',   list: drfSerializersTopics },
];

export default function LearnPage() {
  const { completedTopics } = useProgress();

  const stats = useMemo(() => SECTIONS.map((s) => {
    const done = s.list.filter((t) => completedTopics.has(String(t.id))).length;
    return { ...s, done, total: s.list.length, pct: Math.round((done / s.list.length) * 100) || 0 };
  }), [completedTopics]);

  const totalDone  = stats.reduce((sum, s) => sum + s.done, 0);
  const totalTotal = stats.reduce((sum, s) => sum + s.total, 0);
  const overallPct = totalTotal > 0 ? Math.round((totalDone / totalTotal) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] mb-6">
        <Link href="/" style={{ color: 'var(--text-muted)' }} className="hover:underline">Home</Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>Learn</span>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Learning paths</h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Six structured tracks covering Django from models to production patterns and DRF.
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[12px] tabular-nums mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text)' }}>{totalDone}</span> / {totalTotal} topics
          </p>
          <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
            <div className="h-full" style={{ width: `${overallPct}%`, backgroundColor: 'var(--accent)' }} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(({ href, label, desc, done, total, pct }) => (
          <Link
            key={href}
            href={href}
            className="group rounded p-5 transition-colors duration-150 flex flex-col"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{label}</h3>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-subtle)' }} />
            </div>
            <p className="text-[13px] leading-relaxed flex-1 mb-4" style={{ color: 'var(--text-muted)' }}>
              {desc}
            </p>
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: 'var(--text-subtle)' }} suppressHydrationWarning>{done} / {total}</span>
              <span className="tabular-nums" style={{ color: 'var(--text-muted)' }} suppressHydrationWarning>{pct}%</span>
            </div>
            <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
              <div
                suppressHydrationWarning
                className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
