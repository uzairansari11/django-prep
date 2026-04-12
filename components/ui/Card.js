'use client';

import { cn } from '@/lib/utils';

const PADDING_MAP = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

/**
 * Reusable card. When onClick is provided renders a div with role="button"
 * (never a <button>) so nested interactive elements remain valid HTML.
 */
export default function Card({
  children,
  className,
  onClick,
  hover = false,
  padding = 'md',
  border = true,
}) {
  const handleKeyDown = onClick
    ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } }
    : undefined;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'rounded-xl bg-white dark:bg-slate-800/60',
        border && 'border border-slate-200 dark:border-slate-700/60',
        PADDING_MAP[padding] ?? PADDING_MAP.md,
        hover && [
          'transition-all duration-200 cursor-pointer',
          'hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/30',
          'hover:-translate-y-0.5',
          'hover:border-indigo-300 dark:hover:border-indigo-700',
        ],
        onClick && !hover && 'cursor-pointer transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800',
        className
      )}
    >
      {children}
    </div>
  );
}
