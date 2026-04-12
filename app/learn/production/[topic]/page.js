'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  XCircle,
  Clock,
  Flame,
  Shield,
  Database,
  List,
  FileText,
  Settings,
  Zap,
  Globe,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import CodeBlock from '@/components/ui/CodeBlock';
import Badge from '@/components/ui/Badge';
import TopicList from '@/components/learn/TopicList';
import ChecklistCard from '@/components/ui/ChecklistCard';
import { productionTopics, productionSubcategories } from '@/data/production-topics';

// ── Icon map for subcategory labels ────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function TextContent({ text }) {
  if (!text) return null;
  const paragraphs = String(text).split('\n').filter((p) => p.trim().length > 0);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-slate-700 dark:text-zinc-300 leading-relaxed text-sm">
          {para}
        </p>
      ))}
    </div>
  );
}

function SectionHeading({ icon: Icon, children, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 mb-4 ${className}`}>
      {Icon && <Icon className="w-5 h-5 shrink-0" />}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{children}</h2>
    </div>
  );
}

function SubcategoryBadge({ subcategoryId }) {
  const sub = productionSubcategories.find((s) => s.id === subcategoryId);
  if (!sub) return null;
  const IconComponent = ICON_MAP[sub.icon];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200/60 dark:border-amber-800/40">
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {sub.label}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductionTopicPage({ params }) {
  const resolvedParams = use(params);
  const topicId = resolvedParams.topic;
  const router = useRouter();

  const topic = productionTopics.find((t) => t.id === topicId);
  const topicIndex = productionTopics.findIndex((t) => t.id === topicId);
  const prevTopic = topicIndex > 0 ? productionTopics[topicIndex - 1] : null;
  const nextTopic = topicIndex < productionTopics.length - 1 ? productionTopics[topicIndex + 1] : null;

  // Related topics: same subcategory, excluding current
  const relatedTopics = topic
    ? productionTopics
        .filter((t) => t.subcategory === topic.subcategory && t.id !== topic.id)
        .slice(0, 3)
    : [];

  const {
    completedTopics,
    markTopicComplete,
    markTopicIncomplete,
    isTopicComplete,
    toggleBookmark,
    isBookmarked,
    saveNote,
    getNote,
  } = useProgress();

  const [noteText, setNoteText] = useState(() => (topic ? getNote(topic.id) : ''));
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveNote = useCallback(() => {
    if (!topic) return;
    saveNote(topic.id, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }, [topic, noteText, saveNote]);

  // 404 state
  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Topic not found</h1>
          <p className="text-slate-500 dark:text-zinc-400 mb-6 text-sm">
            The topic{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 font-mono text-xs">
              {topicId}
            </code>{' '}
            does not exist in our production curriculum.
          </p>
          <Link
            href="/learn/production"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Production
          </Link>
        </div>
      </div>
    );
  }

  const isComplete = isTopicComplete(topic.id);
  const bookmarked = isBookmarked(topic.id);
  const { content } = topic;

  // Checklist items derived from interview notes (first 4)
  const checklistItems = (content.interviewNotes || []).slice(0, 4);

  function handleTopicSelect(selected) {
    router.push(`/learn/production/${selected.id}`);
  }

  // Overall production progress for sidebar
  const productionCompletedCount = productionTopics.filter((t) =>
    completedTopics.has(String(t.id))
  ).length;
  const productionProgress = Math.round((productionCompletedCount / productionTopics.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 mb-4">
          <Link href="/learn" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
            Learn
          </Link>
          <span>/</span>
          <Link href="/learn/production" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
            Production Patterns
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-zinc-300 font-medium truncate max-w-[12rem]">
            {topic.title}
          </span>
        </nav>

        {/* Mobile topic picker — visible only below lg */}
        <div className="lg:hidden mb-5">
          <select
            value={topicId}
            onChange={(e) => router.push(`/learn/production/${e.target.value}`)}
            className="w-full text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all duration-150"
            aria-label="Navigate to topic"
          >
            {productionTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-8 items-start">
          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-1 px-1">
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Production Patterns</span>
            </div>

            {/* Overall production progress */}
            <div className="px-1 mb-4">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
                <span>Overall progress</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {productionCompletedCount}/{productionTopics.length}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out"
                  style={{ width: `${productionProgress}%` }}
                />
              </div>
            </div>

            <TopicList
              topics={productionTopics}
              completedTopics={completedTopics}
              currentTopicId={topic.id}
              onSelect={handleTopicSelect}
            />
          </aside>

          {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Topic header card */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant={topic.difficulty}>
                      {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                    </Badge>
                    {topic.estimatedMinutes && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {topic.estimatedMinutes} min
                      </span>
                    )}
                    <SubcategoryBadge subcategoryId={topic.subcategory} />
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                    {topic.title}
                  </h1>

                  {topic.description && (
                    <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed max-w-2xl">
                      {topic.description}
                    </p>
                  )}

                  {topic.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {topic.tags.map((tag) => (
                        <Badge key={tag} variant="default" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBookmark(topic.id)}
                    title={bookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150 ${
                      bookmarked
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600'
                    }`}
                  >
                    {bookmarked ? (
                      <Bookmark className="w-4 h-4 fill-current" />
                    ) : (
                      <BookmarkPlus className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    onClick={() =>
                      isComplete ? markTopicIncomplete(topic.id) : markTopicComplete(topic.id)
                    }
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                      isComplete
                        ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-600 dark:border-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-800'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isComplete ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── 1. Explanation ────────────────────────────────────────────── */}
            {content.explanation && (
              <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                <SectionHeading icon={BookOpen} className="text-amber-600 dark:text-amber-400">
                  What it is
                </SectionHeading>
                <TextContent text={content.explanation} />
              </section>
            )}

            {/* ── 2. Real World Example ─────────────────────────────────────── */}
            {content.realExample && (
              <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                <SectionHeading icon={Lightbulb} className="text-amber-600 dark:text-amber-400">
                  Real World Example
                </SectionHeading>
                <TextContent text={content.realExample} />
              </section>
            )}

            {/* ── 3. Code Example ───────────────────────────────────────────── */}
            {content.codeExample && (
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Code Example</h2>
                </div>
                <CodeBlock
                  code={content.codeExample}
                  title={`${topic.slug || topic.id}.py`}
                  showLineNumbers
                />
              </section>
            )}

            {/* ── 4. Understanding the Output ───────────────────────────────── */}
            {content.outputExplanation && (
              <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                <SectionHeading icon={BookOpen} className="text-slate-700 dark:text-zinc-300">
                  Understanding the Output
                </SectionHeading>
                <TextContent text={content.outputExplanation} />
              </section>
            )}

            {/* ── 5. Common Mistakes ────────────────────────────────────────── */}
            {content.commonMistakes?.length > 0 && (
              <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 p-6">
                <SectionHeading icon={AlertTriangle} className="text-rose-600 dark:text-rose-400">
                  Common Mistakes
                </SectionHeading>
                <ul className="space-y-3">
                  {content.commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {mistake}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── 6. Interview Notes ────────────────────────────────────────── */}
            {content.interviewNotes?.length > 0 && (
              <section className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-6">
                <SectionHeading icon={Lightbulb} className="text-amber-700 dark:text-amber-400">
                  Interview Notes
                </SectionHeading>
                <ul className="space-y-2.5">
                  {content.interviewNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0 mt-2" />
                      <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{note}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── 7. When to Use ────────────────────────────────────────────── */}
            {content.whenToUse && (
              <section className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-6">
                <SectionHeading icon={CheckCircle} className="text-emerald-700 dark:text-emerald-400">
                  When to Use
                </SectionHeading>
                <TextContent text={content.whenToUse} />
              </section>
            )}

            {/* ── 8. When NOT to Use ────────────────────────────────────────── */}
            {content.whenNotToUse && (
              <section className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800/50 p-6">
                <SectionHeading icon={XCircle} className="text-rose-700 dark:text-rose-400">
                  When NOT to Use
                </SectionHeading>
                <TextContent text={content.whenNotToUse} />
              </section>
            )}

            {/* ── 9. Production Checklist (new) ─────────────────────────────── */}
            {checklistItems.length > 0 && (
              <ChecklistCard
                items={checklistItems}
                title="Production Checklist"
              />
            )}

            {/* ── 10. Related Topics (new) ──────────────────────────────────── */}
            {relatedTopics.length > 0 && (
              <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Related Topics</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedTopics.map((related) => (
                    <Link
                      key={related.id}
                      href={`/learn/production/${related.id}`}
                      className="group block"
                    >
                      <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:border-amber-300 dark:hover:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all duration-150">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors line-clamp-2">
                          {related.title}
                        </p>
                        <Badge variant={related.difficulty} size="sm">
                          {related.difficulty.charAt(0).toUpperCase() + related.difficulty.slice(1)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── 11. User Notes ────────────────────────────────────────────── */}
            <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Notes</h2>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Jot down anything you want to remember about this topic…"
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 dark:focus:border-amber-600 resize-none transition-all duration-150 font-sans"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  Notes are saved locally in your browser
                </span>
                <button
                  onClick={handleSaveNote}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    noteSaved
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-600 text-white hover:bg-amber-700 border border-transparent'
                  }`}
                >
                  {noteSaved ? 'Saved!' : 'Save Note'}
                </button>
              </div>
            </section>

            {/* ── Prev / Next navigation ────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
              {prevTopic ? (
                <Link
                  href={`/learn/production/${prevTopic.id}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all duration-150"
                >
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 group-hover:text-amber-500 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {prevTopic.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextTopic ? (
                <Link
                  href={`/learn/production/${nextTopic.id}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all duration-150 text-right"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-zinc-400 group-hover:text-amber-500 transition-colors">
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {nextTopic.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
