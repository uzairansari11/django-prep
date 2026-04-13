'use client'

import { useState, useCallback, useRef, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  Eye,
  EyeOff,
  BookmarkPlus,
  Bookmark,
  Code,
  FileText,
  Database,
  Play,
  AlertCircle,
  CheckCheck,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'
import { exercises } from '@/data/exercises'
import { useProgress } from '@/hooks/useProgress'
import CodeBlock from '@/components/ui/CodeBlock'
import Badge from '@/components/ui/Badge'
import { checkAnswer } from '@/lib/answerChecker'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, children }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide mb-3">
      <Icon className="w-4 h-4 text-slate-400 dark:text-zinc-500" aria-hidden="true" />
      {children}
    </h3>
  )
}

function Divider() {
  return <hr className="border-slate-200 dark:border-zinc-800" />
}

// ─── TestResultPanel ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  correct: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    label: 'Correct!',
    barColor: 'bg-green-500',
  },
  close: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: AlertCircle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    label: 'Almost There!',
    barColor: 'bg-yellow-500',
  },
  partial: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    icon: AlertTriangle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    label: 'Partial Credit',
    barColor: 'bg-orange-500',
  },
  wrong: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    label: 'Not Quite',
    barColor: 'bg-red-500',
  },
  empty: {
    bg: 'bg-slate-50 dark:bg-zinc-900',
    border: 'border-slate-200 dark:border-zinc-700',
    icon: AlertCircle,
    iconColor: 'text-slate-500',
    label: 'Empty',
    barColor: 'bg-slate-400',
  },
}

function TestResultPanel({ result, onDismiss }) {
  const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.wrong
  const Icon = cfg.icon

  const hasDetails =
    result.details &&
    (result.details.modelMatch !== undefined ||
      result.details.methodsMatch !== undefined ||
      result.details.argsMatch !== undefined)

  return (
    <div
      className={[
        'rounded-2xl border p-5 space-y-4 transition-all duration-200',
        cfg.bg,
        cfg.border,
      ].join(' ')}
      role="region"
      aria-label="Test result"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className={['w-6 h-6 shrink-0', cfg.iconColor].join(' ')} aria-hidden="true" />
          <div>
            <p className={['text-base font-bold', cfg.iconColor].join(' ')}>{cfg.label}</p>
            <p className="text-sm text-slate-700 dark:text-zinc-300 leading-snug mt-0.5">
              {result.feedback}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss result"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-zinc-700/50 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
          <span>Score</span>
          <span>{result.score}/100</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={['h-full rounded-full transition-all duration-500', cfg.barColor].join(' ')}
            style={{ width: `${result.score}%` }}
            role="progressbar"
            aria-valuenow={result.score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Issues list */}
      {result.issues && result.issues.length > 0 && (
        <ul className="space-y-1.5 pl-1">
          {result.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-300">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" aria-hidden="true" />
              {issue}
            </li>
          ))}
        </ul>
      )}

      {/* Detail chips — model / methods / args */}
      {hasDetails && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-current/10">
          {result.details.modelMatch !== undefined && (
            <DetailChip label="Model" pass={result.details.modelMatch} />
          )}
          {result.details.methodsMatch !== undefined && (
            <DetailChip label="Methods" pass={result.details.methodsMatch} />
          )}
          {result.details.argsMatch !== undefined && (
            <DetailChip label="Arguments" pass={result.details.argsMatch} />
          )}
        </div>
      )}

      {/* Celebration message */}
      {result.status === 'correct' && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 dark:bg-green-800/30 border border-green-200 dark:border-green-700/50">
          <CheckCheck className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Excellent work! This exercise has been marked as complete.
          </p>
        </div>
      )}
    </div>
  )
}

function DetailChip({ label, pass }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
        pass
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      ].join(' ')}
    >
      {pass ? (
        <CheckCircle className="w-3 h-3" aria-hidden="true" />
      ) : (
        <XCircle className="w-3 h-3" aria-hidden="true" />
      )}
      {label}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExerciseDetailPage({ params }) {
  const { id } = use(params)
  const router = useRouter()

  // Find the exercise
  const exerciseIndex = exercises.findIndex((e) => e.id === id)
  const exercise = exercises[exerciseIndex] ?? null

  const prevExercise = exerciseIndex > 0 ? exercises[exerciseIndex - 1] : null
  const nextExercise = exerciseIndex < exercises.length - 1 ? exercises[exerciseIndex + 1] : null

  const {
    markExerciseComplete,
    isExerciseComplete,
    toggleBookmark,
    isBookmarked,
    saveNote,
    getNote,
  } = useProgress()

  // ─── Local state ───────────────────────────────────────────────────────────
  const [userCode, setUserCode] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [schemaOpen, setSchemaOpen] = useState(true)
  const [sampleDataOpen, setSampleDataOpen] = useState(true)
  const [activeSolutionTab, setActiveSolutionTab] = useState('primary')

  // Submit & Test state
  const [testResult, setTestResult] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const noteSaveTimerRef = useRef(null)
  const editorRef = useRef(null)

  const isCompleted = exercise ? isExerciseComplete(exercise.id) : false
  const bookmarked = exercise ? isBookmarked(exercise.id) : false

  // Load saved note on mount / when id changes
  useEffect(() => {
    if (exercise) {
      setNoteText(getNote(exercise.id))
    }
    // Reset panel state when navigating between exercises
    setUserCode('')
    setShowHints(false)
    setCurrentHintIndex(0)
    setShowSolution(false)
    setShowExplanation(false)
    setNoteSaved(false)
    setSchemaOpen(true)
    setSampleDataOpen(true)
    setActiveSolutionTab('primary')
    // Reset submit state
    setTestResult(null)
    setIsRunning(false)
    setHasSubmitted(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ─── Submit & Test ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!userCode.trim()) return
    setIsRunning(true)
    setHasSubmitted(false)
    setTestResult(null)

    // Simulate a brief "running" delay for better UX
    setTimeout(() => {
      const result = checkAnswer(
        userCode,
        exercise.solution,
        exercise.alternativeSolutions || [],
      )
      setTestResult(result)
      setHasSubmitted(true)
      setIsRunning(false)

      // Auto-mark complete if correct
      if (result.status === 'correct' && !isExerciseComplete(exercise.id)) {
        markExerciseComplete(exercise.id)
      }
    }, 800)
  }, [userCode, exercise, isExerciseComplete, markExerciseComplete])

  // ─── Keyboard handler (Tab + Ctrl/Cmd+Enter) ───────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      // Submit shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
        return
      }

      // Tab indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        const start = e.target.selectionStart
        const end = e.target.selectionEnd
        const newValue = userCode.substring(0, start) + '    ' + userCode.substring(end)
        setUserCode(newValue)
        requestAnimationFrame(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 4
          }
        })
      }
    },
    [userCode, handleSubmit],
  )

  // ─── Note auto-save ────────────────────────────────────────────────────────
  const handleNoteChange = (e) => {
    const val = e.target.value
    setNoteText(val)
    setNoteSaved(false)
    clearTimeout(noteSaveTimerRef.current)
    noteSaveTimerRef.current = setTimeout(() => {
      saveNote(exercise.id, val)
      setNoteSaved(true)
    }, 800)
  }

  // ─── Hints ────────────────────────────────────────────────────────────────
  const hints = exercise?.hints ?? []

  const handleShowNextHint = () => {
    if (!showHints) {
      setShowHints(true)
      setCurrentHintIndex(0)
    } else if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex((i) => i + 1)
    }
  }

  const hintsRevealed = showHints ? currentHintIndex + 1 : 0

  // ─── Mark complete ────────────────────────────────────────────────────────
  const handleMarkComplete = () => {
    markExerciseComplete(exercise.id)
  }

  // ─── Not found ────────────────────────────────────────────────────────────
  if (!exercise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 gap-6 px-4">
        <div className="p-5 rounded-2xl bg-rose-100 dark:bg-rose-900/30">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Exercise Not Found
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">
            No exercise with id &ldquo;{id}&rdquo; exists.
          </p>
        </div>
        <Link
          href="/practice"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to Practice
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col overflow-x-hidden">
      {/* ── Top bar / breadcrumb ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30 overflow-x-hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 min-w-0">
          {/* Back button */}
          <Link
            href="/practice"
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Practice
          </Link>

          <span className="text-slate-300 dark:text-slate-600">/</span>

          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {exercise.title}
          </span>

          {/* Badges */}
          <div className="hidden sm:flex items-center gap-2 ml-1">
            <Badge variant={exercise.difficulty} size="sm">
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </Badge>
            <Badge variant={exercise.category} size="sm">
              {exercise.category}
            </Badge>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Completion status */}
          {isCompleted && (
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCheck className="w-4 h-4" />
              Completed
            </span>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevExercise && router.push(`/practice/${prevExercise.id}`)}
              disabled={!prevExercise}
              title={prevExercise ? `Previous: ${prevExercise.title}` : 'No previous exercise'}
              className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
              {exerciseIndex + 1} / {exercises.length}
            </span>
            <button
              onClick={() => nextExercise && router.push(`/practice/${nextExercise.id}`)}
              disabled={!nextExercise}
              title={nextExercise ? `Next: ${nextExercise.title}` : 'No next exercise'}
              className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 min-w-0">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start min-w-0">

          {/* ═══════════════════════════════════════════════════════════════
              LEFT PANEL — Problem description
          ═══════════════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[420px] lg:shrink-0 min-w-0 lg:sticky lg:top-[3.75rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto space-y-5 pb-6">

            {/* Exercise title + meta */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={exercise.difficulty} size="md">
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </Badge>
                  <Badge variant={exercise.category} size="md">
                    {exercise.category}
                  </Badge>
                  {exercise.topic && exercise.topic !== 'all' && (
                    <Badge variant="default" size="sm">
                      {exercise.topic}
                    </Badge>
                  )}
                </div>

                {/* Bookmark button */}
                <button
                  onClick={() => toggleBookmark(exercise.id)}
                  title={bookmarked ? 'Remove bookmark' : 'Bookmark this exercise'}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-150 shrink-0"
                >
                  {bookmarked
                    ? <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
                    : <BookmarkPlus className="w-5 h-5" />}
                </button>
              </div>

              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {exercise.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {exercise.description}
              </p>
            </div>

            {/* Schema */}
            {exercise.schema && (
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setSchemaOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                  aria-expanded={schemaOpen}
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                    <Database className="w-4 h-4 text-slate-400 dark:text-zinc-500" aria-hidden="true" />
                    Schema
                  </h3>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${schemaOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                </button>
                {schemaOpen && (
                  <div className="px-5 pb-5">
                    <CodeBlock
                      code={exercise.schema}
                      language="python"
                      title="models.py"
                      showLineNumbers
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sample data */}
            {exercise.sampleData && (
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setSampleDataOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                  aria-expanded={sampleDataOpen}
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                    <Database className="w-4 h-4 text-slate-400 dark:text-zinc-500" aria-hidden="true" />
                    Sample Data
                  </h3>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${sampleDataOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                </button>
                {sampleDataOpen && (
                  <div className="px-5 pb-5">
                    <CodeBlock
                      code={exercise.sampleData}
                      language="python"
                      title="seed data"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Problem statement */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
              <SectionHeading icon={FileText}>Problem Statement</SectionHeading>
              <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed">
                {exercise.problemStatement}
              </p>

              {exercise.expectedResult && (
                <>
                  <Divider />
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                      Expected Result
                    </p>
                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {exercise.expectedResult}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Tags */}
            {exercise.tags && exercise.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {exercise.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Mark complete + bookmark actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleMarkComplete}
                className={[
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/30',
                ].join(' ')}
              >
                <CheckCircle className="w-4 h-4" />
                {isCompleted ? 'Marked as Complete' : 'Mark as Complete'}
              </button>
            </div>

            {/* Prev / Next exercise navigation (bottom of left panel) */}
            <div className="flex items-center gap-3">
              {prevExercise ? (
                <Link
                  href={`/practice/${prevExercise.id}`}
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="truncate">{prevExercise.title}</span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextExercise ? (
                <Link
                  href={`/practice/${nextExercise.id}`}
                  className="flex-1 flex items-center justify-end gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                >
                  <span className="truncate">{nextExercise.title}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT PANEL — Code editor + hints + solution
          ═══════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Code editor card */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    Your Solution
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {/* Traffic light dots — purely decorative */}
                  <span className="w-3 h-3 rounded-full bg-rose-400/70" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/70" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/70" aria-hidden="true" />
                </div>
              </div>

              {/* Textarea editor */}
              <textarea
                ref={editorRef}
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                onKeyDown={handleKeyDown}

                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                aria-label="Code editor"
                className="block w-full resize-none outline-none font-mono text-sm leading-relaxed p-5"
                style={{
                  background: '#0d1117',
                  color: '#e6edf3',
                  fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Courier New', monospace",
                  fontSize: '14px',
                  minHeight: '320px',
                  tabSize: 4,
                  caretColor: '#58a6ff',
                }}
              />

              {/* Keyboard hint + line count */}
              <div className="px-5 py-1.5 bg-[#0d1117] border-t border-slate-700/30 flex items-center justify-between">
                <p className="text-xs text-slate-500 select-none">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-mono text-[10px] border border-slate-600/50">
                    Ctrl
                  </kbd>
                  {' + '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 font-mono text-[10px] border border-slate-600/50">
                    Enter
                  </kbd>
                  {' '}to run tests
                </p>
                {userCode && (
                  <p className="text-xs text-slate-600 select-none tabular-nums">
                    {userCode.split('\n').length} lines · {userCode.length} chars
                  </p>
                )}
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-slate-700/40 bg-[#0d1117]">
                {/* Run Tests button */}
                <button
                  onClick={handleSubmit}
                  disabled={!userCode.trim() || isRunning}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isRunning ? 'Running...' : 'Run Tests'}
                </button>

                {/* Show Hint button */}
                <button
                  onClick={handleShowNextHint}
                  disabled={hintsRevealed >= hints.length}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHints
                    ? hintsRevealed < hints.length
                      ? `Hint ${hintsRevealed + 1} of ${hints.length}`
                      : 'All Hints Shown'
                    : 'Show Hint'}
                  {hintsRevealed > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-xs font-bold">
                      {hintsRevealed}/{hints.length}
                    </span>
                  )}
                </button>

                {/* Show/hide solution */}
                <button
                  onClick={() => setShowSolution((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all duration-150"
                >
                  {showSolution ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Solution
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show Solution
                    </>
                  )}
                </button>

                {/* Mark complete — mirrored in right panel */}
                <button
                  onClick={handleMarkComplete}
                  className={[
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ml-auto',
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                      : 'bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 border-slate-600/40',
                  ].join(' ')}
                >
                  <CheckCheck className="w-4 h-4" />
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>

            {/* ── Test Result panel ─────────────────────────────────────── */}
            {testResult && (
              <TestResultPanel
                result={testResult}
                onDismiss={() => setTestResult(null)}
              />
            )}

            {/* ── Hints panel ──────────────────────────────────────────── */}
            {showHints && hints.length > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    <Lightbulb className="w-4 h-4" />
                    Hints
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-800/50 text-xs font-bold text-amber-700 dark:text-amber-300">
                      {hintsRevealed}/{hints.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => { setShowHints(false); setCurrentHintIndex(0) }}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Hide
                  </button>
                </div>

                <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
                  <ol className="space-y-3">
                    {hints.slice(0, hintsRevealed).map((hint, i) => (
                      <li key={i} className="flex gap-3 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800/60 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                          {i + 1}
                        </span>
                        {hint}
                      </li>
                    ))}
                  </ol>

                  {hintsRevealed < hints.length && (
                    <button
                      onClick={handleShowNextHint}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mt-1"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Reveal hint {hintsRevealed + 1} of {hints.length}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Solution panel ───────────────────────────────────────── */}
            {showSolution && (
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800/40 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                    <Eye className="w-4 h-4" />
                    Solution
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Try it yourself first!
                  </div>
                </div>

                {/* Tabs — only show if alternatives exist */}
                {exercise.alternativeSolutions && exercise.alternativeSolutions.length > 0 && (
                  <div className="flex border-b border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10 px-5 gap-1 pt-2">
                    {['primary', ...exercise.alternativeSolutions.map((_, i) => `alt-${i}`)].map((tab, i) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSolutionTab(tab)}
                        className={[
                          'px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 -mb-px transition-colors',
                          activeSolutionTab === tab
                            ? 'border-indigo-500 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-900/60'
                            : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400',
                        ].join(' ')}
                      >
                        {tab === 'primary' ? 'Primary' : `Alt ${i}`}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Primary solution */}
                  {exercise.solution && (activeSolutionTab === 'primary' || !exercise.alternativeSolutions?.length) && (
                    <CodeBlock
                      code={exercise.solution}
                      language="python"
                      title="solution.py"
                    />
                  )}

                  {/* Alternative solutions */}
                  {exercise.alternativeSolutions && exercise.alternativeSolutions.map((alt, i) =>
                    activeSolutionTab === `alt-${i}` ? (
                      <CodeBlock
                        key={i}
                        code={alt}
                        language="python"
                        title={`alternative-${i + 1}.py`}
                      />
                    ) : null
                  )}

                  {/* Explanation toggle */}
                  {exercise.explanation && (
                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
                      <button
                        onClick={() => setShowExplanation((v) => !v)}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                      </button>

                      {showExplanation && (
                        <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                            {exercise.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Personal Notes ───────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionHeading icon={FileText}>My Notes</SectionHeading>
                {noteSaved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>
              <textarea
                value={noteText}
                onChange={handleNoteChange}
                placeholder="Jot down your thoughts, things to remember, or personal insights about this exercise…"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/60 px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all duration-150 leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Notes are saved automatically to your browser.
                </p>
                {noteText && (
                  <p className="text-xs text-slate-400 dark:text-zinc-600 tabular-nums">
                    {noteText.length} chars
                  </p>
                )}
              </div>
            </div>

            {/* ── Bottom nav (mobile-friendly duplicate) ───────────────── */}
            <div className="flex items-center gap-3 lg:hidden">
              {prevExercise ? (
                <Link
                  href={`/practice/${prevExercise.id}`}
                  className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="truncate">Prev</span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {nextExercise ? (
                <Link
                  href={`/practice/${nextExercise.id}`}
                  className="flex-1 flex items-center justify-end gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                >
                  <span className="truncate">Next</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>

          </div>
          {/* end right panel */}
        </div>
      </div>
    </div>
  )
}
