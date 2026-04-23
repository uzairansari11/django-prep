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

const ALL_TOPICS = ['all', ...Array.from(new Set(exercises.map(e => e.topic).filter(t => t !== 'all'))).sort()]
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function PracticePage() {
  const router = useRouter()
  const { isExerciseComplete, markExerciseComplete, toggleBookmark, isBookmarked, completedExercises } = useProgress()

  const [difficulty, setDifficulty] = useState('all')
  const [category, setCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [topic, setTopic] = useState('all')

  const totalExercises = exercises.length
  const totalCompleted = completedExercises.size

  const difficultyStats = useMemo(() => {
    const counts = { all: totalExercises }
    DIFFICULTIES.forEach(d => { counts[d] = exercises.filter(e => e.difficulty === d).length })
    return counts
  }, [totalExercises])

  const completionPct = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return exercises.filter(ex => {
      if (difficulty !== 'all' && ex.difficulty !== difficulty) return false
      if (category !== 'all' && ex.category !== category) return false
      if (topic !== 'all' && ex.topic !== topic) return false
      if (q && ![ex.title, ex.description, ...(ex.tags ?? [])].join(' ').toLowerCase().includes(q)) return false
      return true
    })
  }, [difficulty, category, searchQuery, topic])

  const filteredDifficultyCounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = exercises.filter(ex => {
      if (category !== 'all' && ex.category !== category) return false
      if (topic !== 'all' && ex.topic !== topic) return false
      if (q && ![ex.title, ex.description, ...(ex.tags ?? [])].join(' ').toLowerCase().includes(q)) return false
      return true
    })
    const counts = { all: base.length }
    DIFFICULTIES.forEach(d => { counts[d] = base.filter(e => e.difficulty === d).length })
    return counts
  }, [category, searchQuery, topic])

  const clearAll = () => { setDifficulty('all'); setCategory('all'); setTopic('all'); setSearchQuery('') }

  const STATS = [
    { label: 'Total',     value: totalExercises,           icon: BookOpen    },
    { label: 'Completed', value: totalCompleted,           icon: CheckCircle },
    { label: 'Beginner',  value: difficultyStats.beginner, icon: Zap         },
    { label: 'Advanced',  value: difficultyStats.advanced, icon: Target      },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Header ── */}
      <div className="border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" style={{ color: 'var(--accent)' }} className="hover:underline">Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Practice</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--accent-light)' }}>
                  <Target className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                  Practice Exercises
                </h1>
              </div>
              <p className="text-base max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                Sharpen your Django ORM skills with hands-on exercises. Write real queries,
                reveal hints one by one, and check the solution when you&apos;re ready.
              </p>
            </div>

            {/* Progress pill */}
            <div className="w-full lg:w-auto lg:shrink-0 rounded-2xl p-4 sm:min-w-[220px]"
              style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
                <span suppressHydrationWarning className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{completionPct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                <div suppressHydrationWarning className="h-full rounded-full transition-all duration-700" style={{ width: `${completionPct}%`, backgroundColor: 'var(--accent)' }} />
              </div>
              <p suppressHydrationWarning className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>
                {totalCompleted} of {totalExercises} completed
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-light)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p suppressHydrationWarning className="text-xl font-bold leading-none" style={{ color: 'var(--text)' }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* Filter panel */}
        <div className="rounded-2xl p-5 mb-7 space-y-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search exercises by title, description or tag…" className="flex-1" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-subtle)' }} aria-hidden="true" />
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="text-sm rounded-xl px-3 py-2 focus:outline-none"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                aria-label="Filter by topic"
              >
                {ALL_TOPICS.map(t => (
                  <option key={t} value={t}>{t === 'all' ? 'All Topics' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <DifficultyFilter selected={difficulty} onChange={setDifficulty} counts={filteredDifficultyCounts} />
            <div role="group" aria-label="Filter by category" className="flex items-center gap-1.5 sm:ml-auto">
              {['all', 'models', 'queries'].map(cat => {
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    aria-pressed={isActive}
                    className="px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={isActive
                      ? { backgroundColor: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                      : { backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text)'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Showing <span className="font-semibold" style={{ color: 'var(--text)' }}>{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'exercise' : 'exercises'}
            {searchQuery && (
              <> for &ldquo;<span className="font-semibold" style={{ color: 'var(--accent)' }}>{searchQuery}</span>&rdquo;</>
            )}
          </p>
          {(difficulty !== 'all' || category !== 'all' || topic !== 'all' || searchQuery) && (
            <button onClick={clearAll} className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isCompleted={isExerciseComplete(exercise.id)}
                isBookmarked={isBookmarked(exercise.id)}
                onComplete={() => markExerciseComplete(exercise.id)}
                onBookmark={() => toggleBookmark(exercise.id)}
                onClick={() => router.push(`/practice/${exercise.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-5 rounded-2xl mb-5" style={{ backgroundColor: 'var(--surface-2)' }}>
              <BookOpen className="w-10 h-10" style={{ color: 'var(--text-subtle)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No exercises found</h3>
            <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Try adjusting your filters or search query.
            </p>
            <button
              onClick={clearAll}
              className="mt-6 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors duration-150"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
