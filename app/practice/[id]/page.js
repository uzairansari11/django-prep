'use client'

import { useState, useCallback, useRef, useEffect, use, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ChevronLeft, ChevronRight, CheckCircle, Lightbulb, Eye, EyeOff,
  BookmarkPlus, Bookmark, Code2, FileText, Database, Play, AlertCircle,
  CheckCheck, XCircle, AlertTriangle, Loader2, X, Terminal, RotateCcw,
  Copy, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import { python } from '@codemirror/lang-python'
import { keymap, EditorView } from '@codemirror/view'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { githubLight } from '@uiw/codemirror-theme-github'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { exercises } from '@/data/exercises'
import { useProgress } from '@/hooks/useProgress'
import Badge from '@/components/ui/Badge'
import { checkAnswer } from '@/lib/answerChecker'
import { useAppSettings } from '@/hooks/useAppSettings'

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false })

// ─── CodeMirror theme override — follows app CSS variables ────────────────────
const cmAppTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    color: 'var(--text-subtle)',
    minWidth: '40px',
  },
  '.cm-gutterElement': { padding: '0 8px 0 4px !important' },
  '.cm-lineNumbers .cm-gutterElement': { color: 'var(--text-subtle)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--surface-2)' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent) 5%, transparent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'var(--accent-light)',
  },
  '.cm-content': { caretColor: 'var(--accent)', padding: '12px 0' },
  '.cm-line': { padding: '0 16px' },
  '.cm-placeholder': { color: 'var(--text-subtle)' },
})

// Font extension — uses the app's monospace stack
const cmFont = EditorView.theme({
  '.cm-content, .cm-gutters': {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
    fontSize: '13px',
    lineHeight: '1.75',
  },
})

// ─── Simulated output ─────────────────────────────────────────────────────────
function buildSimulatedOutput(exercise) {
  const sol = (exercise.solution || '').trim()
  const expected = exercise.expectedResult || ''
  if (sol.includes('.count()') || expected.toLowerCase().includes('count')) return `>>> ${sol}\n3`
  if (sol.includes('.exists()')) return `>>> ${sol}\nTrue`
  if (sol.includes('.values_list(') && sol.includes('flat=True'))
    return `>>> ${sol}\n<QuerySet ['Harry Potter', '1984', 'Dune']>`
  if (sol.includes('.values('))
    return `>>> ${sol}\n<QuerySet [\n  {'id': 1, 'title': 'Harry Potter'},\n  {'id': 2, 'title': '1984'}\n]>`
  if (sol.includes('.aggregate(')) {
    const m = sol.match(/\w+=/); const k = m ? m[0].slice(0, -1) : 'result'
    return `>>> ${sol}\n{'${k}': 12.99}`
  }
  if (sol.includes('.annotate('))
    return `>>> ${sol}\n<QuerySet [\n  <Book: Harry Potter (count=5)>,\n  <Book: 1984 (count=3)>\n]>`
  if (sol.includes('.first()') || sol.includes('.get(')) {
    const model = sol.match(/(\w+)\.objects/)?.[1] || 'Object'
    return `>>> ${sol}\n<${model}: ${model} object (1)>`
  }
  if (sol.includes('.last()')) {
    const model = sol.match(/(\w+)\.objects/)?.[1] || 'Object'
    return `>>> ${sol}\n<${model}: ${model} object (3)>`
  }
  if (sol.includes('.delete()')) return `>>> ${sol}\n(1, {'myapp.Book': 1})`
  if (sol.includes('.update(')) return `>>> ${sol}\n2`
  if (sol.includes('.order_by('))
    return `>>> ${sol}\n<QuerySet [\n  <Book: Animal Farm>,\n  <Book: 1984>,\n  <Book: Harry Potter>\n]>`
  if (sol.includes('.filter(') || sol.includes('.exclude(')) {
    const count = expected.match(/(\d+)\s+book/i)?.[1] || '2'
    const model = sol.match(/(\w+)\.objects/)?.[1] || 'Book'
    const rows = Array.from({ length: parseInt(count) || 2 }, (_, i) => `  <${model}: ${model} object (${i + 1})>`).join(',\n')
    return `>>> ${sol}\n<QuerySet [\n${rows}\n]>`
  }
  const model = sol.match(/(\w+)\.objects/)?.[1] || 'Object'
  return `>>> ${sol}\n<QuerySet [\n  <${model}: ${model} object (1)>,\n  <${model}: ${model} object (2)>,\n  <${model}: ${model} object (3)>\n]>`
}

// ─── Result config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  correct: { icon: CheckCircle,  color: '#10b981', bg: 'rgba(16,185,129,.10)', border: 'rgba(16,185,129,.28)', label: 'All tests passed',   bar: '#10b981' },
  close:   { icon: AlertCircle,  color: '#f59e0b', bg: 'rgba(245,158,11,.10)', border: 'rgba(245,158,11,.28)', label: 'Almost there',       bar: '#f59e0b' },
  partial: { icon: AlertTriangle,color: '#f97316', bg: 'rgba(249,115,22,.10)', border: 'rgba(249,115,22,.28)', label: 'Partial match',      bar: '#f97316' },
  wrong:   { icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,.10)', border:  'rgba(239,68,68,.28)',  label: 'Tests failed',       bar: '#ef4444' },
  empty:   { icon: AlertCircle,  color: '#6b7280', bg: 'rgba(107,114,128,.08)',border: 'rgba(107,114,128,.20)',label: 'No answer',           bar: '#6b7280' },
}

// ─── Python syntax highlighter (for sample data blocks) ──────────────────────
const PY_RE = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b(?:True|False|None|import|from|as|class|def|return|for|while|if|else|elif|in|not|and|or|is|with|pass)\b)|(\b\d+(?:\.\d+)?\b)|([a-zA-Z_]\w*(?=\s*\())/g
const PY_COL = { s: '#86efac', k: '#c084fc', n: '#fb923c', f: '#93c5fd' }

function pyHighlight(code) {
  const out = []; let last = 0; let key = 0; let m
  PY_RE.lastIndex = 0
  while ((m = PY_RE.exec(code)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{code.slice(last, m.index)}</span>)
    const col = m[1] ? PY_COL.s : m[2] ? PY_COL.k : m[3] ? PY_COL.n : PY_COL.f
    out.push(<span key={key++} style={{ color: col }}>{m[0]}</span>)
    last = PY_RE.lastIndex
  }
  if (last < code.length) out.push(<span key={key++}>{code.slice(last)}</span>)
  return out
}

// ─── Resize handle ────────────────────────────────────────────────────────────
function ResizeHandle({ direction = 'horizontal' }) {
  const [hov, setHov] = useState(false)
  const isH = direction === 'horizontal'
  const lineStyle = isH
    ? { position:'absolute', top:0, bottom:0, left:'50%', width:1, transform:'translateX(-50%)' }
    : { position:'absolute', left:0, right:0, top:'50%', height:1, transform:'translateY(-50%)' }
  return (
    <PanelResizeHandle
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`relative flex items-center justify-center shrink-0 ${isH ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Divider line */}
      <div style={{
        ...lineStyle,
        backgroundColor: hov ? 'var(--accent)' : 'var(--border)',
        transition: 'background-color .15s',
      }} />
      {/* Grip knob */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: isH ? 'column' : 'row', gap: 3,
        padding: isH ? '5px 3px' : '3px 5px',
        borderRadius: 5,
        backgroundColor: hov ? 'var(--surface-2)' : 'var(--surface)',
        border: '1px solid',
        borderColor: hov ? 'var(--accent-border)' : 'var(--border)',
        transition: 'all .15s',
        boxShadow: hov ? '0 1px 4px rgba(0,0,0,.15)' : 'none',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 3, height: 3, borderRadius: '50%',
            backgroundColor: hov ? 'var(--accent)' : 'var(--text-subtle)',
            transition: 'background-color .15s',
          }} />
        ))}
      </div>
    </PanelResizeHandle>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text || '').then(() => { setOk(true); setTimeout(() => setOk(false), 1600) })}
      className="p-1.5 rounded transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.backgroundColor='var(--surface-2)' }}
      onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.backgroundColor='' }}
    >
      {ok ? <Check className="w-3.5 h-3.5" style={{ color:'#10b981' }} /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function SectionLabel({ children }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-subtle)' }}>{children}</p>
}

function Divider() {
  return <div className="border-t" style={{ borderColor: 'var(--border)' }} />
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExercisePage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { isDark: appDark } = useAppSettings()

  const idx = exercises.findIndex(e => e.id === id)
  const exercise = exercises[idx] ?? null
  const prev = idx > 0 ? exercises[idx - 1] : null
  const next = idx < exercises.length - 1 ? exercises[idx + 1] : null

  const { markExerciseComplete, isExerciseComplete, toggleBookmark, isBookmarked, saveNote, getNote } = useProgress()

  const [code, setCode]           = useState('')
  const [tab, setTab]             = useState('problem')
  const [outTab, setOutTab]       = useState('expected')
  const [showHints, setShowHints] = useState(false)
  const [hintIdx, setHintIdx]     = useState(0)
  const [showSol, setShowSol]     = useState(false)
  const [showExp, setShowExp]     = useState(false)
  const [showData, setShowData]   = useState(false)
  const [altSolTab, setAltSolTab] = useState('primary')
  const [result, setResult]       = useState(null)
  const [running, setRunning]     = useState(false)
  const [noteText, setNoteText]   = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [mounted, setMounted]     = useState(false)

  const noteSaveTimer = useRef(null)
  const submitRef     = useRef(null)

  const done      = exercise ? isExerciseComplete(exercise.id) : false
  const bookmarked= exercise ? isBookmarked(exercise.id) : false
  const hints     = exercise?.hints ?? []
  const revealed  = showHints ? hintIdx + 1 : 0
  const simOutput = exercise ? buildSimulatedOutput(exercise) : ''
  const isDark    = mounted ? appDark : true

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (exercise) setNoteText(getNote(exercise.id))
    setCode(''); setTab('problem'); setOutTab('expected')
    setShowHints(false); setHintIdx(0); setShowSol(false)
    setShowExp(false); setShowData(false); setResult(null)
    setRunning(false); setAltSolTab('primary'); setNoteSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = useCallback(() => {
    if (!code.trim()) return
    setRunning(true); setResult(null)
    setTimeout(() => {
      const r = checkAnswer(code, exercise.solution, exercise.alternativeSolutions || [])
      setResult(r); setRunning(false); setOutTab('result')
      if (r.status === 'correct' && !isExerciseComplete(exercise.id)) markExerciseComplete(exercise.id)
    }, 600)
  }, [code, exercise, isExerciseComplete, markExerciseComplete])

  useEffect(() => { submitRef.current = handleSubmit }, [handleSubmit])

  const handleNote = e => {
    setNoteText(e.target.value); setNoteSaved(false)
    clearTimeout(noteSaveTimer.current)
    noteSaveTimer.current = setTimeout(() => { saveNote(exercise.id, e.target.value); setNoteSaved(true) }, 800)
  }

  const revealNextHint = () => {
    if (!showHints) { setShowHints(true); setHintIdx(0) }
    else if (hintIdx < hints.length - 1) setHintIdx(i => i + 1)
  }

  // CodeMirror extensions — stable reference
  const cmExts = useMemo(() => [
    python(),
    cmAppTheme,
    cmFont,
    keymap.of([{ key: 'Mod-Enter', run: () => { submitRef.current?.(); return true } }]),
  ], [])

  const cmTheme = isDark ? vscodeDark : githubLight

  // Style shorthand
  const cv = {
    bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface-2)',
    border: 'var(--border)', borderSt: 'var(--border-strong)',
    text: 'var(--text)', muted: 'var(--text-muted)', subtle: 'var(--text-subtle)',
    accent: 'var(--accent)', accentL: 'var(--accent-light)', accentB: 'var(--accent-border)', accentT: 'var(--accent-text)',
  }
  const srf  = { backgroundColor: cv.surface }
  const srf2 = { backgroundColor: cv.surface2 }
  const bg_  = { backgroundColor: cv.bg }
  const brd  = { borderColor: cv.border }
  const txt  = { color: cv.text }
  const muted= { color: cv.muted }
  const subtle={color: cv.subtle }
  const acc  = { color: cv.accent }

  if (!exercise) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4" style={bg_}>
      <AlertCircle className="w-10 h-10" style={{ color:'#ef4444' }} />
      <h1 className="text-xl font-bold" style={txt}>Exercise not found</h1>
      <Link href="/practice" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: cv.accent }}>Back to Practice</Link>
    </div>
  )

  const cfg = result ? (STATUS_CFG[result.status] ?? STATUS_CFG.wrong) : null
  const Ico = cfg?.icon

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)', backgroundColor: cv.bg }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 h-10 border-b shrink-0" style={{ ...srf, ...brd }}>
        <Link href="/practice" className="flex items-center gap-1 text-xs transition-colors shrink-0" style={muted}
          onMouseEnter={e => e.currentTarget.style.color=cv.accent}
          onMouseLeave={e => e.currentTarget.style.color=cv.muted}>
          <ChevronLeft className="w-3.5 h-3.5" />Practice
        </Link>
        <span style={{ color:cv.borderSt }}>/</span>
        <span className="text-xs font-medium truncate flex-1" style={txt}>{exercise.title}</span>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={exercise.difficulty} size="sm">
            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
          </Badge>
          {done && <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold" style={{ color:'#10b981' }}><CheckCheck className="w-3.5 h-3.5" />Solved</span>}
        </div>

        <div className="flex items-center gap-0.5 ml-1">
          <button disabled={!prev} onClick={() => prev && router.push(`/practice/${prev.id}`)}
            className="p-1 rounded disabled:opacity-30 transition-all" style={muted}
            onMouseEnter={e => { if(prev){e.currentTarget.style.backgroundColor=cv.surface2;e.currentTarget.style.color=cv.text}}}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor='';e.currentTarget.style.color=cv.muted }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] tabular-nums px-1.5" style={subtle}>{idx+1}/{exercises.length}</span>
          <button disabled={!next} onClick={() => next && router.push(`/practice/${next.id}`)}
            className="p-1 rounded disabled:opacity-30 transition-all" style={muted}
            onMouseEnter={e => { if(next){e.currentTarget.style.backgroundColor=cv.surface2;e.currentTarget.style.color=cv.text}}}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor='';e.currentTarget.style.color=cv.muted }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main panels ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">

          {/* ── LEFT: Problem panel ──────────────────────────────────────── */}
          <Panel defaultSize="38" minSize="22" maxSize="52">
            <div className="h-full flex flex-col border-r" style={{ ...srf, ...brd }}>

              {/* Tabs */}
              <div className="flex border-b shrink-0" style={{ ...srf, ...brd }}>
                {[
                  { key:'problem', icon:FileText, label:'Problem' },
                  { key:'schema',  icon:Database, label:'Schema'  },
                  { key:'notes',   icon:Code2,    label:'Notes'   },
                ].map(({ key, icon:Icon, label }) => (
                  <button key={key} onClick={() => setTab(key)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all"
                    style={tab===key
                      ? { borderColor:cv.accent, color:cv.accent, backgroundColor:cv.accentL }
                      : { borderColor:'transparent', ...muted }}
                    onMouseEnter={e => { if(tab!==key){e.currentTarget.style.color=cv.text;e.currentTarget.style.backgroundColor=cv.surface2}}}
                    onMouseLeave={e => { if(tab!==key){e.currentTarget.style.color=cv.muted;e.currentTarget.style.backgroundColor=''}}}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>

              {/* ── PROBLEM TAB ── */}
              {tab==='problem' && (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">

                    {/* Title */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant={exercise.difficulty} size="sm">
                            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                          </Badge>
                          {exercise.topic && exercise.topic!=='all' && <Badge variant="default" size="sm">{exercise.topic}</Badge>}
                        </div>
                        <h1 className="text-base font-bold leading-snug" style={txt}>{exercise.title}</h1>
                        {exercise.description && (
                          <p className="text-[12px] mt-1.5 leading-relaxed" style={muted}>{exercise.description}</p>
                        )}
                      </div>
                      <button onClick={() => toggleBookmark(exercise.id)}
                        className="p-1.5 rounded-lg transition-all shrink-0 mt-0.5"
                        style={{ color: bookmarked ? '#f59e0b' : cv.muted }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(245,158,11,.12)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor=''}>
                        {bookmarked
                          ? <Bookmark className="w-4 h-4" style={{ fill:'#f59e0b',color:'#f59e0b' }} />
                          : <BookmarkPlus className="w-4 h-4" />}
                      </button>
                    </div>

                    <Divider />

                    {/* Task */}
                    <div>
                      <SectionLabel>Task</SectionLabel>
                      <p className="text-sm leading-relaxed" style={txt}>{exercise.problemStatement}</p>
                    </div>

                    {/* Expected result */}
                    {exercise.expectedResult && (
                      <div className="rounded-xl p-4 border" style={{ backgroundColor:cv.accentL, borderColor:cv.accentB, color:cv.accentT }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5">Expected Result</p>
                        <p className="text-[13px] leading-relaxed font-medium">{exercise.expectedResult}</p>
                      </div>
                    )}

                    {/* Sample data — collapsible */}
                    {exercise.sampleData && (
                      <div>
                        <button
                          onClick={() => setShowData(v => !v)}
                          className="flex items-center justify-between w-full group"
                        >
                          <SectionLabel>Sample Data</SectionLabel>
                          {showData
                            ? <ChevronUp className="w-3.5 h-3.5 mb-3" style={subtle} />
                            : <ChevronDown className="w-3.5 h-3.5 mb-3" style={subtle} />}
                        </button>
                        {showData && (
                          <div className="rounded-xl border overflow-hidden" style={{ ...bg_, ...brd }}>
                            <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ ...srf, ...brd }}>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor:'rgba(239,68,68,.6)' }} />
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor:'rgba(245,158,11,.6)' }} />
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor:'rgba(16,185,129,.6)' }} />
                                <span className="text-[10px] font-mono ml-1" style={subtle}>seed.py</span>
                              </div>
                              <CopyBtn text={exercise.sampleData} />
                            </div>
                            <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto" style={{ whiteSpace: 'pre', color: 'var(--text-muted)' }}>
                              <code>{pyHighlight(exercise.sampleData)}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {exercise.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {exercise.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded border text-[10px] font-medium" style={{ ...srf2, borderColor:cv.borderSt, ...muted }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <Divider />

                    {/* Hints */}
                    <div>
                      <SectionLabel>Hints</SectionLabel>
                      {showHints && hints.slice(0, revealed).map((hint, i) => (
                        <div key={i} className="flex gap-3 mb-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                            style={{ backgroundColor:'rgba(245,158,11,.15)', border:'1px solid rgba(245,158,11,.28)', color:'#f59e0b' }}>
                            {i+1}
                          </span>
                          <p className="text-[13px] leading-relaxed" style={{ color:'#f59e0b' }}>{hint}</p>
                        </div>
                      ))}
                      <button
                        onClick={revealNextHint}
                        disabled={showHints && revealed >= hints.length}
                        className="flex items-center gap-1.5 text-[12px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ color:'#f59e0b' }}>
                        <Lightbulb className="w-3.5 h-3.5" />
                        {!showHints ? 'Show first hint' : revealed < hints.length ? `Next hint (${revealed}/${hints.length})` : 'All hints shown'}
                      </button>
                    </div>

                    <Divider />

                    {/* Solution */}
                    <div>
                      <button onClick={() => setShowSol(v => !v)}
                        className="flex items-center gap-1.5 text-[12px] font-medium transition-colors mb-3" style={acc}>
                        {showSol ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showSol ? 'Hide solution' : 'View solution'}
                      </button>

                      {showSol && (
                        <div className="rounded-xl border overflow-hidden" style={{ ...bg_, borderColor:cv.accentB }}>
                          {exercise.alternativeSolutions?.length > 0 && (
                            <div className="flex border-b px-2 pt-1.5 gap-0.5" style={{ ...srf, ...brd }}>
                              {['primary', ...exercise.alternativeSolutions.map((_, i) => `alt-${i}`)].map((st, i) => (
                                <button key={st} onClick={() => setAltSolTab(st)}
                                  className="px-2.5 py-1 text-[10px] font-semibold rounded-t border-b-2 -mb-px transition-colors"
                                  style={altSolTab===st ? { borderColor:cv.accent, color:cv.accent } : { borderColor:'transparent', ...muted }}>
                                  {st==='primary' ? 'Primary' : `Alt ${i}`}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ ...srf, ...brd }}>
                            <span className="text-[10px] font-mono" style={subtle}>solution.py</span>
                            <CopyBtn text={altSolTab==='primary' ? exercise.solution : exercise.alternativeSolutions[parseInt(altSolTab.split('-')[1])]} />
                          </div>
                          <pre className="p-4 text-[12px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap" style={{ color:'#10b981' }}>
                            {altSolTab==='primary' ? exercise.solution : exercise.alternativeSolutions[parseInt(altSolTab.split('-')[1])]}
                          </pre>
                          {exercise.explanation && (
                            <div className="border-t" style={brd}>
                              <button onClick={() => setShowExp(v => !v)}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium w-full transition-colors" style={acc}>
                                <Eye className="w-3 h-3" />
                                {showExp ? 'Hide explanation' : 'Read explanation'}
                              </button>
                              {showExp && (
                                <p className="px-4 pb-4 text-[12px] leading-relaxed" style={muted}>{exercise.explanation}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mark complete */}
                    <button
                      onClick={() => markExerciseComplete(exercise.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={done
                        ? { backgroundColor:'rgba(16,185,129,.10)', border:'1px solid rgba(16,185,129,.28)', color:'#10b981', cursor:'default' }
                        : { backgroundColor:'#10b981', color:'white', border:'1px solid rgba(16,185,129,.3)', boxShadow:'0 1px 4px rgba(16,185,129,.25)' }}>
                      <CheckCircle className="w-4 h-4" />
                      {done ? 'Solved' : 'Mark as complete'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SCHEMA TAB ── */}
              {tab==='schema' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {exercise.schema ? (
                    <div className="rounded-xl border overflow-hidden" style={{ ...bg_, ...brd }}>
                      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ ...srf, ...brd }}>
                        <span className="text-[10px] font-mono" style={subtle}>models.py</span>
                        <CopyBtn text={exercise.schema} />
                      </div>
                      <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap" style={txt}>
                        {exercise.schema}
                      </pre>
                    </div>
                  ) : <p className="text-xs italic" style={subtle}>No schema for this exercise.</p>}
                </div>
              )}

              {/* ── NOTES TAB ── */}
              {tab==='notes' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <SectionLabel>My Notes</SectionLabel>
                    {noteSaved && (
                      <span className="flex items-center gap-1 text-[10px] font-medium mb-3" style={{ color:'#10b981' }}>
                        <CheckCircle className="w-3 h-3" />Saved
                      </span>
                    )}
                  </div>
                  <textarea
                    value={noteText} onChange={handleNote}
                    placeholder="Your thoughts, patterns to remember…"
                    rows={14}
                    className="w-full resize-none rounded-xl px-4 py-3 text-[12px] focus:outline-none leading-relaxed font-mono"
                    style={{ backgroundColor:cv.surface2, border:`1px solid ${cv.borderSt}`, color:cv.text, caretColor:cv.accent }}
                  />
                  <p className="text-[10px]" style={subtle}>Auto-saved to your browser</p>
                </div>
              )}
            </div>
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* ── RIGHT: Editor + Output ───────────────────────────────────── */}
          <Panel defaultSize="62" minSize="40">
            <PanelGroup direction="vertical" className="h-full">

              {/* Editor */}
              <Panel defaultSize="62" minSize="30">
                <div className="h-full flex flex-col" style={bg_}>

                  {/* Editor toolbar */}
                  <div className="flex items-center justify-between px-4 h-9 border-b shrink-0" style={{ ...srf, ...brd }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:'rgba(239,68,68,.55)' }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:'rgba(245,158,11,.55)' }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:'rgba(16,185,129,.55)' }} />
                      </div>
                      <span className="text-[10px] font-mono" style={subtle}>solution.py — Python</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <CopyBtn text={code} />
                      <button onClick={() => { setCode(''); setResult(null); setOutTab('expected') }}
                        title="Reset" className="p-1.5 rounded transition-colors" style={muted}
                        onMouseEnter={e => { e.currentTarget.style.color=cv.text;e.currentTarget.style.backgroundColor=cv.surface2 }}
                        onMouseLeave={e => { e.currentTarget.style.color=cv.muted;e.currentTarget.style.backgroundColor='' }}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CodeMirror */}
                  <div className="flex-1 overflow-hidden">
                    {mounted && (
                      <CodeMirror
                        value={code}
                        onChange={v => setCode(v)}
                        extensions={cmExts}
                        theme={cmTheme}
                        height="100%"
                        style={{ height:'100%' }}
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: false,
                          highlightActiveLine: true,
                          highlightSelectionMatches: true,
                          bracketMatching: true,
                          closeBrackets: true,
                          autocompletion: true,
                          indentOnInput: true,
                          tabSize: 4,
                          defaultKeymap: true,
                        }}
                        placeholder="# Write your Django ORM query here…"
                      />
                    )}
                  </div>

                  {/* Run bar */}
                  <div className="flex items-center gap-2.5 px-4 py-2.5 border-t shrink-0" style={{ ...srf, ...brd }}>
                    <button
                      onClick={handleSubmit}
                      disabled={!code.trim() || running}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      style={{ backgroundColor:'#10b981', boxShadow:'0 1px 6px rgba(16,185,129,.30)' }}
                      onMouseEnter={e => { if(!running&&code.trim()) e.currentTarget.style.backgroundColor='#059669' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor='#10b981' }}>
                      {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      {running ? 'Running…' : 'Run Tests'}
                    </button>

                    <button
                      onClick={revealNextHint}
                      disabled={showHints && revealed >= hints.length}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      style={{ color:'#f59e0b', backgroundColor:'rgba(245,158,11,.10)', border:'1px solid rgba(245,158,11,.25)' }}>
                      <Lightbulb className="w-3.5 h-3.5" />
                      {revealed > 0 ? `Hint (${revealed}/${hints.length})` : 'Hint'}
                    </button>

                    <div className="flex items-center gap-1 ml-auto text-[10px]" style={subtle}>
                      <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ ...srf2, borderColor:cv.borderSt }}>⌘</kbd>
                      <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ ...srf2, borderColor:cv.borderSt }}>↵</kbd>
                      <span>run</span>
                    </div>
                  </div>
                </div>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* Output */}
              <Panel defaultSize="38" minSize="18">
                <div className="h-full flex flex-col" style={{ ...bg_, borderTop:`1px solid ${cv.border}` }}>

                  {/* Output tabs */}
                  <div className="flex items-center border-b shrink-0" style={{ ...srf, ...brd }}>
                    {[
                      { key:'expected', label:'Expected Output', icon:Terminal },
                      { key:'result',   label:'Test Result',     icon:result ? cfg.icon : CheckCircle },
                    ].map(({ key, label, icon:Icon }) => (
                      <button key={key} onClick={() => setOutTab(key)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold border-b-2 transition-all"
                        style={outTab===key
                          ? { borderColor:cv.accent, color:cv.accent, backgroundColor:cv.accentL }
                          : { borderColor:'transparent', ...muted }}>
                        <Icon className="w-3.5 h-3.5" style={{ color:key==='result'&&result?cfg.color:undefined }} />
                        {label}
                        {key==='result' && result && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            style={{ backgroundColor:`${cfg.color}22`, color:cfg.color }}>
                            {result.score}/100
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="ml-auto px-3">
                      {running && <Loader2 className="w-3.5 h-3.5 animate-spin" style={subtle} />}
                    </div>
                  </div>

                  {/* Output content */}
                  <div className="flex-1 overflow-y-auto">

                    {outTab==='expected' && (
                      <div className="p-5 space-y-4 font-mono text-[12px]">
                        <div>
                          <p className="text-[9px] font-sans font-bold uppercase tracking-widest mb-2" style={subtle}>Django Shell</p>
                          <pre className="leading-relaxed whitespace-pre-wrap" style={{ color:'#10b981' }}>{simOutput}</pre>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-[9px] font-sans font-bold uppercase tracking-widest mb-2" style={subtle}>SQL Generated</p>
                          <pre className="leading-relaxed whitespace-pre-wrap text-[11px]" style={{ color:'#60a5fa' }}>
{`-- Approximate SQL\nSELECT * FROM "myapp_${(exercise.solution?.match(/(\w+)\.objects/)?.[1]||'model').toLowerCase()}"${exercise.solution?.includes('.filter(')?' \nWHERE -- filter conditions':''}\nLIMIT 21;`}
                          </pre>
                        </div>
                      </div>
                    )}

                    {outTab==='result' && (
                      <div className="p-5 space-y-4">
                        {!result ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Terminal className="w-6 h-6" style={{ color:cv.borderSt }} />
                            <p className="text-[12px]" style={subtle}>Run your code to see results</p>
                          </div>
                        ) : (
                          <>
                            {/* Status */}
                            <div className="flex items-start gap-3 p-4 rounded-xl border"
                              style={{ backgroundColor:cfg.bg, borderColor:cfg.border }}>
                              <Ico className="w-5 h-5 shrink-0 mt-0.5" style={{ color:cfg.color }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold" style={{ color:cfg.color }}>{cfg.label}</p>
                                <p className="text-[12px] mt-0.5 leading-snug" style={muted}>{result.feedback}</p>
                              </div>
                              <button onClick={() => setResult(null)} style={subtle}
                                onMouseEnter={e=>e.currentTarget.style.color=cv.text}
                                onMouseLeave={e=>e.currentTarget.style.color=cv.subtle}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Score bar */}
                            <div>
                              <div className="flex justify-between text-[10px] mb-1.5" style={subtle}>
                                <span>Score</span>
                                <span className="font-bold" style={txt}>{result.score}/100</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={srf2}>
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width:`${result.score}%`, backgroundColor:cfg.bar }} />
                              </div>
                            </div>

                            {/* Detail chips */}
                            {result.details && (
                              <div className="flex flex-wrap gap-1.5">
                                {[['modelMatch','Model'],['methodsMatch','Methods'],['argsMatch','Arguments']].map(([k,label]) =>
                                  result.details[k]!==undefined ? (
                                    <span key={k} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
                                      style={result.details[k]
                                        ? { backgroundColor:'rgba(16,185,129,.10)', color:'#10b981', borderColor:'rgba(16,185,129,.28)' }
                                        : { backgroundColor:'rgba(239,68,68,.10)', color:'#ef4444', borderColor:'rgba(239,68,68,.28)' }}>
                                      {result.details[k] ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                      {label}
                                    </span>
                                  ) : null
                                )}
                              </div>
                            )}

                            {/* Issues */}
                            {result.issues?.length > 0 && (
                              <ul className="space-y-1.5">
                                {result.issues.map((issue, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[12px]" style={muted}>
                                    <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor:cv.borderSt }} />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {result.status==='correct' && (
                              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                                style={{ backgroundColor:'rgba(16,185,129,.10)', borderColor:'rgba(16,185,129,.28)' }}>
                                <CheckCheck className="w-4 h-4 shrink-0" style={{ color:'#10b981' }} />
                                <p className="text-[12px] font-semibold" style={{ color:'#10b981' }}>Exercise marked as complete!</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
