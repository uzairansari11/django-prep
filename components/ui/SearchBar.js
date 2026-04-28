'use client';

import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Debounced search input with a clear button.
 *
 * @param {object}   props
 * @param {string}   props.value
 * @param {Function} props.onChange    - called with the new string value
 * @param {string}   [props.placeholder='Search…']
 * @param {string}   [props.className]
 * @param {boolean}  [props.autoFocus=false]
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus = false,
}) {
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e) => {
    const next = e.target.value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(next), 220);
  };

  const handleClear = () => {
    clearTimeout(timerRef.current);
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn('relative flex items-center group', className)}>
      {/* Search icon */}
      <Search
        className="absolute left-3 w-4 h-4 pointer-events-none transition-colors duration-150"
        style={{ color: 'var(--text-subtle)' }}
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={placeholder}
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-9 py-2 rounded text-[13px] transition-all duration-150',
          // Hide native clear button that browsers add for type="search"
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--text-subtle)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          type="button"
          aria-label="Clear search"
          className="absolute right-2.5 p-0.5 rounded transition-all duration-150"
          style={{ color: 'var(--text-subtle)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-2)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.color = 'var(--text-subtle)';
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
