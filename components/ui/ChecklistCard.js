'use client';

import { useState } from 'react';
import { CheckSquare, Square, ClipboardList } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { cn } from '@/lib/utils';

/**
 * Interactive production checklist card with local checkbox state.
 *
 * @param {object}   props
 * @param {string[]} props.items   - array of checklist item strings
 * @param {string}   [props.title] - card heading (default "Production Checklist")
 * @param {string}   [props.className]
 */
export default function ChecklistCard({
  items = [],
  title = 'Production Checklist',
  className,
}) {
  const [checked, setChecked] = useState({});

  if (!items.length) return null;

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = Math.round((checkedCount / items.length) * 100);

  function toggle(index) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <section
      className={cn(
        'rounded-2xl border-2 border-amber-300 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-900/10 p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-800/60 shrink-0">
            <ClipboardList className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </div>
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">{title}</h2>
        </div>

        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 shrink-0">
          {checkedCount} of {items.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <ProgressBar value={progress} color="amber" size="sm" />
      </div>

      {/* Checklist items */}
      <ul className="space-y-3">
        {items.map((item, index) => {
          const isChecked = Boolean(checked[index]);
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-start gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
                aria-checked={isChecked}
                role="checkbox"
              >
                <span className="shrink-0 mt-0.5 transition-colors duration-150">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Square className="w-5 h-5 text-amber-400 dark:text-amber-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm leading-relaxed transition-all duration-150',
                    isChecked
                      ? 'line-through text-amber-500 dark:text-amber-600'
                      : 'text-amber-900 dark:text-amber-200 group-hover:text-amber-700 dark:group-hover:text-amber-100'
                  )}
                >
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Completion message */}
      {checkedCount === items.length && items.length > 0 && (
        <div className="mt-5 px-4 py-3 rounded-xl bg-amber-200/60 dark:bg-amber-800/40 border border-amber-300 dark:border-amber-700">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 text-center">
            All items checked — this topic is production-ready!
          </p>
        </div>
      )}
    </section>
  );
}
