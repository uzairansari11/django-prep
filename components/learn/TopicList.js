import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { cn, calculateProgress, groupBy } from '@/lib/utils';

/**
 * Sidebar / list of topics for the learning section.
 *
 * @param {object}   props
 * @param {object[]} props.topics              - array of topic objects
 * @param {Set}      [props.completedTopics]   - Set of completed topic IDs
 * @param {string}   [props.currentTopicId]
 * @param {Function} [props.onSelect]          - called with topic object
 * @param {string}   [props.className]
 */
export default function TopicList({
  topics = [],
  completedTopics = new Set(),
  currentTopicId,
  onSelect,
  className,
}) {
  // Group by section if topics have a `section` property, otherwise flat list
  const hasSections = topics.some((t) => t.section);
  const grouped = hasSections ? groupBy(topics, 'section') : { '': topics };

  const completedCount = topics.filter((t) => completedTopics.has(String(t.id))).length;
  const progress = calculateProgress(completedCount, topics.length);

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 w-full',
        className
      )}
    >
      {/* Overall progress */}
      {topics.length > 0 && (
        <div className="px-1">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2">
            <span>Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {completedCount}/{topics.length}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden transition-colors duration-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Topic groups */}
      <nav aria-label="Topics">
        {Object.entries(grouped).map(([section, sectionTopics]) => (
          <div key={section} className="mb-4 last:mb-0">
            {/* Section heading */}
            {section && (
              <p className="px-2 mb-1.5 text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-zinc-500">
                {section}
              </p>
            )}

            <ul className="flex flex-col gap-0.5" role="list">
              {sectionTopics.map((topic) => {
                const isDone    = completedTopics.has(String(topic.id));
                const isCurrent = String(topic.id) === String(currentTopicId);

                return (
                  <li key={topic.id}>
                    <button
                      onClick={() => onSelect?.(topic)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left group',
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : isDone
                            ? 'text-emerald-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                      )}
                    >
                      {/* Check / circle icon */}
                      <span className="shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Circle className={cn(
                            'w-4 h-4 transition-colors duration-150',
                            isCurrent ? 'text-indigo-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500'
                          )} />
                        )}
                      </span>

                      {/* Label */}
                      <span className="flex-1 min-w-0 truncate leading-snug">
                        {topic.title}
                      </span>

                      {/* Difficulty badge or arrow */}
                      {topic.difficulty && !isCurrent ? (
                        <Badge
                          variant={topic.difficulty}
                          size="sm"
                          className="shrink-0 opacity-75 group-hover:opacity-100"
                        >
                          {topic.difficulty.slice(0, 3)}
                        </Badge>
                      ) : isCurrent ? (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Empty state */}
      {topics.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-6">
          No topics available.
        </p>
      )}
    </aside>
  );
}
