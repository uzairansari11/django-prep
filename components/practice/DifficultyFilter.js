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
      className={`flex items-center gap-1 flex-wrap ${className}`}
    >
      {FILTERS.map(({ value, label, dot }) => {
        const isActive = selected === value;
        const count = counts[value];

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150"
            style={isActive
              ? {
                  backgroundColor: 'var(--text)',
                  color: 'var(--bg)',
                  border: '1px solid var(--text)',
                }
              : {
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }
            }
          >
            {dot && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: dot }}
                aria-hidden="true"
              />
            )}
            {label}
            {count !== undefined && (
              <span
                className="text-[10px] tabular-nums"
                style={{
                  color: isActive ? 'var(--bg)' : 'var(--text-subtle)',
                  opacity: isActive ? 0.7 : 1,
                }}
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
