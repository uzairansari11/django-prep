import { memo } from 'react';
import { cn } from '@/lib/utils';

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,        // unused now, kept for backwards-compat callers
  trendLabel,   // unused now
  className,
}) {
  return (
    <div
      className={cn(
        'rounded p-4 transition-colors duration-150',
        className
      )}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />}
        <p
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
        </p>
      </div>
      <p
        className="text-2xl font-semibold tracking-tight tabular-nums"
        style={{ color: 'var(--text)' }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-[12px]" style={{ color: 'var(--text-subtle)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default memo(StatsCard);
