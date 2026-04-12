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
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/ui/StatsCard';
import { modelTopics } from '@/data/models-topics';
import { queryTopics } from '@/data/query-topics';
import { productionTopics } from '@/data/production-topics';

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

  const modelProgress = Math.round((modelCompletedCount / modelTopics.length) * 100);
  const queryProgress = Math.round((queryCompletedCount / queryTopics.length) * 100);
  const productionProgress = Math.round((productionCompletedCount / productionTopics.length) * 100);

  const allTopics = useMemo(() => [
    ...modelTopics.map((t) => ({ ...t, _section: 'models' })),
    ...queryTopics.map((t) => ({ ...t, _section: 'queries' })),
    ...productionTopics.map((t) => ({ ...t, _section: 'production' })),
  ], []);

  const totalCompleted = modelCompletedCount + queryCompletedCount + productionCompletedCount;
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 overflow-x-hidden">
      {/* Page header */}
      <div className="bg-white dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Learning Center
              </h1>
              <p className="mt-1.5 text-slate-500 dark:text-zinc-400 max-w-xl">
                Structured lessons on Django Models and the ORM — from foundational concepts to advanced patterns used in production.
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-8 max-w-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-700 dark:text-zinc-300">Overall completion</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCompleted}/{totalTopics} topics</span>
            </div>
            <ProgressBar value={overallProgress} color="indigo" size="md" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            title="Total Completed"
            value={totalCompleted}
            subtitle={`${overallProgress}% done`}
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* Category Cards */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Choose a Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Models card */}
            <Link href="/learn/models" className="group block">
              <div className="h-full bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden hover:border-violet-300 dark:hover:border-violet-700/60 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200">
                {/* Card top gradient strip */}
                <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 shrink-0">
                      <Database className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    Django Models
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-5">
                    Learn how Django models map Python classes to database tables. Cover field types, primary keys, relationships (ForeignKey, ManyToMany, OneToOne), Meta options, custom managers, and model methods.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['Field Types', 'Relationships', 'Meta', 'Migrations', 'Signals'].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium border border-violet-200/60 dark:border-violet-800/40">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-zinc-400 font-medium">Progress</span>
                      <span className="font-bold text-violet-600 dark:text-violet-400">
                        {modelCompletedCount}/{modelTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={modelProgress} color="purple" size="sm" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Queries card */}
            <Link href="/learn/queries" className="group block">
              <div className="h-full bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden hover:border-sky-300 dark:hover:border-sky-700/60 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-200">
                <div className="h-2 bg-gradient-to-r from-sky-500 to-blue-600" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/40 shrink-0">
                      <Search className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                    QuerySet & ORM
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-5">
                    Master Django&apos;s powerful query API. Learn lazy evaluation, filtering, annotation, aggregation, Q objects, F expressions, select_related, prefetch_related, and raw SQL when needed.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['filter()', 'annotate()', 'Q Objects', 'F Expressions', 'Aggregates'].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-medium border border-sky-200/60 dark:border-sky-800/40">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-zinc-400 font-medium">Progress</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {queryCompletedCount}/{queryTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={queryProgress} color="blue" size="sm" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Production card */}
            <Link href="/learn/production" className="group block md:col-span-2 lg:col-span-1">
              <div className="h-full bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden hover:border-amber-300 dark:hover:border-amber-700/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
                      <Flame className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      Open <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    Production Patterns
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-5">
                    From auth to deployment — build Django apps that scale. Covers authentication, caching, Celery tasks, security hardening, structured logging, and performance optimization.
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {['Auth', 'Caching', 'Celery', 'Security', 'Logging'].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200/60 dark:border-amber-800/40">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-zinc-400 font-medium">Progress</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {productionCompletedCount}/{productionTopics.length}
                      </span>
                    </div>
                    <ProgressBar value={productionProgress} color="amber" size="sm" />
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
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recently Completed</h2>
            </div>

            {recentlyCompleted.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
                <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">No topics completed yet</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Start with Django Models to get going</p>
                <Link
                  href="/learn/models"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
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
                      : `/learn/queries/${topic.id}`;
                  return (
                    <Link key={topic.id} href={href} className="group block">
                      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900/60 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-150">
                        <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-300 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
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
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Suggested Next</h2>
            </div>

            {suggestedNext.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">All topics complete!</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">You&apos;ve mastered everything. Try the exercises.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedNext.map((topic, idx) => {
                  const href =
                    topic._section === 'models'
                      ? `/learn/models/${topic.id}`
                      : topic._section === 'production'
                      ? `/learn/production/${topic.id}`
                      : `/learn/queries/${topic.id}`;
                  return (
                    <Link key={topic.id} href={href} className="group block">
                      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-150">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium text-slate-700 dark:text-zinc-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {topic.title}
                        </span>
                        <Badge variant={topic.difficulty} size="sm">
                          {topic.difficulty.slice(0, 3)}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
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
