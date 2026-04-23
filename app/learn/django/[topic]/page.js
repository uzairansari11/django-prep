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
  Layers,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import CodeBlock from '@/components/ui/CodeBlock';
import Badge from '@/components/ui/Badge';
import TopicList from '@/components/learn/TopicList';
import { djangoInternalsTopics } from '@/data/django-internals-topics';
import AnimatedConceptSection from '@/components/learn/AnimatedConceptSection';
import DiagramVisual from '@/components/ui/DiagramVisual';

// ── Helpers ────────────────────────────────────────────────────────────────────

function TextContent({ text }) {
  if (!text) return null;
  const paragraphs = String(text).split('\n').filter((p) => p.trim().length > 0);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>
          {para}
        </p>
      ))}
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      {Icon && <Icon className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />}
      <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{children}</h2>
    </div>
  );
}

function ContentCard({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl p-6 ${className}`}
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {children}
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DjangoInternalsTopicPage({ params }) {
  const resolvedParams = use(params);
  const topicId = resolvedParams.topic;
  const router = useRouter();

  const topic = djangoInternalsTopics.find((t) => t.id === topicId);
  const topicIndex = djangoInternalsTopics.findIndex((t) => t.id === topicId);
  const prevTopic = topicIndex > 0 ? djangoInternalsTopics[topicIndex - 1] : null;
  const nextTopic = topicIndex < djangoInternalsTopics.length - 1 ? djangoInternalsTopics[topicIndex + 1] : null;

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

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center max-w-md">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5"
            style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Topic not found</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            The topic{' '}
            <code
              className="px-1.5 py-0.5 rounded font-mono text-xs"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)' }}
            >
              {topicId}
            </code>{' '}
            does not exist in Django Internals.
          </p>
          <Link
            href="/learn/django"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Django Internals
          </Link>
        </div>
      </div>
    );
  }

  const isComplete = isTopicComplete(topic.id);
  const bookmarked = isBookmarked(topic.id);
  const { content } = topic;

  function handleTopicSelect(selected) {
    router.push(`/learn/django/${selected.id}`);
  }

  return (
    <div className="min-h-screen">

      {/* Mobile: breadcrumb + topic picker */}
      <div className="lg:hidden border-b px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <nav className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <Link href="/learn" style={{ color: 'var(--accent)' }}>Learn</Link>
          <span>/</span>
          <Link href="/learn/django" style={{ color: 'var(--accent)' }}>Internals</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }} className="truncate max-w-[10rem]">{topic.title}</span>
        </nav>
        <select
          value={topicId}
          onChange={(e) => router.push(`/learn/django/${e.target.value}`)}
          className="w-full text-sm rounded-xl px-4 py-2"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          aria-label="Navigate to topic"
        >
          {djangoInternalsTopics.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      <div className="flex items-start">
        {/* ── LEFT SIDEBAR — sticky, scrolls independently ─────────────── */}
        <aside
          className="hidden lg:flex flex-col w-72 shrink-0 border-r"
          style={{
            position: 'sticky',
            top: 0,
            height: 'calc(100vh - 4rem)',
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Fixed header */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <nav className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              <Link href="/learn" className="hover:underline" style={{ color: 'var(--accent)' }}>Learn</Link>
              <span>/</span>
              <Link href="/learn/django" className="hover:underline" style={{ color: 'var(--accent)' }}>Internals</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Django Internals</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Progress</span>
                <span style={{ color: 'var(--accent)' }}>{Array.from(completedTopics).filter(id => djangoInternalsTopics.find(t => String(t.id) === id)).length}/{djangoInternalsTopics.length}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((Array.from(completedTopics).filter(id => djangoInternalsTopics.find(t => String(t.id) === id)).length / djangoInternalsTopics.length) * 100)}%`,
                    backgroundColor: 'var(--accent)',
                  }}
                />
              </div>
            </div>
          </div>
          {/* Scrollable topic list */}
          <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
            <TopicList
              topics={djangoInternalsTopics}
              completedTopics={completedTopics}
              currentTopicId={topic.id}
              onSelect={handleTopicSelect}
            />
          </div>
        </aside>

        {/* ── MAIN CONTENT — page scroll handles this ───────────────────── */}
        <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Topic header */}
            <AnimatedConceptSection delay={0}>
              <ContentCard>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant={topic.difficulty}>
                        {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                      </Badge>
                      {topic.estimatedMinutes && (
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {topic.estimatedMinutes} min
                        </span>
                      )}
                      <Badge variant="default" size="sm">Django</Badge>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3" style={{ color: 'var(--text)' }}>
                      {topic.title}
                    </h1>

                    {topic.description && (
                      <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                        {topic.description}
                      </p>
                    )}

                    {topic.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {topic.tags.map((tag) => (
                          <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleBookmark(topic.id)}
                      title={bookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                      style={bookmarked
                        ? { backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }
                        : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                      }
                      onMouseEnter={(e) => { if (!bookmarked) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                      onMouseLeave={(e) => { if (!bookmarked) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                    >
                      {bookmarked
                        ? <Bookmark className="w-4 h-4 fill-current" />
                        : <BookmarkPlus className="w-4 h-4" />
                      }
                      <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => isComplete ? markTopicIncomplete(topic.id) : markTopicComplete(topic.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                      style={isComplete
                        ? { backgroundColor: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff' }
                        : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                      }
                      onMouseEnter={(e) => { if (!isComplete) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                      onMouseLeave={(e) => { if (!isComplete) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isComplete ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </ContentCard>
            </AnimatedConceptSection>

            {/* Visual diagram */}
            <AnimatedConceptSection delay={0.08}>
              <DiagramVisual topicId={topic.id} />
            </AnimatedConceptSection>

            {/* 1. What it is */}
            {content.explanation && (
              <AnimatedConceptSection delay={0.1}>
                <ContentCard>
                  <SectionHeading icon={BookOpen}>
                    What it is
                  </SectionHeading>
                  <TextContent text={content.explanation} />
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* 2. Real World Example */}
            {content.realExample && (
              <AnimatedConceptSection delay={0.2}>
                <ContentCard>
                  <SectionHeading icon={Lightbulb}>
                    Real World Example
                  </SectionHeading>
                  <TextContent text={content.realExample} />
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* 3. Code Example */}
            {content.codeExample && (
              <AnimatedConceptSection delay={0.25}>
                <section>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Code Example</h2>
                  </div>
                  <CodeBlock
                    code={content.codeExample}
                    title={`${topic.slug || topic.id}.py`}
                    showLineNumbers
                  />
                </section>
              </AnimatedConceptSection>
            )}

            {/* 4. Understanding the Output */}
            {content.outputExplanation && (
              <AnimatedConceptSection delay={0.3}>
                <ContentCard>
                  <SectionHeading icon={BookOpen}>
                    Understanding the Output
                  </SectionHeading>
                  <TextContent text={content.outputExplanation} />
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* 5. Common Mistakes */}
            {content.commonMistakes?.length > 0 && (
              <AnimatedConceptSection delay={0.35}>
                <ContentCard>
                  <SectionHeading icon={AlertTriangle}>
                    Common Mistakes
                  </SectionHeading>
                  <ul className="space-y-3">
                    {content.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 mt-0.5"
                          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{mistake}</p>
                      </li>
                    ))}
                  </ul>
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* 6. Interview Notes */}
            {content.interviewNotes?.length > 0 && (
              <AnimatedConceptSection delay={0.4}>
                <ContentCard>
                  <SectionHeading icon={Lightbulb}>
                    Interview Notes
                  </SectionHeading>
                  <ul className="space-y-2.5">
                    {content.interviewNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ backgroundColor: 'var(--accent)' }} />
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note}</p>
                      </li>
                    ))}
                  </ul>
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* 7. When to Use */}
            {content.whenToUse && (
              <AnimatedConceptSection delay={0.45}>
                <ContentCard>
                  <SectionHeading icon={CheckCircle}>
                    When to Use
                  </SectionHeading>
                  <TextContent text={content.whenToUse} />
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* 8. When NOT to Use */}
            {content.whenNotToUse && (
              <AnimatedConceptSection delay={0.5}>
                <ContentCard>
                  <SectionHeading icon={XCircle}>
                    When NOT to Use
                  </SectionHeading>
                  <TextContent text={content.whenNotToUse} />
                </ContentCard>
              </AnimatedConceptSection>
            )}

            {/* User Notes */}
            <AnimatedConceptSection delay={0.55}>
              <ContentCard>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>My Notes</h2>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Jot down anything you want to remember about this topic…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none font-sans focus:outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                    Notes are saved locally in your browser
                  </span>
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={noteSaved
                      ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }
                      : { backgroundColor: 'var(--accent)', color: '#fff', border: '1px solid transparent' }
                    }
                  >
                    {noteSaved ? 'Saved!' : 'Save Note'}
                  </button>
                </div>
              </ContentCard>
            </AnimatedConceptSection>

            {/* Prev / Next navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
              {prevTopic ? (
                <Link
                  href={`/learn/django/${prevTopic.id}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl transition-all duration-150"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                  </span>
                  <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                    {prevTopic.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextTopic ? (
                <Link
                  href={`/learn/django/${nextTopic.id}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl transition-all duration-150 text-right"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                    {nextTopic.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
