'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Database, ChevronLeft, BookOpen } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import TopicCard from '@/components/ui/TopicCard';
import ProgressBar from '@/components/ui/ProgressBar';
import SearchBar from '@/components/ui/SearchBar';
import DifficultyFilter from '@/components/practice/DifficultyFilter';
import { modelTopics } from '@/data/models-topics';

export default function ModelsPage() {
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
    () => modelTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );

  const progress = Math.round((completedCount / modelTopics.length) * 100);

  // Difficulty counts for the filter
  const counts = useMemo(() => ({
    all: modelTopics.length,
    beginner: modelTopics.filter((t) => t.difficulty === 'beginner').length,
    intermediate: modelTopics.filter((t) => t.difficulty === 'intermediate').length,
    advanced: modelTopics.filter((t) => t.difficulty === 'advanced').length,
  }), []);

  const filtered = useMemo(() => {
    let topics = modelTopics;

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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 overflow-x-hidden">
      {/* Page header */}
      <div className="bg-white dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 mb-5">
            <Link
              href="/learn"
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Learning Center
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Django Models</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 dark:bg-violet-500 shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Django Models
                </h1>
                <p className="mt-1 text-slate-500 dark:text-zinc-400 max-w-lg">
                  Everything you need to know about defining, customising, and relating Django models to your database.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {completedCount}/{modelTopics.length} completed
              </span>
              <div className="w-32">
                <ProgressBar value={progress} color="purple" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
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

        {/* Results meta */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {filtered.length === modelTopics.length
              ? `${modelTopics.length} topics`
              : `${filtered.length} of ${modelTopics.length} topics`}
            {search && (
              <span className="ml-1 text-indigo-600 dark:text-indigo-400">
                matching &quot;{search}&quot;
              </span>
            )}
          </p>
          {(search || difficulty !== 'all') && (
            <button
              onClick={() => { setSearch(''); setDifficulty('all'); }}
              className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Topic Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 dark:text-zinc-300">No topics found</p>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Try a different search term or difficulty filter.
            </p>
            <button
              onClick={() => { setSearch(''); setDifficulty('all'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
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
                href={`/learn/models/${topic.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
