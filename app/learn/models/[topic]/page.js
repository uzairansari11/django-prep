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
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import CodeBlock from '@/components/ui/CodeBlock';
import Badge from '@/components/ui/Badge';
import TopicList from '@/components/learn/TopicList';
import { modelTopics } from '@/data/models-topics';
import AnimatedConceptSection from '@/components/learn/AnimatedConceptSection';
import ModelTableAnimation from '@/components/animations/ModelTableAnimation';
import FKExplainer from '@/components/animations/FKExplainer';
import QuerysetEvaluation from '@/components/animations/QuerysetEvaluation';
import RelationshipChooser from '@/components/animations/RelationshipChooser';
import OnDeleteVisualizer from '@/components/animations/OnDeleteVisualizer';

// ── Helpers ────────────────────────────────────────────────────────────────────

function TextContent({ text }) {
  if (!text) return null;
  const paragraphs = String(text).split('\n').filter((p) => p.trim().length > 0);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ModelTopicPage({ params }) {
  const resolvedParams = use(params);
  const topicId = resolvedParams.topic;
  const router = useRouter();

  const topic = modelTopics.find((t) => t.id === topicId);
  const topicIndex = modelTopics.findIndex((t) => t.id === topicId);
  const prevTopic = topicIndex > 0 ? modelTopics[topicIndex - 1] : null;
  const nextTopic = topicIndex < modelTopics.length - 1 ? modelTopics[topicIndex + 1] : null;

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Topic not found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            The topic <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">{topicId}</code> does not exist in our models curriculum.
          </p>
          <Link
            href="/learn/models"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Models
          </Link>
        </div>
      </div>
    );
  }

  const isComplete = isTopicComplete(topic.id);
  const bookmarked = isBookmarked(topic.id);
  const { content } = topic;

  function handleTopicSelect(selected) {
    router.push(`/learn/models/${selected.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/learn" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Learn
          </Link>
          <span>/</span>
          <Link href="/learn/models" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Django Models
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-48">{topic.title}</span>
        </nav>

        <div className="flex gap-8 items-start">
          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-72 shrink-0 sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4">
            <div className="flex items-center gap-2 mb-4 px-1">
              <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Django Models</span>
            </div>
            <TopicList
              topics={modelTopics}
              completedTopics={completedTopics}
              currentTopicId={topic.id}
              onSelect={handleTopicSelect}
            />
          </aside>

          {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Topic header card */}
            <AnimatedConceptSection delay={0}>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={topic.difficulty}>
                        {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                      </Badge>
                      {topic.estimatedMinutes && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          {topic.estimatedMinutes} min
                        </span>
                      )}
                      <Badge variant="models" size="sm">Models</Badge>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                      {topic.title}
                    </h1>

                    {topic.description && (
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
                        {topic.description}
                      </p>
                    )}

                    {/* Tags */}
                    {topic.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {topic.tags.map((tag) => (
                          <Badge key={tag} variant="default" size="sm">{tag}</Badge>
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
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600'
                      }`}
                    >
                      {bookmarked
                        ? <Bookmark className="w-4 h-4 fill-current" />
                        : <BookmarkPlus className="w-4 h-4" />
                      }
                      <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => isComplete ? markTopicIncomplete(topic.id) : markTopicComplete(topic.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                        isComplete
                          ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-600 dark:border-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-800'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isComplete ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedConceptSection>

            {/* ── Interactive animation: choosing-relationships ──────────── */}
            {topic.id === 'choosing-relationships' && (
              <AnimatedConceptSection delay={0.05}>
                <RelationshipChooser />
              </AnimatedConceptSection>
            )}

            {/* ── Interactive animation: on-delete-options ───────────────── */}
            {topic.id === 'on-delete-options' && (
              <AnimatedConceptSection delay={0.05}>
                <OnDeleteVisualizer />
              </AnimatedConceptSection>
            )}

            {/* ── Interactive animation: what-is-a-model ─────────────────── */}
            {topic.id === 'what-is-a-model' && (
              <AnimatedConceptSection delay={0.05}>
                <ModelTableAnimation
                  modelName="Book"
                  fields={[
                    { name: 'title', type: 'CharField', dbColumn: 'title', sampleValues: ['Harry Potter', 'Dune', '1984'] },
                    { name: 'price', type: 'DecimalField', dbColumn: 'price', sampleValues: ['9.99', '14.99', '7.99'] },
                    { name: 'published', type: 'DateField', dbColumn: 'published', sampleValues: ['1997-06-26', '1965-08-01', '1949-06-08'] },
                    { name: 'in_stock', type: 'BooleanField', dbColumn: 'in_stock', sampleValues: ['True', 'True', 'False'] },
                  ]}
                />
              </AnimatedConceptSection>
            )}

            {/* ── 1. What it is ─────────────────────────────────────────── */}
            {content.explanation && (
              <AnimatedConceptSection delay={0.1}>
                <section className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6">
                  <SectionHeading icon={BookOpen} className="text-slate-700 dark:text-slate-300">
                    What it is
                  </SectionHeading>
                  <TextContent text={content.explanation} />
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── 2. Real World Example ─────────────────────────────────── */}
            {content.realExample && (
              <AnimatedConceptSection delay={0.15}>
                <section className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6">
                  <SectionHeading icon={Lightbulb} className="text-amber-600 dark:text-amber-400">
                    Real World Example
                  </SectionHeading>
                  <TextContent text={content.realExample} />
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── 3. Code Example ───────────────────────────────────────── */}
            {content.codeExample && (
              <AnimatedConceptSection delay={0.2}>
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Code Example</h2>
                  </div>
                  <CodeBlock
                    code={content.codeExample}
                    title={`${topic.slug || topic.id}.py`}
                    showLineNumbers
                  />
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── Interactive animation: foreignkey ──────────────────────── */}
            {topic.id === 'foreignkey' && (
              <AnimatedConceptSection delay={0.22}>
                <FKExplainer />
              </AnimatedConceptSection>
            )}

            {/* ── Interactive animation: what-is-queryset (models section) ── */}
            {topic.id === 'what-is-queryset' && (
              <AnimatedConceptSection delay={0.22}>
                <QuerysetEvaluation />
              </AnimatedConceptSection>
            )}

            {/* ── 4. Understanding the Output ───────────────────────────── */}
            {content.outputExplanation && (
              <AnimatedConceptSection delay={0.25}>
                <section className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6">
                  <SectionHeading icon={BookOpen} className="text-slate-700 dark:text-slate-300">
                    Understanding the Output
                  </SectionHeading>
                  <TextContent text={content.outputExplanation} />
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── 5. Common Mistakes ────────────────────────────────────── */}
            {content.commonMistakes?.length > 0 && (
              <AnimatedConceptSection delay={0.3}>
                <section className="bg-white dark:bg-slate-800/60 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 p-6">
                  <SectionHeading icon={AlertTriangle} className="text-rose-600 dark:text-rose-400">
                    Common Mistakes
                  </SectionHeading>
                  <ul className="space-y-3">
                    {content.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{mistake}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── 6. Interview Notes ────────────────────────────────────── */}
            {content.interviewNotes?.length > 0 && (
              <AnimatedConceptSection delay={0.35}>
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
              </AnimatedConceptSection>
            )}

            {/* ── 7. When to Use ────────────────────────────────────────── */}
            {content.whenToUse && (
              <AnimatedConceptSection delay={0.4}>
                <section className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-6">
                  <SectionHeading icon={CheckCircle} className="text-emerald-700 dark:text-emerald-400">
                    When to Use
                  </SectionHeading>
                  <TextContent text={content.whenToUse} />
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── 8. When NOT to Use ────────────────────────────────────── */}
            {content.whenNotToUse && (
              <AnimatedConceptSection delay={0.45}>
                <section className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800/50 p-6">
                  <SectionHeading icon={XCircle} className="text-rose-700 dark:text-rose-400">
                    When NOT to Use
                  </SectionHeading>
                  <TextContent text={content.whenNotToUse} />
                </section>
              </AnimatedConceptSection>
            )}

            {/* ── User Notes ────────────────────────────────────────────── */}
            <AnimatedConceptSection delay={0.5}>
              <section className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My Notes</h2>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Jot down anything you want to remember about this topic…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-600 resize-none transition-all duration-150 font-sans"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Notes are saved locally in your browser
                  </span>
                  <button
                    onClick={handleSaveNote}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      noteSaved
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent'
                    }`}
                  >
                    {noteSaved ? 'Saved!' : 'Save Note'}
                  </button>
                </div>
              </section>
            </AnimatedConceptSection>

            {/* ── Prev / Next navigation ────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 pb-8">
              {prevTopic ? (
                <Link
                  href={`/learn/models/${prevTopic.id}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-150"
                >
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {prevTopic.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextTopic ? (
                <Link
                  href={`/learn/models/${nextTopic.id}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-150 text-right"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
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
