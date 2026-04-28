import Link from 'next/link';
import { CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function ExerciseCard({
  exercise,
  href,
  isCompleted = false,
  isBookmarked = false,
  onComplete,
  onBookmark,
}) {
  const { id, title, description, difficulty, topic } = exercise;

  // Stop the inner action button (complete / bookmark) from bubbling up
  // and triggering the Link's navigation. preventDefault is what cancels
  // the link click; stopPropagation is just defensive.
  const stopLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link
      href={href}
      className={cn(
        'group cursor-pointer flex flex-col gap-2 rounded p-4 transition-colors duration-150'
      )}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {difficulty && (
            <Badge variant={difficulty} size="sm">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          )}
          {topic && (
            <Badge variant={topic.toLowerCase()} size="sm">{topic}</Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {isCompleted && (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-label="Completed" />
          )}
          {onBookmark && (
            <button
              type="button"
              onClick={(e) => { stopLink(e); onBookmark(id); }}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              className="p-0.5 rounded-sm transition-colors duration-150"
              style={{ color: isBookmarked ? 'var(--accent)' : 'var(--text-subtle)' }}
            >
              {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          )}
          {onComplete && !isCompleted && (
            <button
              type="button"
              onClick={(e) => { stopLink(e); onComplete(id); }}
              title="Mark complete"
              className="p-0.5 rounded-sm transition-colors duration-150"
              style={{ color: 'var(--text-subtle)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h3
        className={cn('font-semibold text-[14px] leading-snug')}
        style={{
          color: isCompleted ? 'var(--text-muted)' : 'var(--text)',
          textDecoration: isCompleted ? 'line-through' : 'none',
        }}
      >
        {title}
      </h3>

      {description && (
        <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
    </Link>
  );
}
