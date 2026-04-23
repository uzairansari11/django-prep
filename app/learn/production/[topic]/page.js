'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  XCircle,
  Clock,
  Flame,
  Shield,
  Database,
  List,
  FileText,
  Settings,
  Zap,
  Globe,
  Lock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProgress } from '@/hooks/useProgress';
import CodeBlock from '@/components/ui/CodeBlock';
import Badge from '@/components/ui/Badge';
import TopicList from '@/components/learn/TopicList';
import { productionTopics, productionSubcategories } from '@/data/production-topics';

const ICON_MAP = { Shield, Database, List, FileText, Settings, Zap, Clock, Globe, Lock, TrendingUp };

// ── Animation wrapper ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function TextContent({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-3">
      {String(text).split('\n').filter(p => p.trim()).map((para, i) => (
        <p key={i} className="leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>{para}</p>
      ))}
    </div>
  );
}

function Card({ children, className = '', accent = false }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        backgroundColor: accent ? 'var(--accent-light)' : 'var(--surface)',
        border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />}
      <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{children}</h2>
    </div>
  );
}

function SubcategoryBadge({ subcategoryId }) {
  const sub = productionSubcategories.find(s => s.id === subcategoryId);
  if (!sub) return null;
  const Icon = ICON_MAP[sub.icon];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {sub.label}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ProductionTopicPage({ params }) {
  const resolvedParams = use(params);
  const topicId = resolvedParams.topic;
  const router = useRouter();

  const topic = productionTopics.find(t => t.id === topicId);
  const topicIndex = productionTopics.findIndex(t => t.id === topicId);
  const prevTopic = topicIndex > 0 ? productionTopics[topicIndex - 1] : null;
  const nextTopic = topicIndex < productionTopics.length - 1 ? productionTopics[topicIndex + 1] : null;
  const relatedTopics = topic
    ? productionTopics.filter(t => t.subcategory === topic.subcategory && t.id !== topic.id).slice(0, 3)
    : [];

  const { completedTopics, markTopicComplete, markTopicIncomplete, isTopicComplete, toggleBookmark, isBookmarked, saveNote, getNote } = useProgress();
  const [noteText, setNoteText] = useState(() => topic ? getNote(topic.id) : '');
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveNote = useCallback(() => {
    if (!topic) return;
    saveNote(topic.id, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }, [topic, noteText, saveNote]);

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-5" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Topic not found</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            The topic <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)' }}>{topicId}</code> does not exist.
          </p>
          <Link href="/learn/production" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm" style={{ backgroundColor: 'var(--accent)' }}>
            <ChevronLeft className="w-4 h-4" /> Back to Production
          </Link>
        </div>
      </div>
    );
  }

  const isComplete = isTopicComplete(topic.id);
  const bookmarked = isBookmarked(topic.id);
  const { content } = topic;
  const productionCompletedCount = productionTopics.filter(t => completedTopics.has(String(t.id))).length;
  const productionProgress = Math.round((productionCompletedCount / productionTopics.length) * 100);

  return (
    <div className="min-h-screen">

      {/* Mobile topic picker */}
      <div className="lg:hidden border-b px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <nav className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <Link href="/learn" style={{ color: 'var(--accent)' }}>Learn</Link>
          <span>/</span>
          <Link href="/learn/production" style={{ color: 'var(--accent)' }}>Production</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }} className="truncate max-w-[10rem]">{topic.title}</span>
        </nav>
        <select value={topicId} onChange={e => router.push(`/learn/production/${e.target.value}`)} className="w-full text-sm rounded-xl px-4 py-2" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          {productionTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      <div className="flex items-start">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r" style={{ position: 'sticky', top: 0, height: 'calc(100vh - 4rem)', backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="shrink-0 px-4 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <nav className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              <Link href="/learn" className="hover:underline" style={{ color: 'var(--accent)' }}>Learn</Link>
              <span>/</span>
              <Link href="/learn/production" className="hover:underline" style={{ color: 'var(--accent)' }}>Production</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Production Patterns</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Progress</span>
                <span style={{ color: 'var(--accent)' }}>{productionCompletedCount}/{productionTopics.length}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${productionProgress}%`, backgroundColor: 'var(--accent)' }} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
            <TopicList topics={productionTopics} completedTopics={completedTopics} currentTopicId={topic.id} onSelect={t => router.push(`/learn/production/${t.id}`)} />
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

            {/* ── Header ── */}
            <Reveal delay={0}>
              <Card>
                {/* Top meta row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant={topic.difficulty}>
                    {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                  </Badge>
                  {topic.estimatedMinutes && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
                      <Clock className="w-3.5 h-3.5" />{topic.estimatedMinutes} min
                    </span>
                  )}
                  <SubcategoryBadge subcategoryId={topic.subcategory} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2" style={{ color: 'var(--text)' }}>
                      {topic.title}
                    </h1>
                    {topic.description && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{topic.description}</p>
                    )}
                    {topic.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {topic.tags.map(tag => <Badge key={tag} variant="default" size="sm">{tag}</Badge>)}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleBookmark(topic.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                      style={bookmarked ? { backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' } : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      onMouseEnter={e => { if (!bookmarked) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                      onMouseLeave={e => { if (!bookmarked) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                    >
                      {bookmarked ? <Bookmark className="w-4 h-4 fill-current" /> : <BookmarkPlus className="w-4 h-4" />}
                      <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => isComplete ? markTopicIncomplete(topic.id) : markTopicComplete(topic.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                      style={isComplete ? { backgroundColor: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff' } : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      onMouseEnter={e => { if (!isComplete) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                      onMouseLeave={e => { if (!isComplete) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isComplete ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* ── Explanation + Real World: side by side if both exist ── */}
            {(content.explanation || content.realExample) && (
              <Reveal delay={0.05}>
                <div className={`grid gap-4 ${content.explanation && content.realExample ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {content.explanation && (
                    <Card>
                      <SectionTitle icon={BookOpen}>What it is</SectionTitle>
                      <TextContent text={content.explanation} />
                    </Card>
                  )}
                  {content.realExample && (
                    <Card>
                      <SectionTitle icon={Lightbulb}>Real World Example</SectionTitle>
                      <TextContent text={content.realExample} />
                    </Card>
                  )}
                </div>
              </Reveal>
            )}

            {/* ── Code Example ── */}
            {content.codeExample && (
              <Reveal delay={0.1}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Code Example</h2>
                  </div>
                  <CodeBlock code={content.codeExample} title={`${topic.slug || topic.id}.py`} showLineNumbers />
                </div>
              </Reveal>
            )}

            {/* ── Output Explanation ── */}
            {content.outputExplanation && (
              <Reveal delay={0.12}>
                <Card>
                  <SectionTitle icon={BookOpen}>Understanding the Output</SectionTitle>
                  <TextContent text={content.outputExplanation} />
                </Card>
              </Reveal>
            )}

            {/* ── When to Use + When NOT to Use: always side by side ── */}
            {(content.whenToUse || content.whenNotToUse) && (
              <Reveal delay={0.15}>
                <div className={`grid gap-4 ${content.whenToUse && content.whenNotToUse ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {content.whenToUse && (
                    <Card>
                      <SectionTitle icon={CheckCircle}>When to Use</SectionTitle>
                      <TextContent text={content.whenToUse} />
                    </Card>
                  )}
                  {content.whenNotToUse && (
                    <Card>
                      <SectionTitle icon={XCircle}>When NOT to Use</SectionTitle>
                      <TextContent text={content.whenNotToUse} />
                    </Card>
                  )}
                </div>
              </Reveal>
            )}

            {/* ── Common Mistakes ── */}
            {content.commonMistakes?.length > 0 && (
              <Reveal delay={0.18}>
                <Card>
                  <SectionTitle icon={AlertTriangle}>Common Mistakes</SectionTitle>
                  <ul className="space-y-3">
                    {content.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{mistake}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            )}

            {/* ── Interview Notes — accent-tinted highlight panel ── */}
            {content.interviewNotes?.length > 0 && (
              <Reveal delay={0.2}>
                <Card accent>
                  <SectionTitle icon={Lightbulb}>Interview Notes</SectionTitle>
                  <ul className="space-y-2.5">
                    {content.interviewNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ backgroundColor: 'var(--accent)' }} />
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            )}

            {/* ── Related Topics ── */}
            {relatedTopics.length > 0 && (
              <Reveal delay={0.22}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Related Topics</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {relatedTopics.map(related => (
                      <Link
                        key={related.id}
                        href={`/learn/production/${related.id}`}
                        className="flex items-center justify-between p-3 rounded-xl transition-all duration-150 group"
                        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: 'var(--text)' }}>{related.title}</p>
                          <Badge variant={related.difficulty} size="sm">{related.difficulty.charAt(0).toUpperCase() + related.difficulty.slice(1)}</Badge>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* ── My Notes ── */}
            <Reveal delay={0.24}>
              <Card>
                <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>My Notes</h2>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Jot down anything you want to remember…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none font-sans focus:outline-none transition-all duration-150"
                  style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Saved locally in your browser</span>
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={noteSaved ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' } : { backgroundColor: 'var(--accent)', color: '#fff', border: '1px solid transparent' }}
                  >
                    {noteSaved ? 'Saved!' : 'Save Note'}
                  </button>
                </div>
              </Card>
            </Reveal>

            {/* ── Prev / Next ── */}
            <Reveal delay={0.26}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
                {prevTopic ? (
                  <Link
                    href={`/learn/production/${prevTopic.id}`}
                    className="flex flex-col gap-1 p-4 rounded-2xl transition-all duration-150"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </span>
                    <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{prevTopic.title}</span>
                  </Link>
                ) : <div />}

                {nextTopic ? (
                  <Link
                    href={`/learn/production/${nextTopic.id}`}
                    className="flex flex-col gap-1 p-4 rounded-2xl transition-all duration-150 text-right"
                    style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <span className="flex items-center justify-end gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{nextTopic.title}</span>
                  </Link>
                ) : <div />}
              </div>
            </Reveal>

          </div>
        </main>
      </div>
    </div>
  );
}
