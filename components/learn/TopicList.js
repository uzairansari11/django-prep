'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { cn, groupBy } from '@/lib/utils';

export default function TopicList({
  topics = [],
  completedTopics = new Set(),
  currentTopicId,
  onSelect,
  className,
}) {
  const hasSections = topics.some((t) => t.section);
  const grouped = hasSections ? groupBy(topics, 'section') : { '': topics };
  // No auto-scroll on selection — user keeps their scroll position when
  // clicking through topics.

  if (topics.length === 0) {
    return (
      <p className="text-[12px] text-center py-6" style={{ color: 'var(--text-subtle)' }}>
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
            {sectionTopics.map((topic) => {
              const isDone    = completedTopics.has(String(topic.id));
              const isCurrent = String(topic.id) === String(currentTopicId);

              return (
                <li
                  key={topic.id}
                  id={`topic-item-${topic.id}`}
                >
                  <button
                    onClick={() => onSelect?.(topic)}
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
                        <Circle className="w-3 h-3" style={{ color: isCurrent ? 'var(--text)' : 'var(--text-subtle)', opacity: 0.6 }} />
                      )}
                    </span>
                    <span className="flex-1 min-w-0 truncate leading-snug">
                      {topic.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
