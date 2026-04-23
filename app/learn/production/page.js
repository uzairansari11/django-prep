'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, ChevronLeft, BookOpen,
  Shield, Database, List, FileText, Settings, Zap,
  Clock, Globe, Lock, TrendingUp, X,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import TopicCard from '@/components/ui/TopicCard';
import SearchBar from '@/components/ui/SearchBar';
import DifficultyFilter from '@/components/practice/DifficultyFilter';
import { productionTopics, productionSubcategories } from '@/data/production-topics';

const ICON_MAP = { Shield, Database, List, FileText, Settings, Zap, Clock, Globe, Lock, TrendingUp };

export default function ProductionPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

  const { completedTopics, isTopicComplete, markTopicComplete, markTopicIncomplete, toggleBookmark, isBookmarked } = useProgress();

  const completedCount = useMemo(
    () => productionTopics.filter(t => completedTopics.has(String(t.id))).length,
    [completedTopics]
  );
  const progress = Math.round((completedCount / productionTopics.length) * 100);

  const difficultyCounts = useMemo(() => ({
    all: productionTopics.length,
    beginner: productionTopics.filter(t => t.difficulty === 'beginner').length,
    intermediate: productionTopics.filter(t => t.difficulty === 'intermediate').length,
    advanced: productionTopics.filter(t => t.difficulty === 'advanced').length,
  }), []);

  const subcategoryStats = useMemo(() => productionSubcategories.map(sub => {
    const topicsInSub = productionTopics.filter(t => t.subcategory === sub.id);
    const completedInSub = topicsInSub.filter(t => completedTopics.has(String(t.id))).length;
    return { ...sub, total: topicsInSub.length, completed: completedInSub, pct: topicsInSub.length > 0 ? Math.round((completedInSub / topicsInSub.length) * 100) : 0 };
  }), [completedTopics]);

  const filtered = useMemo(() => {
    let topics = productionTopics;
    if (activeSubcategory !== 'all') topics = topics.filter(t => t.subcategory === activeSubcategory);
    if (difficulty !== 'all') topics = topics.filter(t => t.difficulty === difficulty);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      topics = topics.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return topics;
  }, [search, difficulty, activeSubcategory]);

  const hasFilters = search || difficulty !== 'all' || activeSubcategory !== 'all';
  const clearFilters = () => { setSearch(''); setDifficulty('all'); setActiveSubcategory('all'); };

  const activeSub = subcategoryStats.find(s => s.id === activeSubcategory);

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Page Header ── */}
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            <Link href="/learn" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
              <ChevronLeft className="w-3.5 h-3.5" /> Learning Center
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>Production Patterns</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Production Patterns</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>From auth to deployment — build Django apps that scale.</p>
              </div>
            </div>

            {/* Progress */}
            <div className="sm:text-right shrink-0">
              <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--accent)' }}>
                {completedCount} / {productionTopics.length} completed
              </p>
              <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: 'Total Topics', value: productionTopics.length },
              { label: 'Completed', value: completedCount },
              { label: 'Subcategories', value: productionSubcategories.length },
              { label: 'Intermediate', value: difficultyCounts.intermediate },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-base font-bold" style={{ color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: Sidebar + Main ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">

          {/* ── LEFT SIDEBAR: Category navigation ── */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div
              className="sticky top-4 flex flex-col"
              style={{ maxHeight: 'calc(100vh - 5rem)' }}
            >
              {/* Heading — always visible */}
              <p className="text-[11px] font-semibold uppercase tracking-widest px-2 mb-3 shrink-0" style={{ color: 'var(--text-subtle)' }}>
                Categories
              </p>

              {/* Scrollable list */}
              <div className="overflow-y-auto space-y-1 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                {/* All */}
                <CategoryBtn
                  label="All Topics"
                  count={productionTopics.length}
                  isActive={activeSubcategory === 'all'}
                  onClick={() => setActiveSubcategory('all')}
                />

                <div className="my-2 h-px" style={{ backgroundColor: 'var(--border)' }} />

                {/* Each subcategory */}
                {subcategoryStats.map(sub => {
                  const Icon = ICON_MAP[sub.icon];
                  return (
                    <CategoryBtn
                      key={sub.id}
                      icon={Icon}
                      label={sub.label}
                      count={sub.total}
                      completed={sub.completed}
                      pct={sub.pct}
                      isActive={activeSubcategory === sub.id}
                      onClick={() => setActiveSubcategory(activeSubcategory === sub.id ? 'all' : sub.id)}
                    />
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── MAIN: Filters + Grid ── */}
          <div className="flex-1 min-w-0">

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <SearchBar value={search} onChange={setSearch} placeholder="Search topics, tags…" className="flex-1" />
              <DifficultyFilter selected={difficulty} onChange={setDifficulty} counts={difficultyCounts} />
            </div>

            {/* Active filter context + meta */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>{filtered.length}</span> topic{filtered.length !== 1 ? 's' : ''}
                  {activeSub && (
                    <span style={{ color: 'var(--text-muted)' }}> in <span style={{ color: 'var(--accent)' }}>{activeSub.label}</span></span>
                  )}
                  {search && (
                    <span> matching &ldquo;<span style={{ color: 'var(--accent)' }}>{search}</span>&rdquo;</span>
                  )}
                </p>
                {/* Mobile subcategory dropdown */}
                <select
                  value={activeSubcategory}
                  onChange={e => setActiveSubcategory(e.target.value)}
                  className="lg:hidden text-xs rounded-lg px-2 py-1 focus:outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="all">All Categories</option>
                  {productionSubcategories.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Flame className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
                <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No topics found</p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Try a different search or filter.</p>
                <button onClick={clearFilters} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)' }}>
                  Show all topics
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(topic => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isCompleted={isTopicComplete(topic.id)}
                    isBookmarked={isBookmarked(topic.id)}
                    onComplete={() => isTopicComplete(topic.id) ? markTopicIncomplete(topic.id) : markTopicComplete(topic.id)}
                    onBookmark={() => toggleBookmark(topic.id)}
                    href={`/learn/production/${topic.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Category sidebar button ── */
function CategoryBtn({ icon: Icon, label, count, completed, pct, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2.5 py-2 rounded-xl transition-all duration-150"
      style={isActive
        ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }
        : { color: 'var(--text-muted)' }
      }
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />}
        <span className="flex-1 text-xs font-medium truncate">{label}</span>
        <span className="text-[11px] shrink-0" style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-subtle)' }}>{count}</span>
      </div>
      {/* Mini progress bar shown when there's progress data */}
      {pct !== undefined && (
        <div className="mt-1.5 ml-5 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: isActive ? 'var(--accent-border)' : 'var(--border)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--accent)', opacity: isActive ? 1 : 0.5 }} />
        </div>
      )}
    </button>
  );
}
