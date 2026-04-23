'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Layers, ChevronLeft, BookOpen } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import TopicCard from '@/components/ui/TopicCard';
import ProgressBar from '@/components/ui/ProgressBar';
import SearchBar from '@/components/ui/SearchBar';
import DifficultyFilter from '@/components/practice/DifficultyFilter';
import { djangoInternalsTopics } from '@/data/django-internals-topics';

export default function DjangoInternalsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  const {
    completedTopics,
    isTopicComplete,
    markTopicComplete,
    markTopicIncomplete,
    toggleBookmark,
    isBookmarked,
  } = useProgress();

  const completedCount = useMemo(
    () => djangoInternalsTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );

  const progress = Math.round((completedCount / djangoInternalsTopics.length) * 100);

  const counts = useMemo(() => ({
    all: djangoInternalsTopics.length,
    beginner: djangoInternalsTopics.filter((t) => t.difficulty === 'beginner').length,
    intermediate: djangoInternalsTopics.filter((t) => t.difficulty === 'intermediate').length,
    advanced: djangoInternalsTopics.filter((t) => t.difficulty === 'advanced').length,
  }), []);

  const filtered = useMemo(() => {
    let topics = djangoInternalsTopics;

    if (difficulty !== 'all') {
      topics = topics.filter((t) => t.difficulty === difficulty);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      topics = topics.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return topics;
  }, [search, difficulty]);

  function handleToggle(id) {
    if (isTopicComplete(id)) {
      markTopicIncomplete(id);
    } else {
      markTopicComplete(id);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center gap-2 text-sm mb-5">
            <Link
              href="/learn"
              className="flex items-center gap-1 transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Learning Center
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>Django Internals</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-wrap items-start gap-4">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--text)' }}
                >
                  Django Internals
                </h1>
                <p className="mt-1 max-w-lg" style={{ color: 'var(--text-muted)' }}>
                  Deep dives into how Django works — project flow, middleware pipeline, file handling, and the request/response lifecycle.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {completedCount}/{djangoInternalsTopics.length} completed
              </span>
              <div className="w-32">
                <ProgressBar value={progress} color="accent" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search topics, tags…"
            />
          </div>
          <DifficultyFilter
            selected={difficulty}
            onChange={setDifficulty}
            counts={counts}
          />
        </div>

        <div className="flex items-center justify-between mb-5">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {filtered.length === djangoInternalsTopics.length
              ? `${djangoInternalsTopics.length} topics`
              : `${filtered.length} of ${djangoInternalsTopics.length} topics`}
            {search && (
              <span className="ml-1" style={{ color: 'var(--accent)' }}>
                matching &quot;{search}&quot;
              </span>
            )}
          </p>
          {(search || difficulty !== 'all') && (
            <button
              onClick={() => { setSearch(''); setDifficulty('all'); }}
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--text-subtle)' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
            <p className="font-semibold" style={{ color: 'var(--text)' }}>No topics found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Try a different search term or difficulty filter.
            </p>
            <button
              onClick={() => { setSearch(''); setDifficulty('all'); }}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', border: '1px solid transparent' }}
            >
              Show all topics
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                isCompleted={isTopicComplete(topic.id)}
                isBookmarked={isBookmarked(topic.id)}
                onComplete={() => handleToggle(topic.id)}
                onBookmark={() => toggleBookmark(topic.id)}
                href={`/learn/django/${topic.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
