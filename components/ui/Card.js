'use client';

import { cn } from '@/lib/utils';

const PADDING_MAP = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

export default function Card({
  children,
  className,
  onClick,
  hover = false,
  padding = 'md',
  border = true,
  style,
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
        'rounded-xl',
        PADDING_MAP[padding] ?? PADDING_MAP.md,
        hover && 'transition-all duration-200 cursor-pointer hover:-translate-y-0.5',
        onClick && !hover && 'cursor-pointer transition-colors duration-150',
        className
      )}
      style={{
        backgroundColor: 'var(--surface)',
        border: border ? '1px solid var(--border)' : undefined,
        ...style,
      }}
      onMouseEnter={hover || onClick ? (e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--text) 8%, transparent)';
        if (hover) e.currentTarget.style.borderColor = 'var(--accent-ring)';
      } : undefined}
      onMouseLeave={hover || onClick ? (e) => {
        e.currentTarget.style.boxShadow = '';
        if (hover) e.currentTarget.style.borderColor = 'var(--border)';
      } : undefined}
    >
      {children}
    </div>
  );
}
