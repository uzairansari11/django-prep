'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkPlus,
  AlertTriangle,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import CodeBlock from '@/components/ui/CodeBlock';
import Badge from '@/components/ui/Badge';
import TopicList from '@/components/learn/TopicList';

/**
 * Shared topic detail page chrome (header, sidebar, content sections, notes, prev/next).
 *
 * @param {object} props
 * @param {object} props.topic            Currently selected topic
 * @param {Array}  props.topics           Full topics list for this section
 * @param {string} props.sectionLabel     Display label, e.g. "Models"
 * @param {string} props.sectionHref      Path to section index, e.g. "/learn/models"
 * @param {(id: string) => string} props.topicHref  Build a route to a sibling topic
 * @param {React.ReactNode} [props.extras]  Optional injected content (animations, diagrams)
 */
export default function TopicDetail({
  topic,
  topics,
  sectionLabel,
  sectionHref,
  topicHref,
  extras,
}) {
  const router = useRouter();

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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Topic not found</h1>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>
          This topic doesn’t exist in {sectionLabel}.
        </p>
        <Link
          href={sectionHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to {sectionLabel}
        </Link>
      </div>
    );
  }

  const isComplete  = isTopicComplete(topic.id);
  const bookmarked  = isBookmarked(topic.id);
  const { content = {} } = topic;

  const topicIndex = topics.findIndex((t) => t.id === topic.id);
  const prevTopic  = topicIndex > 0 ? topics[topicIndex - 1] : null;
  const nextTopic  = topicIndex >= 0 && topicIndex < topics.length - 1 ? topics[topicIndex + 1] : null;

  const completedInSection = Array.from(completedTopics).filter(
    (id) => topics.find((t) => String(t.id) === id)
  ).length;
  const sectionPct = topics.length > 0 ? Math.round((completedInSection / topics.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Mobile nav — sticky at the top of the scroll container (which sits
          right below the app navbar) so the picker is always reachable.
          Solid background so scrolling content doesn't bleed through. */}
      <div
        className="lg:hidden sticky top-0 z-20 border-b px-4 py-3"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg)',
        }}
      >
        <nav className="flex items-center gap-1.5 text-[12px] mb-2">
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span style={{ color: 'var(--text-subtle)' }}>/</span>
          <Link href={sectionHref} style={{ color: 'var(--text-muted)' }}>{sectionLabel}</Link>
          <span style={{ color: 'var(--text-subtle)' }}>/</span>
          <span style={{ color: 'var(--text)' }} className="truncate max-w-40">{topic.title}</span>
        </nav>
        <select
          value={topic.id}
          onChange={(e) => router.push(topicHref(e.target.value))}
          className="w-full text-[13px] rounded px-2.5 py-2"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          aria-label="Navigate to topic"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      <div className="flex items-start">
        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0 border-r"
          style={{
            position: 'sticky',
            top: 0,
            height: 'calc(100vh - 3.5rem)',
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="shrink-0 px-4 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <nav className="flex items-center gap-1.5 text-[11px] mb-2">
              <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
              <span style={{ color: 'var(--text-subtle)' }}>/</span>
              <Link href={sectionHref} style={{ color: 'var(--text-muted)' }}>{sectionLabel}</Link>
            </nav>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {sectionLabel}
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span style={{ color: 'var(--text-subtle)' }} suppressHydrationWarning>{completedInSection} / {topics.length}</span>
                <span className="tabular-nums" style={{ color: 'var(--text-muted)' }} suppressHydrationWarning>{sectionPct}%</span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div suppressHydrationWarning className="h-full" style={{ width: `${sectionPct}%`, backgroundColor: 'var(--accent)' }} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3 sidebar-no-scrollbar">
            <TopicList
              topics={topics}
              completedTopics={completedTopics}
              currentTopicId={topic.id}
              onSelect={(t) => router.push(topicHref(t.id))}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

            {/* Header */}
            <header className="pb-6 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-wrap items-center gap-2 mb-3 text-[12px]">
                {topic.difficulty && (
                  <Badge variant={topic.difficulty}>
                    {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                  </Badge>
                )}
                {topic.estimatedMinutes && (
                  <span style={{ color: 'var(--text-subtle)' }}>{topic.estimatedMinutes} min</span>
                )}
                <span style={{ color: 'var(--text-subtle)' }}>·</span>
                <span style={{ color: 'var(--text-muted)' }}>{sectionLabel}</span>
              </div>

              <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight leading-[1.2] mb-3" style={{ color: 'var(--text)' }}>
                {topic.title}
              </h1>

              {topic.description && (
                <p className="text-[14px] leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                  {topic.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => toggleBookmark(topic.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150"
                  style={bookmarked
                    ? { backgroundColor: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border)' }
                    : { backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }
                >
                  {bookmarked ? <Bookmark className="w-3 h-3 fill-current" /> : <BookmarkPlus className="w-3 h-3" />}
                  {bookmarked ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => isComplete ? markTopicIncomplete(topic.id) : markTopicComplete(topic.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150"
                  style={isComplete
                    ? { backgroundColor: 'var(--accent)', color: 'var(--bg)', border: '1px solid var(--accent)' }
                    : { backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }
                >
                  <CheckCircle className="w-3 h-3" />
                  {isComplete ? 'Completed' : 'Mark complete'}
                </button>
              </div>
            </header>

            {/* Content sections — flat layout, dividers instead of cards */}
            <div className="space-y-10">
              {extras}

              {content.explanation && (
                <Section title="Overview">
                  <Prose text={content.explanation} />
                </Section>
              )}

              {content.realExample && (
                <Section title="Real-world example">
                  <Prose text={content.realExample} />
                </Section>
              )}

              {content.codeExample && (
                <Section title="Code">
                  <CodeBlock
                    code={content.codeExample}
                    title={`${topic.slug || topic.id}.py`}
                    showLineNumbers
                  />
                </Section>
              )}

              {content.outputExplanation && (
                <Section title="Understanding the output">
                  <Prose text={content.outputExplanation} />
                </Section>
              )}

              {content.commonMistakes?.length > 0 && (
                <Section title="Common mistakes">
                  <ul className="space-y-2.5">
                    {content.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="mt-1 inline-block w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--text-subtle)' }}
                        />
                        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{mistake}</p>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {content.interviewNotes?.length > 0 && (
                <Section title="Interview notes">
                  <ul className="space-y-2.5">
                    {content.interviewNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="mt-1 inline-block w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--accent)' }}
                        />
                        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note}</p>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {content.whenToUse && (
                <Section title="When to use">
                  <Prose text={content.whenToUse} />
                </Section>
              )}

              {content.whenNotToUse && (
                <Section title="When NOT to use">
                  <Prose text={content.whenNotToUse} />
                </Section>
              )}

              {/* Notes */}
              <Section title="Your notes">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Jot down anything you want to remember…"
                  rows={4}
                  className="w-full px-3 py-2 rounded text-[13px] resize-none font-sans focus:outline-none transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                    Saved locally in your browser
                  </span>
                  <button
                    onClick={handleSaveNote}
                    className="px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150"
                    style={noteSaved
                      ? { backgroundColor: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border)' }
                      : { backgroundColor: 'var(--accent)', color: 'var(--bg)', border: '1px solid var(--accent)' }
                    }
                  >
                    {noteSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </Section>
            </div>

            {/* Prev / Next */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              {prevTopic ? (
                <Link
                  href={topicHref(prevTopic.id)}
                  className="group flex flex-col gap-1 p-3 rounded transition-colors duration-150"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                    <ChevronLeft className="w-3 h-3" /> Previous
                  </span>
                  <span className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                    {prevTopic.title}
                  </span>
                </Link>
              ) : <div />}
              {nextTopic ? (
                <Link
                  href={topicHref(nextTopic.id)}
                  className="group flex flex-col gap-1 p-3 rounded transition-colors duration-150 text-right"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span className="flex items-center justify-end gap-1 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                    Next <ChevronRight className="w-3 h-3" />
                  </span>
                  <span className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
                    {nextTopic.title}
                  </span>
                </Link>
              ) : <div />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2
        className="text-[11px] font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Prose({ text }) {
  if (!text) return null;
  const paragraphs = String(text).split('\n').filter((p) => p.trim().length > 0);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {para}
        </p>
      ))}
    </div>
  );
}
