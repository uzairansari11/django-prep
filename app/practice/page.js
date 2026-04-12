'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Filter, BookOpen, CheckCircle, Zap, Target } from 'lucide-react'
import { exercises } from '@/data/exercises'
import { useProgress } from '@/hooks/useProgress'
import ExerciseCard from '@/components/practice/ExerciseCard'
import DifficultyFilter from '@/components/practice/DifficultyFilter'
import SearchBar from '@/components/ui/SearchBar'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'

// ─── Unique topics derived from the exercises list ───────────────────────────
const ALL_TOPICS = ['all', ...Array.from(new Set(exercises.map((e) => e.topic).filter((t) => t !== 'all'))).sort()]

// ─── Difficulty ordering for counts ──────────────────────────────────────────
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function PracticePage() {
  const router = useRouter()
  const {
    isExerciseComplete,
    markExerciseComplete,
    toggleBookmark,
    isBookmarked,
    completedExercises,
  } = useProgress()

  // ─── Filter state ─────────────────────────────────────────────────────────
  const [difficulty, setDifficulty] = useState('all')
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [topic, setTopic] = useState('all')

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalExercises = exercises.length
  const totalCompleted = completedExercises.size

  const difficultyStats = useMemo(() => {
    const counts = { all: totalExercises }
    DIFFICULTIES.forEach((d) => {
      counts[d] = exercises.filter((e) => e.difficulty === d).length
    })
    return counts
  }, [totalExercises])

  const completionPct = totalExercises > 0
    ? Math.round((totalCompleted / totalExercises) * 100)
    : 0

  // ─── Filtered exercises ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (difficulty !== 'all' && ex.difficulty !== difficulty) return false
      if (category !== 'all' && ex.category !== category) return false
      if (topic !== 'all' && ex.topic !== topic) return false
      if (q) {
        const haystack = [
          ex.title,
          ex.description,
          ...(ex.tags ?? []),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [difficulty, category, searchQuery, topic])

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleCardClick = (id) => {
    router.push(`/practice/${id}`)
  }

  const handleComplete = (id) => {
    markExerciseComplete(id)
  }

  const handleBookmark = (id) => {
    toggleBookmark(id)
  }

  // ─── Difficulty filter counts based on current category/topic/search ──────
  const filteredDifficultyCounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = exercises.filter((ex) => {
      if (category !== 'all' && ex.category !== category) return false
      if (topic !== 'all' && ex.topic !== topic) return false
      if (q) {
        const haystack = [ex.title, ex.description, ...(ex.tags ?? [])]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    const counts = { all: base.length }
    DIFFICULTIES.forEach((d) => {
      counts[d] = base.filter((e) => e.difficulty === d).length
    })
    return counts
  }, [category, searchQuery, topic])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Hero / Header ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <Link
              href="/"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Practice</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                  <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Practice Exercises
                </h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
                Sharpen your Django ORM skills with hands-on exercises. Write real queries,
                reveal hints one by one, and check the solution when you&apos;re ready.
              </p>
            </div>

            {/* Overall progress pill */}
            <div className="lg:shrink-0 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 min-w-[220px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {completionPct}%
                </span>
              </div>
              <ProgressBar value={completionPct} color="indigo" size="md" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {totalCompleted} of {totalExercises} completed
              </p>
            </div>
          </div>

          {/* ── Stats row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              {
                label: 'Total',
                value: totalExercises,
                icon: BookOpen,
                color: 'text-indigo-600 dark:text-indigo-400',
                bg: 'bg-indigo-50 dark:bg-indigo-900/30',
              },
              {
                label: 'Completed',
                value: totalCompleted,
                icon: CheckCircle,
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/30',
              },
              {
                label: 'Beginner',
                value: difficultyStats.beginner,
                icon: Zap,
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/30',
              },
              {
                label: 'Advanced',
                value: difficultyStats.advanced,
                icon: Target,
                color: 'text-rose-600 dark:text-rose-400',
                bg: 'bg-rose-50 dark:bg-rose-900/30',
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + Grid ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter panel */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 mb-8 space-y-5">
          {/* Row 1: search + topic dropdown */}
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search exercises by title, description or tag…"
              className="flex-1"
            />

            {/* Topic dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all duration-150"
                aria-label="Filter by topic"
              >
                {ALL_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Topics' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: difficulty + category */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <DifficultyFilter
              selected={difficulty}
              onChange={setDifficulty}
              counts={filteredDifficultyCounts}
            />

            {/* Category filter */}
            <div
              role="group"
              aria-label="Filter by category"
              className="flex items-center gap-1.5 sm:ml-auto"
            >
              {['all', 'models', 'queries'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                  className={[
                    'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 border',
                    category === cat
                      ? cat === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-sm'
                        : cat === 'models'
                        ? 'bg-violet-600 text-white border-transparent shadow-sm shadow-violet-500/30'
                        : 'bg-blue-600 text-white border-transparent shadow-sm shadow-blue-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100',
                  ].join(' ')}
                >
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filtered.length}
            </span>{' '}
            {filtered.length === 1 ? 'exercise' : 'exercises'}
            {searchQuery && (
              <>
                {' '}for &ldquo;
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {searchQuery}
                </span>
                &rdquo;
              </>
            )}
          </p>

          {(difficulty !== 'all' || category !== 'all' || topic !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setDifficulty('all')
                setCategory('all')
                setTopic('all')
                setSearchQuery('')
              }}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Exercise grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isCompleted={isExerciseComplete(exercise.id)}
                isBookmarked={isBookmarked(exercise.id)}
                onComplete={handleComplete}
                onBookmark={handleBookmark}
                onClick={() => handleCardClick(exercise.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
              <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              No exercises found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Try adjusting your filters or search query to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                setDifficulty('all')
                setCategory('all')
                setTopic('all')
                setSearchQuery('')
              }}
              className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
