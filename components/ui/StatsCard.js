import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_MAP = {
  indigo: {
    icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-100 dark:ring-indigo-900/30',
  },
  emerald: {
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-900/30',
  },
  violet: {
    icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    value: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-100 dark:ring-violet-900/30',
  },
  amber: {
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-100 dark:ring-amber-900/30',
  },
  rose: {
    icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    value: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-100 dark:ring-rose-900/30',
  },
  sky: {
    icon: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    value: 'text-sky-600 dark:text-sky-400',
    ring: 'ring-sky-100 dark:ring-sky-900/30',
  },
};

/**
 * Dashboard stat card.
 *
 * @param {object}          props
 * @param {string}          props.title
 * @param {string|number}   props.value
 * @param {string}          [props.subtitle]
 * @param {React.ElementType} [props.icon]    - Lucide icon component
 * @param {'indigo'|'emerald'|'violet'|'amber'|'rose'|'sky'} [props.color='indigo']
 * @param {'up'|'down'|'neutral'|null} [props.trend]
 * @param {string} [props.trendLabel]
 * @param {string} [props.className]
 */
export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend = null,
  trendLabel,
  className,
}) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.indigo;

  const TrendIcon =
    trend === 'up' ? TrendingUp :
    trend === 'down' ? TrendingDown :
    Minus;

  const trendColor =
    trend === 'up'   ? 'text-emerald-600 dark:text-emerald-400' :
    trend === 'down' ? 'text-rose-600 dark:text-rose-400' :
                       'text-slate-500 dark:text-slate-400';

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 dark:border-slate-700',
        'bg-white dark:bg-slate-800',
        'p-5 flex flex-col gap-4',
        'transition-all duration-200 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-black/20',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-xl ring-4',
              colors.icon,
              colors.ring
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Trend badge */}
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendLabel && <span>{trendLabel}</span>}
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p className={cn('text-3xl font-bold tracking-tight leading-none', colors.value)}>
          {value}
        </p>
        <p className="mt-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
