'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';
import TopicList from '@/components/learn/TopicList';

// Stable href builder — produced once per sectionHref instead of on
// every navigation, so the memoized TopicList rows don't bust their
// shallow-prop comparison.
function makeHrefFor(sectionHref) {
  return (id) => `${sectionHref}/${id}`;
}

/**
 * Persistent shell rendered by [topic]/layout.js for each learn section.
 *
 * Architecture goal: when the user clicks a sibling topic, only the parts
 * that *visibly* change (the active-highlight in the topic list, and the
 * mobile <select> value) should re-render. Everything else — sidebar
 * breadcrumb, section label, progress bar — is memoized against stable
 * props so it stays put.
 *
 * @param {object} props
 * @param {Array}  props.topics        Full topics list for this section
 * @param {string} props.sectionLabel  Display label, e.g. "Queries"
 * @param {string} props.sectionHref   Path to section index, e.g. "/learn/queries"
 * @param {React.ReactNode} props.children  The page (article) content
 */
export default function TopicShell({ topics, sectionLabel, sectionHref, children }) {
  return (
    <div className="flex items-start">
      <DesktopSidebar
        topics={topics}
        sectionLabel={sectionLabel}
        sectionHref={sectionHref}
      />
      <div className="flex-1 min-w-0">
        <MobileTopicPicker
          topics={topics}
          sectionLabel={sectionLabel}
          sectionHref={sectionHref}
        />
        {children}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Desktop sidebar — split into a memoized header (static across topic
// changes) and a list section that legitimately needs to re-render to
// update the active highlight.
// ───────────────────────────────────────────────────────────────────────────

function DesktopSidebar({ topics, sectionLabel, sectionHref }) {
  return (
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
      <SidebarHeader
        topics={topics}
        sectionLabel={sectionLabel}
        sectionHref={sectionHref}
      />
      <SidebarList topics={topics} sectionHref={sectionHref} />
    </aside>
  );
}

// Breadcrumb + section label + progress bar. The progress bar reads
// `useProgress()`, which only changes when topics are completed — not on
// route changes. memo + stable props make this a no-op re-render when the
// user clicks a sibling topic.
const SidebarHeader = memo(function SidebarHeader({
  topics,
  sectionLabel,
  sectionHref,
}) {
  const { completedTopics } = useProgress();

  const completedInSection = useMemo(
    () =>
      Array.from(completedTopics).filter((id) =>
        topics.find((t) => String(t.id) === id)
      ).length,
    [completedTopics, topics]
  );
  const sectionPct =
    topics.length > 0 ? Math.round((completedInSection / topics.length) * 100) : 0;

  return (
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
  );
});

// The actual scrollable topic list — does subscribe to pathname so the
// active item flips on navigation. Its outer DOM stays the same node
// across renders, so its scrollTop is preserved by the browser.
function SidebarList({ topics, sectionHref }) {
  const pathname = usePathname();
  const { completedTopics } = useProgress();

  const currentTopicId = extractTopicId(pathname, sectionHref);
  const hrefFor = useMemo(() => makeHrefFor(sectionHref), [sectionHref]);

  return (
    <div
      className="flex-1 overflow-y-auto px-2 py-3 sidebar-no-scrollbar"
      style={{ overscrollBehavior: 'contain' }}
    >
      <TopicList
        topics={topics}
        completedTopics={completedTopics}
        currentTopicId={currentTopicId}
        hrefFor={hrefFor}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Mobile breadcrumb + topic picker. Lives in the layout so it doesn't
// remount on topic change either; only its <select> value updates.
// ───────────────────────────────────────────────────────────────────────────

function MobileTopicPicker({ topics, sectionLabel, sectionHref }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTopicId = extractTopicId(pathname, sectionHref) || '';

  return (
    <div
      className="lg:hidden sticky top-0 z-20 border-b px-4 py-3"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    >
      <MobileBreadcrumb sectionLabel={sectionLabel} sectionHref={sectionHref} />
      <select
        value={currentTopicId}
        onChange={(e) =>
          router.push(`${sectionHref}/${e.target.value}`, { scroll: false })
        }
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
  );
}

// Memoized — the breadcrumb text doesn't depend on the active topic.
const MobileBreadcrumb = memo(function MobileBreadcrumb({
  sectionLabel,
  sectionHref,
}) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px] mb-2">
      <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
      <span style={{ color: 'var(--text-subtle)' }}>/</span>
      <Link href={sectionHref} style={{ color: 'var(--text-muted)' }}>
        {sectionLabel}
      </Link>
    </nav>
  );
});

// ─── helpers ───────────────────────────────────────────────────────────────

function extractTopicId(pathname, sectionHref) {
  if (!pathname) return null;
  const prefix = `${sectionHref}/`;
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}
