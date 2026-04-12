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
        className="absolute left-3 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-150"
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
          'w-full pl-9 pr-9 py-2 rounded-xl text-sm',
          'bg-white dark:bg-zinc-900',
          'border border-slate-300 dark:border-zinc-600',
          'text-slate-900 dark:text-zinc-100',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-600',
          'transition-all duration-150',
          // Hide native clear button that browsers add for type="search"
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          type="button"
          aria-label="Clear search"
          className="absolute right-2.5 p-0.5 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all duration-150"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
