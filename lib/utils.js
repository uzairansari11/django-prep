import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes without conflicts.
 * @param {...(string|undefined|null|boolean|Object)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return twMerge(clsx(classes));
}

/**
 * Format a date string or Date object into a human-readable format.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns Tailwind CSS classes for a difficulty level badge.
 * @param {'beginner'|'intermediate'|'advanced'} difficulty
 * @returns {string}
 */
export function getDifficultyColor(difficulty) {
  const map = {
    beginner:     'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    advanced:     'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  };
  return map[difficulty?.toLowerCase()] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
}

/**
 * Returns Tailwind CSS classes for a category label.
 * @param {'models'|'queries'|'migrations'|'admin'|'signals'|string} category
 * @returns {string}
 */
export function getCategoryColor(category) {
  const map = {
    models:     'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
    queries:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    migrations: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    admin:      'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
    signals:    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    forms:      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
    views:      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  };
  return map[category?.toLowerCase()] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
}

/**
 * Calculate a progress percentage clamped to [0, 100].
 * @param {number} completed
 * @param {number} total
 * @returns {number}
 */
export function calculateProgress(completed, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/**
 * Group an array of objects by a given key.
 * @template T
 * @param {T[]} array
 * @param {keyof T} key
 * @returns {Record<string, T[]>}
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) return {};
  return array.reduce((acc, item) => {
    const group = item[key] ?? 'undefined';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

/**
 * Truncate a string to a given length, appending an ellipsis.
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export function truncate(str, length = 100) {
  if (typeof str !== 'string') return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay ms
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Convert minutes to a human-readable duration string.
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
