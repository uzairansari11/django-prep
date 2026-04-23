import { cn } from '@/lib/utils';

const FILL_COLORS = {
  accent:  'var(--accent)',
  green:   '#22c55e',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
};

const SIZE_MAP = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  value = 0,
  color = 'accent',
  showLabel = false,
  label,
  size = 'md',
  className,
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const fill = FILL_COLORS[color] ?? FILL_COLORS.accent;
  const displayLabel = label ?? `${pct}%`;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {displayLabel}
          </span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {pct}%
          </span>
        </div>
      )}

      <div
        className={cn('w-full rounded-full overflow-hidden', SIZE_MAP[size] ?? SIZE_MAP.md)}
        style={{ backgroundColor: 'var(--surface-2)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
    </div>
  );
}
