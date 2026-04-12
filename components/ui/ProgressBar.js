import { cn } from '@/lib/utils';

const COLOR_MAP = {
  blue:   'bg-blue-500',
  indigo: 'bg-indigo-500',
  green:  'bg-emerald-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  rose:   'bg-rose-500',
  amber:  'bg-amber-500',
};

const TRACK_MAP = {
  blue:   'bg-slate-200 dark:bg-zinc-800',
  indigo: 'bg-slate-200 dark:bg-zinc-800',
  green:  'bg-slate-200 dark:bg-zinc-800',
  purple: 'bg-slate-200 dark:bg-zinc-800',
  orange: 'bg-slate-200 dark:bg-zinc-800',
  rose:   'bg-slate-200 dark:bg-zinc-800',
  amber:  'bg-slate-200 dark:bg-zinc-800',
};

const SIZE_MAP = {
  sm: 'h-1.5 rounded-full',
  md: 'h-2.5 rounded-full',
  lg: 'h-4 rounded-full',
};

/**
 * Animated progress bar.
 *
 * @param {object}  props
 * @param {number}  props.value          - 0–100
 * @param {'blue'|'indigo'|'green'|'purple'|'orange'|'rose'|'amber'} [props.color='indigo']
 * @param {boolean} [props.showLabel=false]
 * @param {string}  [props.label]        - overrides default "n%" label
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string}  [props.className]
 */
export default function ProgressBar({
  value = 0,
  color = 'indigo',
  showLabel = false,
  label,
  size = 'md',
  className,
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const barColor   = COLOR_MAP[color]   ?? COLOR_MAP.indigo;
  const trackColor = TRACK_MAP[color]   ?? TRACK_MAP.indigo;
  const sizeClass  = SIZE_MAP[size]     ?? SIZE_MAP.md;
  const displayLabel = label ?? `${pct}%`;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            {displayLabel}
          </span>
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            {pct}%
          </span>
        </div>
      )}

      <div
        className={cn('w-full overflow-hidden transition-colors duration-200', sizeClass, trackColor)}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColor
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
