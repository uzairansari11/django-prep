'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
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
  Database,
  Flame,
  Search,
  Code2,
  Globe,
} from 'lucide-react';

function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
import { useProgress } from '@/hooks/useProgress';
import StatsCard from '@/components/ui/StatsCard';
import TopicCard from '@/components/ui/TopicCard';
import Badge from '@/components/ui/Badge';
import { modelTopics } from '@/data/models-topics';
import { queryTopics } from '@/data/query-topics';
import { productionTopics } from '@/data/production-topics';
import { djangoInternalsTopics } from '@/data/django-internals-topics';
import { exercises } from '@/data/exercises';

const DJANGO_TIPS = [
  {
    title: 'Use select_related() for ForeignKey',
    tip: 'Performs a SQL JOIN — fetches related objects in one query. Prevents N+1 on ForeignKey and OneToOneField.',
    tag: 'Performance',
  },
  {
    title: 'prefetch_related() for ManyToMany',
    tip: 'Separate lookup joined in Python. More efficient than select_related for multi-valued relations.',
    tag: 'Performance',
  },
  {
    title: 'F() expressions for atomic updates',
    tip: 'Article.objects.update(views=F("views")+1) — avoids race conditions without fetching first.',
    tag: 'Correctness',
  },
  {
    title: 'only() and defer() cut data transfer',
    tip: 'Use only("id","title") or defer("body") to fetch a subset of columns from the database.',
    tag: 'Optimization',
  },
  {
    title: 'exists() beats count() for presence checks',
    tip: 'queryset.exists() generates SELECT 1 LIMIT 1 — much cheaper than COUNT(*) when you just need a boolean.',
    tag: 'Optimization',
  },
];

/* ─── Count-up number ────────────────────────────────────────────────────── */
function CountUp({ target, duration = 1.4, suffix = '%' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, v => Math.round(v));
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (inView) spring.set(target);
  }, [inView, target, spring]);

  useEffect(() => {
    const unsub = display.on('change', v => setVal(v));
    return unsub;
  }, [display]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Circular progress ring with Framer Motion animation ────────────────── */
function ProgressRing({ percent = 0, size = 80, stroke = 8, color = 'var(--accent)', track = 'var(--surface-2)', label, sublabel, delay = 0 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const targetOffset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
          {/* Animated fill */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circ }}
            animate={inView ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circ }}
            transition={{ duration: 1.6, delay, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </svg>
        {/* Percentage label with count-up */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold" style={{ fontSize: size > 90 ? 18 : 13, color: 'var(--text)' }}>
            {inView ? <CountUp target={percent} duration={1.4} suffix="%" /> : '0%'}
          </span>
        </div>
      </div>
      {label && <p className="text-xs font-medium text-center" style={{ color: 'var(--text)' }}>{label}</p>}
      {sublabel && <p suppressHydrationWarning className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{sublabel}</p>}
    </div>
  );
}

/* ─── Animated progress bar ──────────────────────────────────────────────── */
function AnimatedBar({ value = 0, color = 'var(--accent)', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10px' });
  return (
    <div ref={ref} className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: '0%' }}
        animate={inView ? { width: `${value}%` } : { width: '0%' }}
        transition={{ duration: 1.2, delay, ease: [0.34, 1.1, 0.64, 1] }}
      />
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────────────────── */
function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
          {subtitle && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
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
    ...modelTopics.map((t)      => ({ ...t, _section: 'models' })),
    ...queryTopics.map((t)      => ({ ...t, _section: 'queries' })),
    ...productionTopics.map((t) => ({ ...t, _section: 'production' })),
    ...djangoInternalsTopics.map((t) => ({ ...t, _section: 'django' })),
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

  const modelCompleted      = useMemo(() => modelTopics.filter((t)      => completedTopics.has(String(t.id))).length, [completedTopics]);
  const queryCompleted      = useMemo(() => queryTopics.filter((t)      => completedTopics.has(String(t.id))).length, [completedTopics]);
  const productionCompleted = useMemo(() => productionTopics.filter((t) => completedTopics.has(String(t.id))).length, [completedTopics]);

  const modelPct      = Math.round((modelCompleted      / modelTopics.length)      * 100) || 0;
  const queryPct      = Math.round((queryCompleted      / queryTopics.length)      * 100) || 0;
  const productionPct = Math.round((productionCompleted / productionTopics.length) * 100) || 0;
  const exercisePct   = Math.round((completedExerciseCount / totalExercises)        * 100) || 0;

  const [previewTopics, setPreviewTopics] = useState([]);
  const [tip, setTip] = useState(DJANGO_TIPS[0]);

  useEffect(() => {
    const labeled = [
      ...modelTopics.map((t)      => ({ ...t, _section: 'models' })),
      ...queryTopics.map((t)      => ({ ...t, _section: 'queries' })),
      ...productionTopics.map((t) => ({ ...t, _section: 'production' })),
      ...djangoInternalsTopics.map((t) => ({ ...t, _section: 'django' })),
    ];
    setPreviewTopics(shuffleArray(labeled).slice(0, 4));
    setTip(DJANGO_TIPS[Math.floor(Math.random() * DJANGO_TIPS.length)]);
  }, []);

  const weakTopics = useMemo(
    () => allTopics.filter((t) => !completedTopics.has(String(t.id))).slice(0, 6),
    [allTopics, completedTopics]
  );

  const recentExercises = exercises.slice(0, 3);

  function handleTopicToggle(id) {
    isTopicComplete(id) ? markTopicIncomplete(id) : markTopicComplete(id);
  }

  function topicHref(topic) {
    if (topic._section === 'models')     return `/learn/models/${topic.id}`;
    if (topic._section === 'production') return `/learn/production/${topic.id}`;
    if (topic._section === 'django')     return `/learn/django/${topic.id}`;
    return `/learn/queries/${topic.id}`;
  }

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
      >
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Accent glow */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: 'var(--accent)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            {/* Left */}
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5 border"
                style={{
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent)',
                  borderColor: 'var(--accent-border)',
                }}
              >
                <Zap className="w-3 h-3" />
                Interactive Django ORM Learning
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight" style={{ color: 'var(--text)' }}>
                Django{' '}
                <span style={{ color: 'var(--accent)' }}>by Uzair</span>
              </h1>

              <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--text-muted)' }}>
                Master Django — models, ORM, middleware, project flow, and file handling — through structured lessons and hands-on exercises.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 shadow-md"
                  style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)' }}
                >
                  <BookOpen className="w-4 h-4" />
                  Continue Learning
                </Link>
                <Link
                  href="/practice"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150"
                  style={{
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text)',
                    backgroundColor: 'var(--surface)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
                >
                  <Zap className="w-4 h-4" />
                  Start Practicing
                </Link>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/uzairansari11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/uzairansari11/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <LinkedinIcon className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
                <a
                  href="https://uzairansari11.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Portfolio
                </a>
              </div>
            </div>

            {/* Right — Overall progress ring */}
            <div
              className="flex flex-col items-center gap-5 p-6 rounded-2xl border shrink-0"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', minWidth: 200 }}
            >
              <ProgressRing
                percent={overallPercent}
                size={120}
                stroke={12}
                label="Overall Progress"
                sublabel={`${completedTopicCount + completedExerciseCount} of ${totalTopics + totalExercises} items`}
              />
              <div className="w-full text-center">
                <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                  {streak > 0 ? (
                    <span className="flex items-center justify-center gap-1">
                      <Trophy className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                      <span style={{ color: 'var(--accent)' }}>{streak}-day streak</span>
                    </span>
                  ) : 'Start your streak today'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Topics Completed" value={completedTopicCount} subtitle={`of ${totalTopics} total`} icon={BookOpen} trend={completedTopicCount > 0 ? 'up' : 'neutral'} trendLabel={completedTopicCount > 0 ? 'Keep going' : 'Start now'} />
            <StatsCard title="Exercises Solved" value={completedExerciseCount} subtitle={`of ${totalExercises} total`} icon={Zap} trend={completedExerciseCount > 0 ? 'up' : 'neutral'} trendLabel={completedExerciseCount > 0 ? 'Great work' : 'Try one'} />
            <StatsCard title="Practice Streak" value={streak} subtitle="days in a row" icon={Trophy} trend={streak > 1 ? 'up' : 'neutral'} trendLabel={streak > 1 ? `${streak} days!` : 'Start streak'} />
            <StatsCard title="Total Progress" value={`${overallPercent}%`} subtitle="across all content" icon={Target} trend={overallPercent > 0 ? 'up' : 'neutral'} trendLabel={overallPercent >= 100 ? 'Complete!' : `${100 - overallPercent}% left`} />
          </div>
        </section>

        {/* ── Progress Overview ─────────────────────────────────────────── */}
        <section>
          <SectionHeading icon={TrendingUp} title="Progress Overview" subtitle="Your learning journey at a glance" />

          <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Mini rings grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <ProgressRing percent={modelPct}      size={76} stroke={7} delay={0}    label="Models"     sublabel={`${modelCompleted}/${modelTopics.length}`} />
              <ProgressRing percent={queryPct}      size={76} stroke={7} delay={0.1}  label="Queries"    sublabel={`${queryCompleted}/${queryTopics.length}`} />
              <ProgressRing percent={productionPct} size={76} stroke={7} delay={0.2}  label="Production" sublabel={`${productionCompleted}/${productionTopics.length}`} />
              <ProgressRing percent={exercisePct}   size={76} stroke={7} delay={0.3}  label="Practice"   sublabel={`${completedExerciseCount}/${totalExercises}`} />
            </div>

            {/* Detailed animated bars */}
            <div className="space-y-5">
              {[
                { label: 'Django Models',       pct: modelPct,      done: modelCompleted,         total: modelTopics.length,      desc: 'Fields, relationships, Meta options',  delay: 0 },
                { label: 'QuerySet & ORM',      pct: queryPct,      done: queryCompleted,         total: queryTopics.length,      desc: 'Filter, annotate, aggregate, lookups', delay: 0.08 },
                { label: 'Production Patterns', pct: productionPct, done: productionCompleted,    total: productionTopics.length, desc: 'Auth, caching, Celery, deployment',    delay: 0.16 },
                { label: 'Practice Exercises',  pct: exercisePct,   done: completedExerciseCount, total: totalExercises,          desc: 'Beginner to advanced challenges',       delay: 0.24 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{row.label}</span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
                      {row.done}/{row.total}
                    </span>
                  </div>
                  <AnimatedBar value={row.pct} delay={row.delay} />
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-subtle)' }}>{row.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Main two-column ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — topics + exercises */}
          <div className="lg:col-span-2 space-y-8">

            {/* Continue Learning */}
            <section>
              <SectionHeading
                icon={BookOpen}
                title="Continue Learning"
                subtitle="Pick up where you left off"
                action={
                  <Link
                    href="/learn"
                    className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previewTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isCompleted={isTopicComplete(topic.id)}
                    isBookmarked={isBookmarked(topic.id)}
                    onComplete={() => handleTopicToggle(topic.id)}
                    onBookmark={() => toggleBookmark(topic.id)}
                    href={topicHref(topic)}
                  />
                ))}
              </div>
            </section>

            {/* Recent Practice */}
            <section>
              <SectionHeading
                icon={Zap}
                title="Recent Practice"
                subtitle="Latest exercises to try"
                action={
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    All exercises <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="space-y-2">
                {recentExercises.map((ex) => {
                  const done = completedExercises.has(String(ex.id));
                  return (
                    <Link key={ex.id} href={`/practice/${ex.id}`} className="group block">
                      <div
                        className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-150"
                        style={{
                          backgroundColor: done ? 'rgba(34,197,94,0.05)' : 'var(--surface)',
                          borderColor: done ? 'rgba(34,197,94,0.3)' : 'var(--border)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-ring)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = done ? 'rgba(34,197,94,0.3)' : 'var(--border)'; }}
                      >
                        <div
                          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                          style={{
                            backgroundColor: done ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
                            color: done ? '#22c55e' : 'var(--text-muted)',
                          }}
                        >
                          {done ? <CheckCircle className="w-4.5 h-4.5" /> : <Zap className="w-4.5 h-4.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{ex.title}</p>
                            <Badge variant={ex.difficulty} size="sm">
                              {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{ex.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0 transition-colors" style={{ color: 'var(--text-subtle)' }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">

            {/* ORM Spotlight */}
            <section>
              <SectionHeading icon={Target} title="ORM Spotlight" />
              <div
                className="rounded-2xl border p-5"
                style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}
              >
                <Badge variant="warning" size="sm" className="mb-3">{tip.tag}</Badge>
                <h3 className="font-bold text-sm mb-2 leading-snug" style={{ color: 'var(--text)' }}>{tip.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tip.tip}</p>
              </div>
            </section>

            {/* Not yet done */}
            <section>
              <SectionHeading icon={Clock} title="Not Yet Done" />
              {weakTopics.length === 0 ? (
                <div
                  className="text-center py-8 rounded-2xl border"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <CheckCircle className="w-9 h-9 mx-auto mb-2" style={{ color: '#22c55e' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>All done!</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You&apos;ve completed everything.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {weakTopics.map((topic) => (
                    <Link key={topic.id} href={topicHref(topic)} className="group block">
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-ring)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--border-strong)' }} />
                        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                          {topic.title}
                        </span>
                        <Badge variant={topic.difficulty} size="sm">{topic.difficulty.slice(0, 3)}</Badge>
                      </div>
                    </Link>
                  ))}
                  {allTopics.filter((t) => !completedTopics.has(String(t.id))).length > 6 && (
                    <Link
                      href="/learn"
                      className="block text-center text-xs font-medium pt-1 transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      +{allTopics.filter((t) => !completedTopics.has(String(t.id))).length - 6} more topics
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Learning paths */}
            <section>
              <SectionHeading icon={Code2} title="Learning Paths" />
              <div className="space-y-2">
                {[
                  { href: '/learn/models',     icon: Database, label: 'Django Models',     sub: `${modelTopics.length} topics`,      color: '#8b5cf6' },
                  { href: '/learn/queries',    icon: BookOpen, label: 'QuerySet & ORM',     sub: `${queryTopics.length} topics`,      color: '#3b82f6' },
                  { href: '/learn/production', icon: Flame,    label: 'Production',         sub: `${productionTopics.length} topics`, color: '#f59e0b' },
                  { href: '/learn/django',     icon: Search,   label: 'Django Internals',   sub: `${djangoInternalsTopics.length} topics`, color: '#22c55e' },
                ].map(({ href, icon: Icon, label, sub, color }) => (
                  <Link key={href} href={href} className="group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: `${color}18`, color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-subtle)' }} />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer
        className="border-t py-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
            Django by Uzair &mdash; Built for developers who want to level up.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/uzairansari11"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/uzairansari11/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
              LinkedIn
            </a>
            <a
              href="https://uzairansari11.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Globe className="w-3.5 h-3.5" />
              Portfolio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
