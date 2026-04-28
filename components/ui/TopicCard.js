import { memo } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';
import { cn, formatDuration } from '@/lib/utils';

function TopicCard({
  topic,
  isCompleted = false,
  isBookmarked = false,
  onComplete,    // unused on card now (moved to detail page) — kept for callers
  onBookmark,
  href,
}) {
  const { title, description, estimatedMinutes, difficulty } = topic;

  const cardContent = (
    <div
      className={cn(
        'group relative flex flex-col gap-2 h-full rounded p-4 transition-colors duration-150 cursor-pointer'
      )}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {difficulty && (
            <Badge variant={difficulty} size="sm">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          )}
          {estimatedMinutes && (
            <span className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
              {formatDuration(estimatedMinutes)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isCompleted && (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-label="Completed" />
          )}
          {onBookmark && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(topic.id); }}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}
              className="shrink-0 p-0.5 rounded-sm transition-colors duration-150"
              style={{ color: isBookmarked ? 'var(--accent)' : 'var(--text-subtle)' }}
            >
              {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-[14px] leading-snug" style={{ color: 'var(--text)' }}>
        {title}
      </h3>

      {description && (
        <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }
  return cardContent;
}

export default memo(TopicCard);
