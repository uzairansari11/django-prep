import { CheckCircle2, Bookmark, BookmarkCheck, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { cn, truncate } from '@/lib/utils';

/**
 * Card for practice exercises.
 *
 * @param {object}   props
 * @param {object}   props.exercise
 * @param {string}   props.exercise.id
 * @param {string}   props.exercise.title
 * @param {string}   [props.exercise.description]
 * @param {'beginner'|'intermediate'|'advanced'} [props.exercise.difficulty]
 * @param {string}   [props.exercise.topic]       - category label
 * @param {string[]} [props.exercise.tags]
 * @param {boolean}  [props.isCompleted=false]
 * @param {boolean}  [props.isBookmarked=false]
 * @param {Function} [props.onComplete]
 * @param {Function} [props.onBookmark]
 * @param {Function} [props.onClick]
 */
export default function ExerciseCard({
  exercise,
  isCompleted = false,
  isBookmarked = false,
  onComplete,
  onBookmark,
  onClick,
}) {
  const {
    id,
    title,
    description,
    difficulty,
    topic,
    tags = [],
  } = exercise;

  return (
    <Card
      hover
      padding="md"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-3 relative group/card',
        isCompleted && 'border-emerald-300/50 dark:border-emerald-700/40 bg-emerald-50/30 dark:bg-emerald-950/10'
      )}
    >
      {/* Completion indicator strip */}
      {isCompleted && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-emerald-500" />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {difficulty && (
            <Badge variant={difficulty} size="sm">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          )}
          {topic && (
            <Badge variant={topic.toLowerCase()} size="sm">
              {topic}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {onBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(id);
              }}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-150"
            >
              {isBookmarked
                ? <BookmarkCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                : <Bookmark className="w-4 h-4" />}
            </button>
          )}

          {onComplete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(id);
              }}
              title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-150',
                isCompleted
                  ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-base leading-snug',
        isCompleted
          ? 'text-slate-600 dark:text-zinc-400 line-through decoration-slate-400/50'
          : 'text-slate-900 dark:text-white'
      )}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          {truncate(description, 130)}
        </p>
      )}

      {/* Tags + arrow */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="default" size="sm">+{tags.length - 3}</Badge>
          )}
        </div>

        {onClick && (
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover/card:text-indigo-500 group-hover/card:translate-x-0.5 transition-all duration-150 shrink-0" />
        )}
      </div>
    </Card>
  );
}
