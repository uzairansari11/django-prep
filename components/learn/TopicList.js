'use client';

import { memo } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn, groupBy } from '@/lib/utils';

/**
 * Renders the topic-list nav inside the section sidebar.
 *
 * Each row uses <Link> rather than a button + router.push so Next.js
 * prefetches the topic page in the background — making clicks feel
 * instantaneous instead of waiting on the route to compile/fetch.
 *
 * @param {object} props
 * @param {Array}  props.topics
 * @param {Set}    props.completedTopics
 * @param {string|null} props.currentTopicId
 * @param {(id: string) => string} props.hrefFor  Build a route to a topic
 */
export default function TopicList({
  topics = [],
  completedTopics = new Set(),
  currentTopicId,
  hrefFor,
  className,
}) {
  const hasSections = topics.some((t) => t.section);
  const grouped = hasSections ? groupBy(topics, 'section') : { '': topics };

  if (topics.length === 0) {
    return (
      <p
        className="text-[12px] text-center py-6"
        style={{ color: 'var(--text-subtle)' }}
      >
        No topics available.
      </p>
    );
  }

  return (
    <nav aria-label="Topics" className={cn('flex flex-col gap-3', className)}>
      {Object.entries(grouped).map(([section, sectionTopics]) => (
        <div key={section}>
          {section && (
            <p
              className="px-2 mb-1.5 text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: 'var(--text-subtle)' }}
            >
              {section}
            </p>
          )}

          <ul className="flex flex-col gap-0.5" role="list">
            {sectionTopics.map((topic) => (
              <TopicListItem
                key={topic.id}
                topic={topic}
                href={hrefFor(topic.id)}
                isDone={completedTopics.has(String(topic.id))}
                isCurrent={String(topic.id) === String(currentTopicId)}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// Each row is its own memoized component. When the user navigates, the
// list re-renders with a new `currentTopicId`, but only two items actually
// flip their `isCurrent` (old + new). React.memo skips render work for
// the other rows.
const TopicListItem = memo(function TopicListItem({
  topic,
  href,
  isDone,
  isCurrent,
}) {
  return (
    <li id={`topic-item-${topic.id}`}>
      <Link
        href={href}
        scroll={false}
        aria-current={isCurrent ? 'page' : undefined}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] text-left transition-colors duration-150"
        style={
          isCurrent
            ? { backgroundColor: 'var(--surface-2)', color: 'var(--text)', fontWeight: 500 }
            : { color: 'var(--text-muted)', fontWeight: 400 }
        }
        onMouseEnter={(e) => {
          if (!isCurrent) {
            e.currentTarget.style.color = 'var(--text)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrent) {
            e.currentTarget.style.color = 'var(--text-muted)';
          }
        }}
      >
        <span className="shrink-0 w-3 h-3 flex items-center justify-center">
          {isDone ? (
            <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--accent)' }} />
          ) : (
            <Circle
              className="w-3 h-3"
              style={{
                color: isCurrent ? 'var(--text)' : 'var(--text-subtle)',
                opacity: 0.6,
              }}
            />
          )}
        </span>
        <span className="flex-1 min-w-0 truncate leading-snug">
          {topic.title}
        </span>
      </Link>
    </li>
  );
});
