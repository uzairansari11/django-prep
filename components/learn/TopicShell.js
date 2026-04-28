'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';
import TopicList from '@/components/learn/TopicList';

/**
 * Persistent shell rendered by [topic]/layout.js for each learn section.
 *
 * Keeping the sidebar in the layout (not the page) means navigating between
 * sibling topics doesn't unmount it — so the sidebar's scroll position is
 * preserved across clicks instead of resetting to the top.
 *
 * @param {object} props
 * @param {string} props.topicId       Currently active topic id (from route params)
 * @param {Array}  props.topics        Full topics list for this section
 * @param {string} props.sectionLabel  Display label, e.g. "Queries"
 * @param {string} props.sectionHref   Path to section index, e.g. "/learn/queries"
 * @param {React.ReactNode} props.children  The page (article) content
 */
export default function TopicShell({
  topicId,
  topics,
  sectionLabel,
  sectionHref,
  children,
}) {
  const router = useRouter();
  const { completedTopics } = useProgress();

  const completedInSection = Array.from(completedTopics).filter(
    (id) => topics.find((t) => String(t.id) === id)
  ).length;
  const sectionPct =
    topics.length > 0 ? Math.round((completedInSection / topics.length) * 100) : 0;

  const topicHref = (id) => `${sectionHref}/${id}`;

  return (
    <div className="flex items-start">
      {/* Desktop sidebar — sits inside the route layout, so it stays mounted
          while sibling topic pages swap in/out. That preserves its inner
          scrollTop across navigation. */}
      <aside
        className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r"
        style={{
          position: 'sticky',
          top: 0,
          height: 'calc(100dvh - 3.5rem)',
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="shrink-0 px-4 pt-5 pb-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <nav className="flex items-center gap-1.5 text-[11px] mb-2">
            <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <span style={{ color: 'var(--text-subtle)' }}>/</span>
            <Link href={sectionHref} style={{ color: 'var(--text-muted)' }}>
              {sectionLabel}
            </Link>
          </nav>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {sectionLabel}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span style={{ color: 'var(--text-subtle)' }} suppressHydrationWarning>
                {completedInSection} / {topics.length}
              </span>
              <span
                className="tabular-nums"
                style={{ color: 'var(--text-muted)' }}
                suppressHydrationWarning
              >
                {sectionPct}%
              </span>
            </div>
            <div
              className="h-0.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--surface-2)' }}
            >
              <div
                suppressHydrationWarning
                className="h-full"
                style={{ width: `${sectionPct}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto px-2 py-3 sidebar-no-scrollbar"
          style={{ overscrollBehavior: 'contain' }}
        >
          <TopicList
            topics={topics}
            completedTopics={completedTopics}
            currentTopicId={topicId}
            onSelect={(t) => router.push(topicHref(t.id), { scroll: false })}
          />
        </div>
      </aside>

      {/* Main column — wraps the page so we can put the mobile breadcrumb
          inside it. */}
      <div className="flex-1 min-w-0">
        {/* Mobile breadcrumb + topic picker. Lives in the layout so it
            doesn't unmount on topic change either. */}
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
            <Link href={sectionHref} style={{ color: 'var(--text-muted)' }}>
              {sectionLabel}
            </Link>
          </nav>
          <select
            value={topicId || ''}
            onChange={(e) => router.push(topicHref(e.target.value), { scroll: false })}
            className="w-full text-[13px] rounded px-2.5 py-2"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
            aria-label="Navigate to topic"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {children}
      </div>
    </div>
  );
}
