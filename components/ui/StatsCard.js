import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null,
  trendLabel,
  className,
}) {
  const TrendIcon =
    trend === 'up'   ? TrendingUp :
    trend === 'down' ? TrendingDown :
    Minus;

  const trendColor =
    trend === 'up'   ? { color: '#22c55e' } :
    trend === 'down' ? { color: '#f43f5e' } :
    { color: 'var(--text-subtle)' };

  return (
    <div
      className={cn('rounded-xl p-5 flex flex-col gap-4 transition-all duration-200', className)}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px color-mix(in srgb, var(--text) 6%, transparent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}

        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium" style={trendColor}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendLabel && <span>{trendLabel}</span>}
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight leading-none" style={{ color: 'var(--accent)' }}>
          {value}
        </p>
        <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
