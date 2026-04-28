'use client';

import { useState, useCallback, useRef, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Lightbulb, Eye, EyeOff,
  Bookmark, BookmarkPlus, Play, AlertCircle, Loader2, Copy, Check, RotateCcw,
} from 'lucide-react';
import { python } from '@codemirror/lang-python';
import { keymap, EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { exercises } from '@/data/exercises';
import { useProgress } from '@/hooks/useProgress';
import Badge from '@/components/ui/Badge';
import { runOrm } from '@/lib/runOrm';
import { prewarmPyodide } from '@/lib/pyRuntime';
import { useAppSettings } from '@/hooks/useAppSettings';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

// ─── CodeMirror theming ─────────────────────────────────────────────────────
const cmAppTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: 'var(--bg)',
    borderRight: '1px solid var(--border)',
    color: 'var(--text-subtle)',
    minWidth: '36px',
  },
  '.cm-gutterElement': { padding: '0 8px 0 4px !important' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--surface-2)' },
  '.cm-activeLine': { backgroundColor: 'var(--surface-2)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '.cm-content': { caretColor: 'var(--accent)', padding: '12px 0' },
  '.cm-line': { padding: '0 14px' },
  '.cm-placeholder': { color: 'var(--text-subtle)' },
});

const cmFont = EditorView.theme({
  '.cm-content, .cm-gutters': {
    fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
    fontSize: '13px',
    lineHeight: '1.7',
  },
});

// ─── Simulated expected output ──────────────────────────────────────────────
// IMPORTANT: never include the user's solution here — only the result the
// query is expected to produce. Solution lives behind the "Reveal" toggle.
function buildSimulatedOutput(ex) {
  const sol = (ex.solution || '').trim();
  const expected = ex.expectedResult || '';
  if (sol.includes('.count()') || expected.toLowerCase().includes('count')) return `3`;
  if (sol.includes('.exists()')) return `True`;
  if (sol.includes('.values_list(') && sol.includes('flat=True'))
    return `<QuerySet ['Harry Potter', '1984', 'Dune']>`;
  if (sol.includes('.values('))
    return `<QuerySet [\n  {'id': 1, 'title': 'Harry Potter'},\n  {'id': 2, 'title': '1984'}\n]>`;
  if (sol.includes('.aggregate(')) {
    const m = sol.match(/\w+=/); const k = m ? m[0].slice(0, -1) : 'result';
    return `{'${k}': 12.99}`;
  }
  if (sol.includes('.annotate('))
    return `<QuerySet [\n  <Book: Harry Potter (count=5)>,\n  <Book: 1984 (count=3)>\n]>`;
  if (sol.includes('.first()') || sol.includes('.get(')) {
    const model = sol.match(/(\w+)\.objects/)?.[1] || 'Object';
    return `<${model}: ${model} object (1)>`;
  }
  if (sol.includes('.order_by('))
    return `<QuerySet [\n  <Book: Animal Farm>,\n  <Book: 1984>,\n  <Book: Harry Potter>\n]>`;
  if (sol.includes('.filter(') || sol.includes('.exclude(')) {
    const count = expected.match(/(\d+)\s+book/i)?.[1] || '2';
    const model = sol.match(/(\w+)\.objects/)?.[1] || 'Book';
    const rows = Array.from({ length: parseInt(count) || 2 }, (_, i) => `  <${model}: ${model} object (${i + 1})>`).join(',\n');
    return `<QuerySet [\n${rows}\n]>`;
  }
  const model = sol.match(/(\w+)\.objects/)?.[1] || 'Object';
  return `<QuerySet [\n  <${model}: ${model} object (1)>\n]>`;
}

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  correct: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)', label: 'All tests passed' },
  close:   { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)', label: 'Almost there' },
  partial: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)', label: 'Partial match' },
  wrong:   { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  label: 'Output differs' },
  error:   { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  label: 'Runtime error' },
  empty:   { color: 'var(--text-muted)', bg: 'var(--surface-2)', border: 'var(--border)', label: 'No answer' },
};

// ─── Resize handle ──────────────────────────────────────────────────────────
function ResizeHandle({ direction = 'horizontal' }) {
  const isH = direction === 'horizontal';
  return (
    <PanelResizeHandle
      className={`relative shrink-0 transition-colors duration-150 ${isH ? 'w-px cursor-col-resize hover:w-0.5' : 'h-px cursor-row-resize hover:h-0.5'}`}
      style={{ backgroundColor: 'var(--border)' }}
    />
  );
}

// ─── Tiny helpers ───────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(text || '').then(() => { setOk(true); setTimeout(() => setOk(false), 1400); })}
      title="Copy"
      className="p-1 rounded transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      {ok ? <Check className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function Section({ label, children, action }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        {action}
      </div>
      {children}
    </section>
  );
}

function PaneTabs({ tabs, value, onChange }) {
  return (
    <div className="flex items-center gap-1 px-3 h-9 border-b shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
      {tabs.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="px-2 py-1 text-[12px] font-medium rounded transition-colors duration-150"
            style={{
              color: active ? 'var(--text)' : 'var(--text-muted)',
              backgroundColor: active ? 'var(--surface-2)' : 'transparent',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ExercisePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { isDark: appDark } = useAppSettings();

  const idx = exercises.findIndex(e => e.id === id);
  const exercise = exercises[idx] ?? null;
  const prev = idx > 0 ? exercises[idx - 1] : null;
  const next = idx < exercises.length - 1 ? exercises[idx + 1] : null;

  const { markExerciseComplete, isExerciseComplete, toggleBookmark, isBookmarked, saveNote, getNote } = useProgress();

  const [code, setCode]           = useState('');
  const [problemTab, setProblemTab] = useState('problem'); // problem | schema | notes
  const [outputTab, setOutputTab]   = useState('expected'); // expected | result
  const [showHints, setShowHints] = useState(false);
  const [hintIdx, setHintIdx]     = useState(0);
  const [showSol, setShowSol]     = useState(false);
  const [result, setResult]       = useState(null);
  const [running, setRunning]     = useState(false);
  const [runStage, setRunStage]   = useState('');
  const [noteText, setNoteText]   = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [mobileTab, setMobileTab] = useState('problem');

  const noteSaveTimer = useRef(null);
  const submitRef     = useRef(null);

  const done       = mounted && exercise ? isExerciseComplete(exercise.id) : false;
  const bookmarked = mounted && exercise ? isBookmarked(exercise.id) : false;
  const hints      = exercise?.hints ?? [];
  const simOutput  = exercise ? buildSimulatedOutput(exercise) : '';
  const isDark     = mounted ? appDark : true;

  useEffect(() => {
    setMounted(true);
    // Kick off the Pyodide download as soon as the practice page mounts —
    // the user can read the problem while Python loads in the background.
    prewarmPyodide();
  }, []);

  useEffect(() => {
    if (exercise) setNoteText(getNote(exercise.id));
    setCode(''); setProblemTab('problem'); setOutputTab('expected');
    setShowHints(false); setHintIdx(0); setShowSol(false);
    setResult(null); setRunning(false); setNoteSaved(false);
    setMobileTab('problem');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!code.trim()) return;
    setRunning(true); setResult(null); setRunStage('Running…');
    try {
      const r = await runOrm({
        schema: exercise.schema,
        sampleData: exercise.sampleData,
        code,
        solution: exercise.solution,
        alternativeSolutions: exercise.alternativeSolutions || [],
      });
      setResult(r);
      if (r.status === 'correct' && !isExerciseComplete(exercise.id)) {
        markExerciseComplete(exercise.id);
      }
    } catch (e) {
      setResult({ status: 'error', error: e.message || 'Run failed.', feedback: 'Run failed.' });
    } finally {
      setRunning(false);
      setRunStage('');
      setOutputTab('result');
      setMobileTab('output');
    }
  }, [code, exercise, isExerciseComplete, markExerciseComplete]);

  useEffect(() => { submitRef.current = handleSubmit; }, [handleSubmit]);

  const handleNote = (e) => {
    setNoteText(e.target.value); setNoteSaved(false);
    clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(() => { saveNote(exercise.id, e.target.value); setNoteSaved(true); }, 800);
  };

  const revealNextHint = () => {
    if (!showHints) { setShowHints(true); setHintIdx(0); }
    else if (hintIdx < hints.length - 1) setHintIdx(i => i + 1);
  };

  const cmExts = useMemo(() => [
    python(),
    cmAppTheme,
    cmFont,
    keymap.of([{ key: 'Mod-Enter', run: () => { submitRef.current?.(); return true; } }]),
  ], []);
  const cmTheme = isDark ? vscodeDark : githubLight;

  if (!exercise) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <AlertCircle className="w-6 h-6" style={{ color: 'var(--danger)' }} />
      <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Exercise not found</h1>
      <Link
        href="/practice"
        className="px-3 py-1.5 rounded text-[13px] font-medium"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
      >
        Back to Practice
      </Link>
    </div>
  );

  const cfg = result ? STATUS_CFG[result.status] ?? STATUS_CFG.wrong : null;

  return (
    // Fill the parent main element exactly — main already deducts the
    // navbar (top) and bottom-nav padding (bottom). overflow-hidden keeps
    // the outer page-scroll container from scrolling; only the internal
    // panes scroll, so there's a single visible scrollbar at a time.
    <div className="flex flex-col overflow-hidden" style={{ height: '100%', backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 sm:px-6 h-12 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link
          href="/practice"
          className="flex items-center gap-1 text-[12px] shrink-0 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Practice
        </Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>{exercise.title}</span>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Badge variant={exercise.difficulty} size="sm">
            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
          </Badge>
          {done && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--success)' }}>
              <CheckCircle2 className="w-3 h-3" /> Solved
            </span>
          )}
          <button
            onClick={() => toggleBookmark(exercise.id)}
            className="p-1.5 rounded transition-colors"
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{ color: bookmarked ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {bookmarked ? <Bookmark className="w-3.5 h-3.5 fill-current" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          </button>
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            <button
              disabled={!prev}
              onClick={() => prev && router.push(`/practice/${prev.id}`)}
              className="p-1 rounded disabled:opacity-30 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] tabular-nums px-1" style={{ color: 'var(--text-subtle)' }}>
              {idx + 1}/{exercises.length}
            </span>
            <button
              disabled={!next}
              onClick={() => next && router.push(`/practice/${next.id}`)}
              className="p-1 rounded disabled:opacity-30 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex items-center border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        {[
          { key: 'problem', label: 'Problem' },
          { key: 'code',    label: 'Code' },
          { key: 'output',  label: 'Output' },
        ].map(({ key, label }) => {
          const active = mobileTab === key;
          return (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className="flex-1 py-2.5 text-[12px] font-medium border-b-2 transition-colors"
              style={{
                color: active ? 'var(--text)' : 'var(--text-muted)',
                borderColor: active ? 'var(--accent)' : 'transparent',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: 3-pane horizontal */}
        <div className="hidden md:flex h-full">
          <PanelGroup direction="horizontal" className="flex-1">
            <Panel defaultSize="32" minSize="20">
              <ProblemPane
                exercise={exercise}
                tab={problemTab}
                setTab={setProblemTab}
                hints={hints}
                showHints={showHints}
                hintIdx={hintIdx}
                onRevealHint={revealNextHint}
                showSol={showSol}
                onToggleSol={() => setShowSol(v => !v)}
                noteText={noteText}
                onNote={handleNote}
                noteSaved={noteSaved}
                done={done}
                onMarkComplete={() => markExerciseComplete(exercise.id)}
              />
            </Panel>
            <ResizeHandle />
            <Panel defaultSize="40" minSize="25">
              <CodePane
                code={code}
                setCode={setCode}
                cmTheme={cmTheme}
                cmExts={cmExts}
                running={running}
                onRun={handleSubmit}
              />
            </Panel>
            <ResizeHandle />
            <Panel defaultSize="28" minSize="20">
              <OutputPane
                tab={outputTab}
                setTab={setOutputTab}
                exercise={exercise}
                simOutput={simOutput}
                result={result}
                cfg={cfg}
              />
            </Panel>
          </PanelGroup>
        </div>

        {/* Mobile: stacked single-pane */}
        <div className="md:hidden h-full">
          {mobileTab === 'problem' && (
            <ProblemPane
              exercise={exercise}
              tab={problemTab}
              setTab={setProblemTab}
              hints={hints}
              showHints={showHints}
              hintIdx={hintIdx}
              onRevealHint={revealNextHint}
              showSol={showSol}
              onToggleSol={() => setShowSol(v => !v)}
              noteText={noteText}
              onNote={handleNote}
              noteSaved={noteSaved}
              done={done}
              onMarkComplete={() => markExerciseComplete(exercise.id)}
            />
          )}
          {mobileTab === 'code' && (
            <CodePane
              code={code}
              setCode={setCode}
              cmTheme={cmTheme}
              cmExts={cmExts}
              running={running}
              onRun={handleSubmit}
            />
          )}
          {mobileTab === 'output' && (
            <OutputPane
              tab={outputTab}
              setTab={setOutputTab}
              exercise={exercise}
              simOutput={simOutput}
              result={result}
              cfg={cfg}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Problem pane ───────────────────────────────────────────────────────────
function ProblemPane({
  exercise, tab, setTab, hints, showHints, hintIdx, onRevealHint, showSol, onToggleSol,
  noteText, onNote, noteSaved, done, onMarkComplete,
}) {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <PaneTabs
        tabs={[
          { key: 'problem', label: 'Problem' },
          { key: 'schema',  label: 'Schema' },
          { key: 'notes',   label: 'Notes' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {tab === 'problem' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[16px] font-semibold leading-snug mb-2" style={{ color: 'var(--text)' }}>
                {exercise.title}
              </h1>
              {exercise.description && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {exercise.description}
                </p>
              )}
            </div>

            <Section label="Task">
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>
                {exercise.problemStatement}
              </p>
            </Section>

            {exercise.expectedResult && (
              <Section label="Expected result">
                <div
                  className="text-[13px] leading-relaxed pl-3 border-l-2"
                  style={{ borderColor: 'var(--accent)', color: 'var(--text-muted)' }}
                >
                  {exercise.expectedResult}
                </div>
              </Section>
            )}

            {exercise.tags?.length > 0 && (
              <Section label="Tags">
                <div className="flex flex-wrap gap-1">
                  {exercise.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {hints.length > 0 && (
              <Section
                label={`Hints (${showHints ? hintIdx + 1 : 0}/${hints.length})`}
                action={
                  showHints && hintIdx < hints.length - 1 ? (
                    <button onClick={onRevealHint} className="text-[11px] hover:underline" style={{ color: 'var(--text-muted)' }}>
                      Next
                    </button>
                  ) : null
                }
              >
                {!showHints ? (
                  <button
                    onClick={onRevealHint}
                    className="inline-flex items-center gap-1.5 text-[12px] hover:underline"
                    style={{ color: 'var(--text)' }}
                  >
                    <Lightbulb className="w-3 h-3" /> Show first hint
                  </button>
                ) : (
                  <div className="space-y-2">
                    {hints.slice(0, hintIdx + 1).map((h, i) => (
                      <div
                        key={i}
                        className="text-[13px] leading-relaxed pl-3 border-l"
                        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                      >
                        <span className="text-[10px] font-semibold mr-2" style={{ color: 'var(--text-subtle)' }}>{i + 1}</span>
                        {h}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            <Section
              label="Solution"
              action={
                <button
                  onClick={onToggleSol}
                  className="inline-flex items-center gap-1 text-[11px] hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showSol ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Reveal</>}
                </button>
              }
            >
              {showSol && (
                <pre
                  className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto"
                  style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {exercise.solution}
                </pre>
              )}
            </Section>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={onMarkComplete}
                disabled={done}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-[13px] font-medium transition-colors disabled:cursor-default"
                style={done
                  ? { backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }
                  : { backgroundColor: 'var(--accent)', color: 'var(--bg)', border: '1px solid var(--accent)' }
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {done ? 'Completed' : 'Mark as complete'}
              </button>
            </div>
          </div>
        )}

        {tab === 'schema' && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Schema
            </p>
            {exercise.schema ? (
              <pre
                className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {exercise.schema}
              </pre>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--text-subtle)' }}>No schema for this exercise.</p>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Notes
              </p>
              <span className="text-[11px]" style={{ color: noteSaved ? 'var(--success)' : 'var(--text-subtle)' }}>
                {noteSaved ? 'Saved' : 'Auto-save'}
              </span>
            </div>
            <textarea
              value={noteText}
              onChange={onNote}
              placeholder="Notes for this exercise…"
              rows={14}
              className="w-full px-3 py-2 rounded text-[13px] resize-none font-mono focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text-subtle)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Code pane ──────────────────────────────────────────────────────────────
function CodePane({ code, setCode, cmTheme, cmExts, running, onRun }) {
  const canRun = code.trim().length > 0 && !running;
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <div
        className="flex items-center justify-between px-3 h-9 border-b shrink-0 gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>solution.py</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCode('')}
            disabled={!code}
            title="Clear"
            className="p-1 rounded disabled:opacity-30 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <CopyBtn text={code} />
          <button
            onClick={onRun}
            disabled={!canRun}
            className="ml-1 inline-flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {running ? 'Running' : 'Run'}
            <span className="hidden sm:inline ml-1 text-[10px] opacity-60">⌘↵</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={cmExts}
          theme={cmTheme}
          height="100%"
          placeholder="# Write your Django ORM query here…"
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLineGutter: true }}
        />
      </div>
    </div>
  );
}

// ─── Output pane ────────────────────────────────────────────────────────────
function OutputPane({ tab, setTab, exercise, simOutput, result, cfg }) {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <PaneTabs
        tabs={[
          { key: 'expected', label: 'Expected' },
          { key: 'result',   label: 'Test result' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'expected' && (
          <div className="space-y-5">
            <Section label="Django shell">
              <pre
                className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {simOutput}
              </pre>
            </Section>

            {exercise.expectedSql && (
              <Section label="Approximate SQL">
                <pre
                  className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre"
                  style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  {exercise.expectedSql}
                </pre>
              </Section>
            )}
          </div>
        )}

        {tab === 'result' && (
          <div className="space-y-4">
            {!result ? (
              <p className="text-[13px]" style={{ color: 'var(--text-subtle)' }}>
                Run your code to see test results.
              </p>
            ) : (
              <>
                <div
                  className="rounded p-3 flex items-start gap-2.5"
                  style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                    {result.feedback && (
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {result.feedback}
                      </p>
                    )}
                    {result.usedFallback && (
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-subtle)' }}>
                        Pattern check (Python runtime unavailable for this query).
                      </p>
                    )}
                  </div>
                </div>

                {result.error && result.status === 'error' && (
                  <Section label="Error">
                    <pre
                      className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap"
                      style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
                    >
                      {result.error}
                    </pre>
                  </Section>
                )}

                {result.actual && (
                  <Section label="Your output">
                    <pre
                      className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre"
                      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      {result.actual}
                    </pre>
                  </Section>
                )}

                {result.status === 'wrong' && result.expected && (
                  <Section label="Expected output">
                    <pre
                      className="rounded p-3 text-[12px] leading-relaxed font-mono overflow-x-auto whitespace-pre"
                      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      {result.expected}
                    </pre>
                  </Section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
