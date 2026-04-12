import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'all',          label: 'All',          dot: null },
  { value: 'beginner',     label: 'Beginner',     dot: 'bg-emerald-500' },
  { value: 'intermediate', label: 'Intermediate', dot: 'bg-amber-500' },
  { value: 'advanced',     label: 'Advanced',     dot: 'bg-rose-500' },
];

const ACTIVE_MAP = {
  all:          'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm',
  beginner:     'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30',
  intermediate: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30',
  advanced:     'bg-rose-600 text-white shadow-sm shadow-rose-500/30',
};

const INACTIVE = 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-100';

/**
 * Filter buttons for exercise difficulty.
 *
 * @param {object}   props
 * @param {string}   props.selected          - current selected value
 * @param {Function} props.onChange          - called with new filter value
 * @param {object}   [props.counts]          - { all: n, beginner: n, ... }
 * @param {string}   [props.className]
 */
export default function DifficultyFilter({
  selected = 'all',
  onChange,
  counts = {},
  className,
}) {
  return (
    <div
      role="group"
      aria-label="Filter by difficulty"
      className={cn(
        'flex items-center gap-1.5 flex-wrap',
        className
      )}
    >
      {FILTERS.map(({ value, label, dot }) => {
        const isActive = selected === value;
        const count = counts[value];

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 border',
              isActive
                ? [ACTIVE_MAP[value], 'border-transparent']
                : ['border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900', INACTIVE]
            )}
          >
            {dot && (
              <span
                className={cn('w-2 h-2 rounded-full shrink-0', dot)}
                aria-hidden="true"
              />
            )}
            {label}
            {count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-md font-semibold leading-none',
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
