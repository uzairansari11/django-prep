import Link from 'next/link';
import { Clock, CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react';
import Badge from './Badge';
import { cn, truncate, formatDuration } from '@/lib/utils';

export default function TopicCard({
  topic,
  isCompleted = false,
  isBookmarked = false,
  onComplete,
  onBookmark,
  href,
}) {
  const { title, description, estimatedMinutes, difficulty, tags = [] } = topic;

  const cardContent = (
    <div
      className={cn(
        'relative flex flex-col gap-3 h-full rounded-xl p-5',
        'transition-all duration-200 cursor-pointer',
      )}
      style={{
        backgroundColor: 'var(--surface)',
        border: isCompleted ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--text) 8%, transparent)';
        e.currentTarget.style.borderColor = 'var(--accent-ring)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = isCompleted
          ? 'color-mix(in srgb, var(--accent) 40%, transparent)'
          : 'var(--border)';
      }}
    >
      {/* Completed indicator dot */}
      {isCompleted && (
        <span
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ backgroundColor: '#22c55e' }}
        />
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
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3" />
              {formatDuration(estimatedMinutes)}
            </span>
          )}
        </div>

        {onBookmark && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(topic.id); }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}
            className="shrink-0 p-1 rounded-md transition-colors duration-150"
            style={{ color: 'var(--text-subtle)' }}
          >
            {isBookmarked
              ? <BookmarkCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              : <Bookmark className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--text)' }}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
          {truncate(description, 110)}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="default" size="sm">+{tags.length - 4}</Badge>
          )}
        </div>
      )}

      {/* Complete button */}
      {onComplete && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComplete(topic.id); }}
          className="mt-2 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150"
          style={
            isCompleted
              ? { borderColor: '#86efac', color: '#16a34a', backgroundColor: '#f0fdf4' }
              : { borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }
          }
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isCompleted ? 'Completed' : 'Mark complete'}
        </button>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }

  return cardContent;
}
