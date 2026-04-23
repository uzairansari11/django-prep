const FILTERS = [
  { value: 'all',          label: 'All',          dot: null },
  { value: 'beginner',     label: 'Beginner',     dot: '#22c55e' },
  { value: 'intermediate', label: 'Intermediate', dot: '#f59e0b' },
  { value: 'advanced',     label: 'Advanced',     dot: '#f43f5e' },
];

export default function DifficultyFilter({
  selected = 'all',
  onChange,
  counts = {},
  className = '',
}) {
  return (
    <div
      role="group"
      aria-label="Filter by difficulty"
      className={`flex items-center gap-1.5 flex-wrap ${className}`}
    >
      {FILTERS.map(({ value, label, dot }) => {
        const isActive = selected === value;
        const count = counts[value];

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={isActive
              ? {
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  border: '1px solid var(--accent)',
                }
              : {
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
            }}
          >
            {dot && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: dot }}
                aria-hidden="true"
              />
            )}
            {label}
            {count !== undefined && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-md font-semibold leading-none"
                style={isActive
                  ? { backgroundColor: 'rgba(255,255,255,0.22)', color: '#ffffff' }
                  : { backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }
                }
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
