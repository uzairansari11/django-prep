'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { exercises } from '@/data/exercises';
import { useProgress } from '@/hooks/useProgress';
import { useFilters } from '@/hooks/useFilters';
import ExerciseCard from '@/components/practice/ExerciseCard';
import DifficultyFilter from '@/components/practice/DifficultyFilter';
import SearchBar from '@/components/ui/SearchBar';
import { celebrate, confettiCannon } from '@/lib/confetti';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const ALL_TOPICS = ['all', ...Array.from(new Set(exercises.map(e => e.topic).filter(t => t && t !== 'all'))).sort()];

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Loading exercises…</p>
      </div>
    }>
      <PracticePageBody />
    </Suspense>
  );
}

function PracticePageBody() {
  const {
    isExerciseComplete,
    markExerciseComplete,
    toggleBookmark,
    isBookmarked,
    completedExercises,
  } = useProgress();

  const { filters, setFilter, clearFilters } = useFilters({
    difficulty: 'all',
    category: 'all',
    search: '',
    topic: 'all',
  });

  const { difficulty, category, search: q, topic } = filters;

  const totalExercises = exercises.length;
  const totalCompleted = completedExercises.size;
  const completionPct = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;

  const difficultyCounts = useMemo(() => {
    const c = { all: totalExercises };
    DIFFICULTIES.forEach(d => { c[d] = exercises.filter(e => e.difficulty === d).length; });
    return c;
  }, [totalExercises]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    return exercises.filter(ex => {
      if (difficulty !== 'all' && ex.difficulty !== difficulty) return false;
      if (category !== 'all' && ex.category !== category) return false;
      if (topic !== 'all' && ex.topic !== topic) return false;
      if (search && ![ex.title, ex.description, ...(ex.tags ?? [])].join(' ').toLowerCase().includes(search)) return false;
      return true;
    });
  }, [difficulty, category, topic, q]);

  const handleComplete = (exerciseId) => {
    const wasCompleted = isExerciseComplete(exerciseId);
    markExerciseComplete(exerciseId);
    if (!wasCompleted) {
      celebrate();
      const exercise = exercises.find(e => e.id === exerciseId);
      const newTotal = totalCompleted + 1;
      toast.success('Exercise completed', {
        description: `“${exercise?.title}” — ${newTotal}/${totalExercises} done`,
        duration: 3000,
      });
      if (newTotal % 10 === 0 || newTotal === totalExercises) {
        confettiCannon();
        toast.success('Milestone reached', { description: `${newTotal} exercises complete`, duration: 5000 });
      }
    }
  };

  const hasFilters = q || difficulty !== 'all' || category !== 'all' || topic !== 'all';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] mb-6">
        <Link href="/" style={{ color: 'var(--text-muted)' }} className="hover:underline">Home</Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>Practice</span>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Practice exercises
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Hands-on Django ORM challenges. Write queries, reveal hints when stuck, check solutions.
          </p>
        </div>
        <div className="shrink-0">
          <p suppressHydrationWarning className="text-[12px] tabular-nums mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text)' }}>{totalCompleted}</span> / {totalExercises} solved · <span className="tabular-nums">{completionPct}%</span>
          </p>
          <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
            <div suppressHydrationWarning className="h-full" style={{ width: `${completionPct}%`, backgroundColor: 'var(--accent)' }} />
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1">
          <SearchBar
            value={q}
            onChange={(value) => setFilter('search', value)}
            placeholder="Search exercises by title, description, tag…"
          />
        </div>
        <select
          value={topic}
          onChange={(e) => setFilter('topic', e.target.value)}
          className="text-[13px] rounded px-2.5 py-2 focus:outline-none"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          aria-label="Filter by topic"
        >
          {ALL_TOPICS.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All topics' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <DifficultyFilter
          selected={difficulty}
          onChange={(v) => setFilter('difficulty', v)}
          counts={difficultyCounts}
        />
        <div role="group" aria-label="Filter by category" className="flex items-center gap-1 sm:ml-auto">
          {['all', 'models', 'queries'].map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter('category', cat)}
                className="px-2.5 py-1 rounded text-[12px] font-medium transition-colors"
                style={active
                  ? { backgroundColor: 'var(--text)', color: 'var(--bg)', border: '1px solid var(--text)' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'exercise' : 'exercises'}
          {q && <span style={{ color: 'var(--text)' }}> · &ldquo;{q}&rdquo;</span>}
        </p>
        {hasFilters && (
          <button onClick={clearFilters} className="text-[12px] hover:underline" style={{ color: 'var(--text-muted)' }}>
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              href={`/practice/${ex.id}`}
              isCompleted={isExerciseComplete(ex.id)}
              isBookmarked={isBookmarked(ex.id)}
              onComplete={() => handleComplete(ex.id)}
              onBookmark={() => toggleBookmark(ex.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text)' }}>No exercises found</p>
          <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>Try a different search term or filter.</p>
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded text-[13px] font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            Show all
          </button>
        </div>
      )}
    </div>
  );
}
