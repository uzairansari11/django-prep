'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Flame,
  ChevronLeft,
  BookOpen,
  Shield,
  Database,
  List,
  FileText,
  Settings,
  Zap,
  Clock,
  Globe,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import TopicCard from '@/components/ui/TopicCard';
import ProgressBar from '@/components/ui/ProgressBar';
import SearchBar from '@/components/ui/SearchBar';
import DifficultyFilter from '@/components/practice/DifficultyFilter';
import { productionTopics, productionSubcategories } from '@/data/production-topics';

const ICON_MAP = {
  Shield,
  Database,
  List,
  FileText,
  Settings,
  Zap,
  Clock,
  Globe,
  Lock,
  TrendingUp,
};

export default function ProductionPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

  const {
    completedTopics,
    isTopicComplete,
    markTopicComplete,
    markTopicIncomplete,
    toggleBookmark,
    isBookmarked,
  } = useProgress();

  const completedCount = useMemo(
    () => productionTopics.filter((t) => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );

  const progress = Math.round((completedCount / productionTopics.length) * 100);

  const difficultyCounts = useMemo(() => ({
    all: productionTopics.length,
    beginner: productionTopics.filter((t) => t.difficulty === 'beginner').length,
    intermediate: productionTopics.filter((t) => t.difficulty === 'intermediate').length,
    advanced: productionTopics.filter((t) => t.difficulty === 'advanced').length,
  }), []);

  // Subcategory completion counts for the sidebar
  const subcategoryStats = useMemo(() => {
    return productionSubcategories.map((sub) => {
      const topicsInSub = productionTopics.filter((t) => t.subcategory === sub.id);
      const completedInSub = topicsInSub.filter((t) => completedTopics.has(String(t.id))).length;
      return {
        ...sub,
        total: topicsInSub.length,
        completed: completedInSub,
        progress: topicsInSub.length > 0 ? Math.round((completedInSub / topicsInSub.length) * 100) : 0,
      };
    });
  }, [completedTopics]);

  const filtered = useMemo(() => {
    let topics = productionTopics;

    if (activeSubcategory !== 'all') {
      topics = topics.filter((t) => t.subcategory === activeSubcategory);
    }

    if (difficulty !== 'all') {
      topics = topics.filter((t) => t.difficulty === difficulty);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      topics = topics.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
          t.subcategory?.toLowerCase().includes(q)
      );
    }

    return topics;
  }, [search, difficulty, activeSubcategory]);

  function handleToggle(id) {
    if (isTopicComplete(id)) {
      markTopicIncomplete(id);
    } else {
      markTopicComplete(id);
    }
  }

  function clearFilters() {
    setSearch('');
    setDifficulty('all');
    setActiveSubcategory('all');
  }

  const hasActiveFilters = search || difficulty !== 'all' || activeSubcategory !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Page header */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-5">
            <Link
              href="/learn"
              className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Learning Center
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Production Patterns</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Gradient icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shrink-0 shadow-lg shadow-amber-500/30">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Production Patterns
                </h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400 max-w-lg">
                  From auth to deployment — build Django apps that scale.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {completedCount}/{productionTopics.length} completed
              </span>
              <div className="w-32">
                <ProgressBar value={progress} color="amber" size="sm" />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/40">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Total Topics</span>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{productionTopics.length}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/40">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{completedCount}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subcategories</span>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{productionSubcategories.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Subcategory filter tabs */}
            <div className="mb-5 -mx-1">
              <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
                {/* All tab */}
                <button
                  onClick={() => setActiveSubcategory('all')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                    activeSubcategory === 'all'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30'
                      : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  All
                </button>

                {productionSubcategories.map((sub) => {
                  const IconComponent = ICON_MAP[sub.icon];
                  const isActive = activeSubcategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubcategory(sub.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30'
                          : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search + Difficulty controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search production topics, tags…"
                />
              </div>
              <DifficultyFilter
                selected={difficulty}
                onChange={setDifficulty}
                counts={difficultyCounts}
              />
            </div>

            {/* Results meta */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtered.length === productionTopics.length
                  ? `${productionTopics.length} topics`
                  : `${filtered.length} of ${productionTopics.length} topics`}
                {search && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    matching &quot;{search}&quot;
                  </span>
                )}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Topics grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <Flame className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No topics found</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Try a different search term, difficulty, or subcategory.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Show all topics
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isCompleted={isTopicComplete(topic.id)}
                    isBookmarked={isBookmarked(topic.id)}
                    onComplete={() => handleToggle(topic.id)}
                    onBookmark={() => toggleBookmark(topic.id)}
                    href={`/learn/production/${topic.id}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar — subcategory progress */}
          <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-6 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">Subcategory Progress</h2>
              </div>

              <div className="space-y-4">
                {subcategoryStats.map((sub) => {
                  const IconComponent = ICON_MAP[sub.icon];
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubcategory(activeSubcategory === sub.id ? 'all' : sub.id)}
                      className={`w-full text-left group transition-all duration-150 ${
                        activeSubcategory === sub.id ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {IconComponent && (
                            <IconComponent className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {sub.label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                          {sub.completed}/{sub.total}
                        </span>
                      </div>
                      <ProgressBar value={sub.progress} color="amber" size="sm" />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
