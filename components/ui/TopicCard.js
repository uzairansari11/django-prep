import Link from 'next/link';
import { Clock, CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react';
import Badge from './Badge';
import Card from './Card';
import { cn, truncate, formatDuration } from '@/lib/utils';

/**
 * Card for displaying a learning topic in a grid.
 *
 * @param {object}   props
 * @param {object}   props.topic
 * @param {string}   props.topic.id
 * @param {string}   props.topic.title
 * @param {string}   [props.topic.description]
 * @param {number}   [props.topic.estimatedMinutes]
 * @param {'beginner'|'intermediate'|'advanced'} [props.topic.difficulty]
 * @param {string[]} [props.topic.tags]
 * @param {boolean}  [props.isCompleted=false]
 * @param {boolean}  [props.isBookmarked=false]
 * @param {Function} [props.onComplete]
 * @param {Function} [props.onBookmark]
 * @param {string}   [props.href]
 */
export default function TopicCard({
  topic,
  isCompleted = false,
  isBookmarked = false,
  onComplete,
  onBookmark,
  href,
}) {
  const {
    title,
    description,
    estimatedMinutes,
    difficulty,
    tags = [],
  } = topic;

  const cardContent = (
    <Card
      hover
      padding="md"
      className={cn(
        'relative flex flex-col gap-3 h-full transition-colors duration-200',
        isCompleted && 'border-emerald-300/60 dark:border-emerald-700/50'
      )}
    >
      {/* Completion ribbon */}
      {isCompleted && (
        <span className="absolute top-0 right-0 w-0 h-0 border-l-[36px] border-l-transparent border-t-[36px] border-t-emerald-500 rounded-tr-xl" />
      )}

      {/* Top row: difficulty + bookmark */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {difficulty && (
            <Badge variant={difficulty} size="sm">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          )}
          {estimatedMinutes && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
              <Clock className="w-3 h-3" />
              {formatDuration(estimatedMinutes)}
            </span>
          )}
        </div>

        {/* Bookmark button */}
        {onBookmark && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBookmark(topic.id);
            }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}
            className="shrink-0 p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-150"
          >
            {isBookmarked
              ? <BookmarkCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              : <Bookmark className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base text-slate-900 dark:text-zinc-100 leading-snug">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed flex-1">
          {truncate(description, 110)}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="default" size="sm">+{tags.length - 4}</Badge>
          )}
        </div>
      )}

      {/* Footer: complete button */}
      {onComplete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onComplete(topic.id);
          }}
          className={cn(
            'mt-2 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150',
            isCompleted
              ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isCompleted ? 'Completed' : 'Mark complete'}
        </button>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
