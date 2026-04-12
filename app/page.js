'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Zap,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import StatsCard from '@/components/ui/StatsCard';
import TopicCard from '@/components/ui/TopicCard';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import { modelTopics } from '@/data/models-topics';
import { queryTopics } from '@/data/query-topics';
import { productionTopics } from '@/data/production-topics';
import { exercises } from '@/data/exercises';

const DJANGO_TIPS = [
  {
    title: 'Use select_related() for ForeignKey',
    tip: 'Calling select_related() on a queryset performs a SQL JOIN, fetching related objects in a single query. This prevents the N+1 query problem when accessing ForeignKey or OneToOneField relations.',
    tag: 'Performance',
  },
  {
    title: 'prefetch_related() for ManyToMany',
    tip: 'For ManyToManyField and reverse ForeignKey relations, use prefetch_related(). Unlike select_related(), it does a separate lookup and joins in Python, which is more efficient for multi-valued relations.',
    tag: 'Performance',
  },
  {
    title: 'Use F() expressions for atomic updates',
    tip: 'Instead of fetching a value, modifying it in Python, then saving, use F() expressions: Article.objects.update(views=F("views")+1). This is atomic and avoids race conditions.',
    tag: 'Correctness',
  },
  {
    title: 'only() and defer() reduce data transfer',
    tip: 'Use only("id","title") to fetch a subset of columns, or defer("body") to skip heavy fields. This reduces the payload from the database for read-heavy views.',
    tag: 'Performance',
  },
  {
    title: 'exists() is faster than count() for presence checks',
    tip: 'If you only need to know whether rows exist (not how many), queryset.exists() generates SELECT 1 ... LIMIT 1 which is cheaper than COUNT(*). Use it in conditional logic.',
    tag: 'Optimization',
  },
];

function getRandomTip() {
  return DJANGO_TIPS[Math.floor(Math.random() * DJANGO_TIPS.length)];
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function DashboardPage() {
  const {
    completedTopics,
    completedExercises,
    streak,
    markTopicComplete,
    markTopicIncomplete,
    isTopicComplete,
    toggleBookmark,
    isBookmarked,
  } = useProgress();

  const allTopics = useMemo(() => [
    ...modelTopics.map((t) => ({ ...t, _section: 'models' })),
    ...queryTopics.map((t) => ({ ...t, _section: 'queries' })),
    ...productionTopics.map((t) => ({ ...t, _section: 'production' })),
  ], []);

  const totalTopics = allTopics.length;
  const totalExercises = exercises.length;
  const completedTopicCount = completedTopics.size;
  const completedExerciseCount = completedExercises.size;

  const overallPercent = useMemo(() => {
    const total = totalTopics + totalExercises;
    if (total === 0) return 0;
    return Math.round(((completedTopicCount + completedExerciseCount) / total) * 100);
  }, [totalTopics, totalExercises, completedTopicCount, completedExerciseCount]);

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
  const exerciseProgress = Math.round((completedExerciseCount / totalExercises) * 100);

  // Use state + effect for anything random so server and client render identically
  const [previewTopics, setPreviewTopics] = useState([]);
  const [tip, setTip] = useState(DJANGO_TIPS[0]);

  useEffect(() => {
    const labeled = [
      ...modelTopics.map((t) => ({ ...t, _section: 'models' })),
      ...queryTopics.map((t) => ({ ...t, _section: 'queries' })),
      ...productionTopics.map((t) => ({ ...t, _section: 'production' })),
    ];
    setPreviewTopics(shuffleArray(labeled).slice(0, 4));
    setTip(getRandomTip());
  }, []);

  const weakTopics = useMemo(
    () => allTopics.filter((t) => !completedTopics.has(String(t.id))).slice(0, 6),
    [allTopics, completedTopics]
  );

  const recentExercises = exercises.slice(0, 3);

  function handleTopicToggle(id) {
    if (isTopicComplete(id)) {
      markTopicIncomplete(id);
    } else {
      markTopicComplete(id);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 dark:from-indigo-900 dark:via-violet-900 dark:to-purple-950">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Interactive Django ORM Learning
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-4">
              Master{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-300">
                Django ORM
              </span>
            </h1>

            <p className="text-lg text-indigo-100 leading-relaxed mb-8 max-w-xl">
              Learn models, querysets, and advanced ORM patterns through structured
              lessons and hands-on exercises. Go from beginner to expert at your own pace.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/learn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors duration-150 shadow-lg shadow-black/20"
              >
                <BookOpen className="w-4 h-4" />
                Continue Learning
              </Link>
              <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors duration-150 border border-white/30 backdrop-blur-sm"
              >
                <Zap className="w-4 h-4" />
                Start Practicing
              </Link>
            </div>
          </div>

          {/* Hero progress pill */}
          <div className="mt-12 max-w-sm">
            <div className="flex items-center justify-between text-sm text-indigo-200 mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold text-white">{overallPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 transition-all duration-700"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-indigo-300">
              {completedTopicCount + completedExerciseCount} of {totalTopics + totalExercises} items completed
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* ── Stats Row ───────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Topics Completed"
              value={completedTopicCount}
              subtitle={`of ${totalTopics} total`}
              icon={BookOpen}
              color="indigo"
              trend={completedTopicCount > 0 ? 'up' : 'neutral'}
              trendLabel={completedTopicCount > 0 ? 'Keep going' : 'Start now'}
            />
            <StatsCard
              title="Exercises Solved"
              value={completedExerciseCount}
              subtitle={`of ${totalExercises} total`}
              icon={Zap}
              color="emerald"
              trend={completedExerciseCount > 0 ? 'up' : 'neutral'}
              trendLabel={completedExerciseCount > 0 ? 'Great work' : 'Try one'}
            />
            <StatsCard
              title="Practice Streak"
              value={streak}
              subtitle="days in a row"
              icon={Trophy}
              color="amber"
              trend={streak > 1 ? 'up' : 'neutral'}
              trendLabel={streak > 1 ? `${streak} days!` : 'Start streak'}
            />
            <StatsCard
              title="Total Progress"
              value={`${overallPercent}%`}
              subtitle="across all content"
              icon={Target}
              color="violet"
              trend={overallPercent > 50 ? 'up' : overallPercent > 0 ? 'neutral' : 'neutral'}
              trendLabel={overallPercent >= 100 ? 'Complete!' : `${100 - overallPercent}% left`}
            />
          </div>
        </section>

        {/* ── Progress Overview ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Progress Overview</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your learning journey at a glance</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 space-y-6">
            {/* Models progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="models" size="sm">Models</Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Django Models</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {modelCompletedCount}/{modelTopics.length}
                </span>
              </div>
              <ProgressBar value={modelProgress} color="purple" size="md" />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {modelProgress}% complete — fields, relationships, Meta options and more
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50" />

            {/* Queries progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="queries" size="sm">Queries</Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">QuerySet & ORM</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {queryCompletedCount}/{queryTopics.length}
                </span>
              </div>
              <ProgressBar value={queryProgress} color="blue" size="md" />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {queryProgress}% complete — filter, annotate, aggregate and advanced lookups
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50" />

            {/* Production progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">Production</Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Production Patterns</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {productionCompletedCount}/{productionTopics.length}
                </span>
              </div>
              <ProgressBar value={productionProgress} color="amber" size="md" />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {productionProgress}% complete — auth, caching, Celery, security, and deployment
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50" />

            {/* Exercises progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">Practice</Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Exercises</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {completedExerciseCount}/{totalExercises}
                </span>
              </div>
              <ProgressBar value={exerciseProgress} color="green" size="md" />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {exerciseProgress}% solved — beginner to advanced coding challenges
              </p>
            </div>
          </div>
        </section>

        {/* ── Main Two-Column Area ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Continue Learning */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Continue Learning</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pick up where you left off</p>
                  </div>
                </div>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previewTopics.map((topic) => {
                  const href =
                    topic._section === 'models'
                      ? `/learn/models/${topic.id}`
                      : topic._section === 'production'
                      ? `/learn/production/${topic.id}`
                      : `/learn/queries/${topic.id}`;
                  return (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isCompleted={isTopicComplete(topic.id)}
                      isBookmarked={isBookmarked(topic.id)}
                      onComplete={() => handleTopicToggle(topic.id)}
                      onBookmark={() => toggleBookmark(topic.id)}
                      href={href}
                    />
                  );
                })}
              </div>
            </section>

            {/* Recent Practice */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Practice</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Latest exercises to try</p>
                  </div>
                </div>
                <Link
                  href="/practice"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  All exercises <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentExercises.map((ex) => {
                  const done = completedExercises.has(String(ex.id));
                  return (
                    <Link
                      key={ex.id}
                      href={`/practice/${ex.id}`}
                      className="group block"
                    >
                      <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 hover:shadow-md ${
                        done
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/60'
                      }`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                          done
                            ? 'bg-emerald-100 dark:bg-emerald-900/40'
                            : 'bg-slate-100 dark:bg-slate-700'
                        }`}>
                          {done
                            ? <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            : <Zap className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                              {ex.title}
                            </p>
                            <Badge variant={ex.difficulty} size="sm">
                              {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {ex.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Weekly Tip */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40">
                  <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">ORM Spotlight</h2>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="warning" size="sm">{tip.tag}</Badge>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-amber-100 text-base mb-2 leading-snug">
                  {tip.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-amber-200/80 leading-relaxed">
                  {tip.tip}
                </p>
              </div>
            </section>

            {/* Weak Areas */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40">
                  <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Not Yet Done</h2>
              </div>

              {weakTopics.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">All done!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You&apos;ve completed everything.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weakTopics.map((topic) => {
                    const href =
                      topic._section === 'models'
                        ? `/learn/models/${topic.id}`
                        : topic._section === 'production'
                        ? `/learn/production/${topic.id}`
                        : `/learn/queries/${topic.id}`;
                    return (
                      <Link key={topic.id} href={href} className="group block">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-150">
                          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {topic.title}
                          </span>
                          <Badge variant={topic.difficulty} size="sm">
                            {topic.difficulty.slice(0, 3)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}

                  {allTopics.filter((t) => !completedTopics.has(String(t.id))).length > 6 && (
                    <Link
                      href="/learn"
                      className="block text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 pt-1 transition-colors"
                    >
                      +{allTopics.filter((t) => !completedTopics.has(String(t.id))).length - 6} more topics
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
