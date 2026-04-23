import { cn } from '@/lib/utils';

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
  md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  lg: 'text-sm px-3 py-1.5 rounded-lg font-semibold',
};

const VARIANT_CLASSES = {
  default:      'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700',
  success:      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  warning:      'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  danger:       'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  info:         'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  purple:       'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800',
  // difficulty
  beginner:     'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  intermediate: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  advanced:     'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  // categories
  models:       'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800',
  queries:      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  migrations:   'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  admin:        'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800',
  signals:      'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
  forms:        'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
  views:        'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
};

export default function Badge({ children, variant = 'default', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none select-none',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default,
        className
      )}
    >
      {children}
    </span>
  );
}
