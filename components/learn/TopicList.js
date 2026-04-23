'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
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
  const activeRef = useRef(null);

  /* Auto-scroll the active item into view when topic changes */
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentTopicId]);

  if (topics.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: 'var(--text-subtle)' }}>
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
              className="px-2 mb-1.5 text-[10px] uppercase tracking-widest font-semibold"
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
                  ref={isCurrent ? activeRef : null}
                >
                  <button
                    onClick={() => onSelect?.(topic)}
                    aria-current={isCurrent ? 'page' : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left group transition-colors duration-150"
                    style={
                      isCurrent
                        ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)', fontWeight: 600 }
                        : isDone
                        ? { color: '#22c55e', fontWeight: 500 }
                        : { color: 'var(--text-muted)', fontWeight: 500 }
                    }
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                        e.currentTarget.style.color = 'var(--text)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.color = isDone ? '#22c55e' : 'var(--text-muted)';
                      }
                    }}
                  >
                    {/* Status icon */}
                    <span className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                      ) : (
                        <Circle
                          className="w-4 h-4"
                          style={{ color: isCurrent ? 'var(--accent)' : 'var(--border-strong)' }}
                        />
                      )}
                    </span>

                    {/* Title */}
                    <span className="flex-1 min-w-0 truncate leading-snug">
                      {topic.title}
                    </span>

                    {/* Difficulty / arrow */}
                    {topic.difficulty && !isCurrent ? (
                      <Badge variant={topic.difficulty} size="sm" className="shrink-0 opacity-80">
                        {topic.difficulty.slice(0, 3)}
                      </Badge>
                    ) : isCurrent ? (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    ) : null}
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
