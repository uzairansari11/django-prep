import { cn, getDifficultyColor, getCategoryColor } from '@/lib/utils';

const VARIANT_CLASSES = {
  default:      'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600',
  beginner:     null, // handled by getDifficultyColor
  intermediate: null,
  advanced:     null,
  models:       null, // handled by getCategoryColor
  queries:      null,
  migrations:   null,
  admin:        null,
  signals:      null,
  forms:        null,
  views:        null,
  success:      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  warning:      'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  danger:       'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  info:         'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  purple:       'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
};

const DIFFICULTY_VARIANTS = new Set(['beginner', 'intermediate', 'advanced']);
const CATEGORY_VARIANTS   = new Set(['models', 'queries', 'migrations', 'admin', 'signals', 'forms', 'views']);

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
  md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  lg: 'text-sm px-3 py-1.5 rounded-lg font-semibold',
};

/**
 * Badge component for difficulty levels, topic categories, and general tags.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {'beginner'|'intermediate'|'advanced'|'models'|'queries'|'migrations'|'admin'|'signals'|'forms'|'views'|'success'|'warning'|'danger'|'info'|'purple'|'default'} [props.variant='default']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}) {
  let colorClasses;

  if (DIFFICULTY_VARIANTS.has(variant)) {
    colorClasses = getDifficultyColor(variant);
  } else if (CATEGORY_VARIANTS.has(variant)) {
    colorClasses = getCategoryColor(variant);
  } else {
    colorClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none select-none',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        colorClasses,
        className
      )}
    >
      {children}
    </span>
  );
}
