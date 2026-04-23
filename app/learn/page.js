'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Database,
  Search,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Layers,
  Flame,
  Cpu,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/ui/StatsCard';
import { modelTopics } from '@/data/models-topics';
import { queryTopics } from '@/data/query-topics';
import { productionTopics } from '@/data/production-topics';
import { djangoInternalsTopics } from '@/data/django-internals-topics';

export default function LearnPage() {
  const { completedTopics, isTopicComplete } = useProgress();

  const modelCompletedCount = useMemo(
    () => modelTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );
  const queryCompletedCount = useMemo(
    () => queryTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );
  const productionCompletedCount = useMemo(
    () => productionTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );
  const djangoCompletedCount = useMemo(
    () => djangoInternalsTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );

  const modelProgress = Math.round((modelCompletedCount / modelTopics.length) * 100);
  const queryProgress = Math.round((queryCompletedCount / queryTopics.length) * 100);
  const productionProgress = Math.round((productionCompletedCount / productionTopics.length) * 100);
  const djangoProgress = Math.round((djangoCompletedCount / djangoInternalsTopics.length) * 100);

  const allTopics = useMemo(() => [
    ...modelTopics.map((t) => ({ ...t, _section: 'models' })),
    ...queryTopics.map((t) => ({ ...t, _section: 'queries' })),
    ...productionTopics.map((t) => ({ ...t, _section: 'production' })),
    ...djangoInternalsTopics.map((t) => ({ ...t, _section: 'django' })),
  ], []);

  const totalCompleted = modelCompletedCount + queryCompletedCount + productionCompletedCount + djangoCompletedCount;
  const totalTopics = allTopics.length;
  const overallProgress = Math.round((totalCompleted / totalTopics) * 100);

  // Recently completed topics
  const recentlyCompleted = useMemo(
    () => allTopics.filter((t) => completedTopics.has(String(t.id))).slice(0, 4),
    [allTopics, completedTopics]
  );

  // Suggested next: first 4 incomplete topics
  const suggestedNext = useMemo(
    () => allTopics.filter((t) => !completedTopics.has(String(t.id))).slice(0, 4),
    [allTopics, completedTopics]
  );

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Page header */}
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                Learning Center
              </h1>
              <p className="mt-1.5 max-w-xl" style={{ color: 'var(--text-muted)' }}>
                Structured lessons on Django Models and the ORM — from foundational concepts to advanced patterns used in production.
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-8 max-w-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium" style={{ color: 'var(--text)' }}>Overall completion</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>{totalCompleted}/{totalTopics} topics</span>
            </div>
            <ProgressBar value={overallProgress} color="accent" size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Model Topics"
            value={modelTopics.length}
            subtitle={`${modelCompletedCount} completed`}
            icon={Database}
            color="violet"
          />
          <StatsCard
            title="Query Topics"
            value={queryTopics.length}
            subtitle={`${queryCompletedCount} completed`}
            icon={Search}
            color="sky"
          />
          <StatsCard
            title="Production"
            value={productionTopics.length}
            subtitle={`${productionCompletedCount} completed`}
            icon={Flame}
            color="amber"
          />
          <StatsCard
            title="Django Internals"
            value={djangoInternalsTopics.length}
            subtitle={`${djangoCompletedCount} completed`}
            icon={Cpu}
            color="emerald"
          />
          <StatsCard
            title="Total Completed"
            value={totalCompleted}
            subtitle={`${overallProgress}% done`}
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* Category Cards */}
        <section>
          <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text)' }}>Choose a Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* Models card */}
            <Link href="/learn/models" className="group block">
              <div
                className="h-full rounded-2xl overflow-hidden transition-all duration-200"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--accent) 12%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Card top accent strip */}
                <div className="h-2" style={{ backgroundColor: 'var(--accent)' }} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                      style={{ backgroundColor: 'var(--accent-light)' }}
                    >
                      <Database className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--accent)' }}>
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                    Django Models
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                    Learn how Django models map Python classes to database tables. Cover field types, primary keys, relationships (ForeignKey, ManyToMany, OneToOne), Meta options, custom managers, and model methods.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['Field Types', 'Relationships', 'Meta', 'Migrations', 'Signals'].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent-border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>
                        {modelCompletedCount}/{modelTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={modelProgress} color="accent" size="sm" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Queries card */}
            <Link href="/learn/queries" className="group block">
              <div
                className="h-full rounded-2xl overflow-hidden transition-all duration-200"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--accent) 12%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="h-2" style={{ backgroundColor: 'var(--accent)' }} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                      style={{ backgroundColor: 'var(--accent-light)' }}
                    >
                      <Search className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--accent)' }}>
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                    QuerySet &amp; ORM
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                    Master Django&apos;s powerful query API. Learn lazy evaluation, filtering, annotation, aggregation, Q objects, F expressions, select_related, prefetch_related, and raw SQL when needed.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['filter()', 'annotate()', 'Q Objects', 'F Expressions', 'Aggregates'].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent-border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>
                        {queryCompletedCount}/{queryTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={queryProgress} color="accent" size="sm" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Production card */}
            <Link href="/learn/production" className="group block">
              <div
                className="h-full rounded-2xl overflow-hidden transition-all duration-200"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--accent) 12%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="h-2" style={{ backgroundColor: 'var(--accent)' }} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                      style={{ backgroundColor: 'var(--accent-light)' }}
                    >
                      <Flame className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--accent)' }}>
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                    Production Patterns
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                    From auth to deployment — build Django apps that scale. Covers authentication, caching, Celery tasks, security hardening, structured logging, and performance optimization.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['Auth', 'Caching', 'Celery', 'Security', 'Logging'].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent-border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>
                        {productionCompletedCount}/{productionTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={productionProgress} color="accent" size="sm" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Django Internals card */}
            <Link href="/learn/django" className="group block">
              <div
                className="h-full rounded-2xl overflow-hidden transition-all duration-200"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--accent) 12%, transparent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="h-2" style={{ backgroundColor: 'var(--accent)' }} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                      style={{ backgroundColor: 'var(--accent-light)' }}
                    >
                      <Cpu className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--accent)' }}>
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                    Django Internals
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                    How Django works under the hood — request/response lifecycle, the full middleware pipeline, writing custom middleware, and handling file uploads with multipart forms.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['Project Flow', 'Middleware', 'File Uploads', 'WSGI', 'Storage'].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent-border)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span className="font-bold" style={{ color: 'var(--accent)' }}>
                        {djangoCompletedCount}/{djangoInternalsTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={djangoProgress} color="accent" size="sm" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Two-column bottom area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Completed */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: 'var(--accent-light)' }}
              >
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Recently Completed</h2>
            </div>

            {recentlyCompleted.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No topics completed yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Start with Django Models to get going</p>
                <Link
                  href="/learn/models"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff', border: '1px solid transparent' }}
                >
                  Start Learning <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentlyCompleted.map((topic) => {
                  const href =
                    topic._section === 'models'
                      ? `/learn/models/${topic.id}`
                      : topic._section === 'production'
                      ? `/learn/production/${topic.id}`
                      : topic._section === 'django'
                      ? `/learn/django/${topic.id}`
                      : `/learn/queries/${topic.id}`;
                  return (
                    <Link key={topic.id} href={href} className="group block">
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)'; }}
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {topic.title}
                        </span>
                        <Badge
                          variant={topic._section === 'models' ? 'models' : topic._section === 'queries' ? 'queries' : 'warning'}
                          size="sm"
                        >
                          {topic._section}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Suggested Next */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ backgroundColor: 'var(--accent-light)' }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Suggested Next</h2>
            </div>

            {suggestedNext.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#22c55e' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>All topics complete!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You&apos;ve mastered everything. Try the exercises.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedNext.map((topic, idx) => {
                  const href =
                    topic._section === 'models'
                      ? `/learn/models/${topic.id}`
                      : topic._section === 'production'
                      ? `/learn/production/${topic.id}`
                      : topic._section === 'django'
                      ? `/learn/django/${topic.id}`
                      : `/learn/queries/${topic.id}`;
                  return (
                    <Link key={topic.id} href={href} className="group block">
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {topic.title}
                        </span>
                        <Badge variant={topic.difficulty} size="sm">
                          {topic.difficulty.slice(0, 3)}
                        </Badge>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-subtle)' }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
