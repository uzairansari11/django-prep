'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Database,
  BookOpen,
  Flame,
  Search,
  Code2,
  Layers,
  Zap,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import TopicCard from '@/components/ui/TopicCard';
import { modelTopics } from '@/data/models-topics';
import { queryTopics } from '@/data/query-topics';
import { productionTopics } from '@/data/production-topics';
import { djangoInternalsTopics } from '@/data/django-internals-topics';
import { drfViewsTopics } from '@/data/drf-views-topics';
import { drfSerializersTopics } from '@/data/drf-serializers-topics';
import { exercises } from '@/data/exercises';

function shuffle(arr) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

const SECTIONS = [
  { href: '/learn/models',          label: 'Models',           desc: 'Field types, relationships, Meta options', icon: Database, list: modelTopics },
  { href: '/learn/queries',         label: 'QuerySet & ORM',   desc: 'Filter, annotate, aggregate, lookups',     icon: BookOpen, list: queryTopics },
  { href: '/learn/production',      label: 'Production',       desc: 'Auth, caching, Celery, deployment',        icon: Flame,    list: productionTopics },
  { href: '/learn/django',          label: 'Internals',        desc: 'Middleware, signals, project flow',        icon: Search,   list: djangoInternalsTopics },
  { href: '/learn/drf-views',       label: 'DRF Views',        desc: 'APIView, ViewSets, permissions',           icon: Code2,    list: drfViewsTopics },
  { href: '/learn/drf-serializers', label: 'DRF Serializers',  desc: 'Validation, nested, relations',            icon: Layers,   list: drfSerializersTopics },
];

export default function DashboardPage() {
  const {
    completedTopics,
    completedExercises,
    streak,
    isTopicComplete,
    toggleBookmark,
    isBookmarked,
  } = useProgress();

  const allTopics = useMemo(() => [
    ...modelTopics.map((t)          => ({ ...t, _section: 'models' })),
    ...queryTopics.map((t)          => ({ ...t, _section: 'queries' })),
    ...productionTopics.map((t)     => ({ ...t, _section: 'production' })),
    ...djangoInternalsTopics.map((t)=> ({ ...t, _section: 'django' })),
    ...drfViewsTopics.map((t)       => ({ ...t, _section: 'drf-views' })),
    ...drfSerializersTopics.map((t) => ({ ...t, _section: 'drf-serializers' })),
  ], []);

  const totalTopics    = allTopics.length;
  const totalExercises = exercises.length;
  const completedTopicCount    = completedTopics.size;
  const completedExerciseCount = completedExercises.size;

  const overallPercent = useMemo(() => {
    const total = totalTopics + totalExercises;
    if (!total) return 0;
    return Math.round(((completedTopicCount + completedExerciseCount) / total) * 100);
  }, [totalTopics, totalExercises, completedTopicCount, completedExerciseCount]);

  const sectionStats = useMemo(() => SECTIONS.map((s) => {
    const done = s.list.filter((t) => completedTopics.has(String(t.id))).length;
    return { ...s, done, total: s.list.length, pct: Math.round((done / s.list.length) * 100) || 0 };
  }), [completedTopics]);

  const [previewTopics, setPreviewTopics] = useState([]);
  useEffect(() => {
    setPreviewTopics(shuffle(allTopics).slice(0, 4));
  }, [allTopics]);

  const topicHref = useCallback((topic) => {
    if (topic._section === 'models')          return `/learn/models/${topic.id}`;
    if (topic._section === 'production')      return `/learn/production/${topic.id}`;
    if (topic._section === 'django')          return `/learn/django/${topic.id}`;
    if (topic._section === 'drf-views')       return `/learn/drf-views/${topic.id}`;
    if (topic._section === 'drf-serializers') return `/learn/drf-serializers/${topic.id}`;
    return `/learn/queries/${topic.id}`;
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

      {/* Hero */}
      <section className="mb-16">
        <h1
          className="text-3xl sm:text-[40px] font-semibold tracking-tight leading-[1.1] mb-4"
          style={{ color: 'var(--text)' }}
        >
          Master Django,<br />
          <span style={{ color: 'var(--text-muted)' }}>one concept at a time.</span>
        </h1>
        <p
          className="text-[15px] leading-relaxed mb-8 max-w-xl"
          style={{ color: 'var(--text-muted)' }}
        >
          Structured lessons on models, the ORM, middleware, and production patterns —
          paired with hands-on exercises that check your work.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/learn/models"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            Start learning <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-medium transition-colors"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <Zap className="w-3.5 h-3.5" /> Practice
          </Link>
        </div>
      </section>

      {/* Stat row */}
      <section className="mb-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overall',   value: `${overallPercent}%`,                    sub: `${completedTopicCount + completedExerciseCount} / ${totalTopics + totalExercises}` },
          { label: 'Topics',    value: `${completedTopicCount}`,                sub: `of ${totalTopics}` },
          { label: 'Exercises', value: `${completedExerciseCount}`,             sub: `of ${totalExercises}` },
          { label: 'Streak',    value: `${streak}`,                             sub: streak === 1 ? 'day' : 'days' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded p-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {value}
            </p>
            <p suppressHydrationWarning className="mt-0.5 text-[12px]" style={{ color: 'var(--text-subtle)' }}>
              {sub}
            </p>
          </div>
        ))}
      </section>

      {/* Sections */}
      <section className="mb-12">
        <SectionHeader title="Learning paths" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionStats.map(({ href, label, desc, icon: Icon, done, total, pct }) => (
            <Link
              key={href}
              href={href}
              className="group rounded p-4 transition-colors duration-150"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
                <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{label}</h3>
              </div>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
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
      </section>

      {/* Continue learning */}
      <section className="mb-12">
        <SectionHeader
          title="Continue learning"
          action={<Link href="/learn" className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>View all →</Link>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {previewTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isCompleted={isTopicComplete(topic.id)}
              isBookmarked={isBookmarked(topic.id)}
              onBookmark={() => toggleBookmark(topic.id)}
              href={topicHref(topic)}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 mt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[12px]" style={{ color: 'var(--text-subtle)' }}>
            Django by Uzair — built for developers leveling up.
          </p>
          <div className="flex items-center gap-3 text-[12px]">
            <a href="https://github.com/uzairansari11" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>GitHub</a>
            <a href="https://www.linkedin.com/in/uzairansari11/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>LinkedIn</a>
            <a href="https://uzairansari11.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>Portfolio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
