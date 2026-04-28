'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useProgress } from '@/hooks/useProgress';
import { useFilters } from '@/hooks/useFilters';
import TopicCard from '@/components/ui/TopicCard';
import SearchBar from '@/components/ui/SearchBar';
import DifficultyFilter from '@/components/practice/DifficultyFilter';

export default function ListingPage(props) {
  return (
    <Suspense fallback={<ListingFallback {...props} />}>
      <ListingPageBody {...props} />
    </Suspense>
  );
}

function ListingFallback({ title, description, label, topics }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-[12px] mb-6">
        <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>{label}</span>
      </nav>
      <header className="pb-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{title}</h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </header>
      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Loading {topics?.length ?? 0} topics…</p>
    </div>
  );
}

/**
 * Reusable listing page (Models, Queries, Production, Internals, DRF Views, DRF Serializers).
 *
 * @param {object} props
 * @param {string} props.title           Page heading
 * @param {string} props.description     One-line description
 * @param {string} props.label           Breadcrumb label
 * @param {Array}  props.topics          Source array of topics
 * @param {(id: string) => string} props.hrefFor  Function returning detail href for a topic id
 */
function ListingPageBody({ title, description, label, topics, hrefFor }) {
  const { filters, setFilter, clearFilters } = useFilters({ search: '', difficulty: 'all' });
  const { search, difficulty } = filters;

  const {
    completedTopics,
    isTopicComplete,
    toggleBookmark,
    isBookmarked,
  } = useProgress();

  const completedCount = useMemo(
    () => topics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics, topics]
  );
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  const counts = useMemo(() => ({
    all: topics.length,
    beginner: topics.filter((t) => t.difficulty === 'beginner').length,
    intermediate: topics.filter((t) => t.difficulty === 'intermediate').length,
    advanced: topics.filter((t) => t.difficulty === 'advanced').length,
  }), [topics]);

  const filtered = useMemo(() => {
    let list = topics;
    if (difficulty !== 'all') list = list.filter((t) => t.difficulty === difficulty);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [topics, search, difficulty]);

  const hasFilters = search || difficulty !== 'all';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] mb-6">
        <Link href="/" style={{ color: 'var(--text-muted)' }} className="hover:underline">Home</Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span style={{ color: 'var(--text)' }}>{label}</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
        </div>
        <div className="shrink-0">
          <p className="text-[12px] tabular-nums mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text)' }}>{completedCount}</span> / {topics.length} completed
          </p>
          <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
            <div className="h-full" style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }} />
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(value) => setFilter('search', value)}
            placeholder="Search topics, tags…"
          />
        </div>
        <DifficultyFilter
          selected={difficulty}
          onChange={(value) => setFilter('difficulty', value)}
          counts={counts}
        />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {filtered.length === topics.length ? `${topics.length} topics` : `${filtered.length} of ${topics.length} topics`}
          {search && <span style={{ color: 'var(--text)' }}> · &ldquo;{search}&rdquo;</span>}
        </p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[12px] hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text)' }}>No topics found</p>
          <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>
            Try a different search term or filter.
          </p>
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded text-[13px] font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isCompleted={isTopicComplete(topic.id)}
              isBookmarked={isBookmarked(topic.id)}
              onBookmark={() => toggleBookmark(topic.id)}
              href={hrefFor(topic.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
