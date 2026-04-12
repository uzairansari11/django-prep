'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    id: 'all',
    code: 'qs = Book.objects.all()',
    status: 'lazy',
    statusLabel: 'NOT executed yet',
    statusIcon: '😴',
    statusColor: 'slate',
    explanation:
      'Creating a QuerySet does NOT hit the database. Django builds up a description of the query but waits to execute it. This is called lazy evaluation.',
    chain: 'Book.objects.all()',
  },
  {
    id: 'filter',
    code: ".filter(price__lt=20)",
    status: 'lazy',
    statusLabel: 'Still lazy...',
    statusIcon: '😴',
    statusColor: 'slate',
    explanation:
      'Chaining .filter() still does not query the database. Django just adds a WHERE clause to the pending SQL. The QuerySet is still un-evaluated.',
    chain: 'Book.objects.all().filter(price__lt=20)',
  },
  {
    id: 'order',
    code: ".order_by('title')",
    status: 'lazy',
    statusLabel: 'Still lazy...',
    statusIcon: '💤',
    statusColor: 'slate',
    explanation:
      'Even after chaining .order_by(), no SQL has been executed. Django accumulates all these method calls and will only send one optimised query when evaluation is forced.',
    chain: "Book.objects.all().filter(price__lt=20).order_by('title')",
  },
  {
    id: 'evaluate',
    code: '# Evaluating...',
    status: 'evaluating',
    statusLabel: 'Hitting the database!',
    statusIcon: '⚡',
    statusColor: 'amber',
    explanation:
      'Evaluation is triggered by: iterating (for book in qs), slicing (qs[0]), calling list(qs), len(qs), or bool(qs). Django NOW sends the SQL to the database.',
    chain: "list(Book.objects.all().filter(price__lt=20).order_by('title'))",
    sql: "SELECT * FROM book WHERE price < 20 ORDER BY title ASC",
  },
  {
    id: 'results',
    code: '# Results loaded',
    status: 'evaluated',
    statusLabel: 'Evaluated!',
    statusIcon: '✅',
    statusColor: 'emerald',
    explanation:
      'The results are now cached in the QuerySet. Iterating over it again will NOT hit the database a second time — Django reuses the cached result set.',
    chain: "list(Book.objects.all().filter(price__lt=20).order_by('title'))",
    results: ['<Book: Harry Potter (£9.99)>', '<Book: 1984 (£7.99)>', '<Book: Brave New World (£8.99)>'],
  },
];

const STATUS_COLORS = {
  slate: {
    bg: 'bg-slate-100 dark:bg-zinc-800/50',
    text: 'text-slate-600 dark:text-zinc-300',
    border: 'border-slate-200 dark:border-zinc-600',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-700/60',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700/60',
  },
};

export default function QuerysetEvaluation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [evaluated, setEvaluated] = useState(false);
  const [showDB, setShowDB] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const step = STEPS[currentStep];
  const isLastLazy = currentStep === 2;
  const isEvaluating = currentStep === 3;
  const isDone = currentStep === 4;

  function handleEvaluate() {
    setCurrentStep(3);
    setShowDB(true);
    if (!prefersReduced) {
      setTimeout(() => {
        setCurrentStep(4);
        setEvaluated(true);
        setShowDB(false);
      }, 1800);
    } else {
      setCurrentStep(4);
      setEvaluated(true);
      setShowDB(false);
    }
  }

  function handleReset() {
    setCurrentStep(0);
    setEvaluated(false);
    setShowDB(false);
  }

  const colors = STATUS_COLORS[step.statusColor];

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-700 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">QuerySet Lazy Evaluation</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Step through how Django defers database queries
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-100 underline transition-colors duration-150"
        >
          Reset
        </button>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                if (i <= currentStep || i <= 2) {
                  setCurrentStep(i);
                  if (i < 3) { setEvaluated(false); setShowDB(false); }
                }
              }}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all duration-200 ${
                i < currentStep
                  ? 'bg-emerald-500 text-white'
                  : i === currentStep
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-700'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
              }`}
            >
              {i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 transition-colors duration-300 ${i < currentStep ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* QuerySet chain builder */}
      <div className="mb-5">
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2 font-medium">Current QuerySet expression:</p>
        <div className="bg-slate-900 rounded-xl px-4 py-3 font-mono text-xs overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStep}
              initial={prefersReduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="text-emerald-300 whitespace-pre"
            >
              {step.chain}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Status badge */}
      <motion.div
        key={`status-${currentStep}`}
        initial={prefersReduced ? false : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-5 ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <span className="text-sm">{step.statusIcon}</span>
        {step.statusLabel}
      </motion.div>

      {/* Database animation during evaluation */}
      <AnimatePresence>
        {showDB && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-3 py-6 mb-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40"
          >
            <motion.div
              animate={prefersReduced ? {} : { rotateY: [0, 360] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="text-4xl"
            >
              🗄️
            </motion.div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Executing SQL query...</p>
            <div className="bg-amber-900 dark:bg-amber-950 rounded-lg px-4 py-2">
              <pre className="text-[10px] font-mono text-amber-300">{STEPS[3].sql}</pre>
            </div>
            {!prefersReduced && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2, ease: 'easeInOut' }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results display */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5"
          >
            <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-2">Results (cached in QuerySet):</p>
            <div className="bg-slate-900 rounded-xl p-3 space-y-1">
              {STEPS[4].results.map((result, i) => (
                <motion.div
                  key={result}
                  initial={prefersReduced ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: prefersReduced ? 0 : i * 0.15 }}
                  className="text-xs font-mono text-emerald-300"
                >
                  {result}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`exp-${currentStep}`}
          initial={prefersReduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 border border-slate-200 dark:border-zinc-700 mb-5"
        >
          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">{step.explanation}</p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-transparent dark:border-zinc-700"
        >
          ← Prev
        </button>

        {isLastLazy && !isDone && (
          <button
            onClick={handleEvaluate}
            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
          >
            ⚡ Evaluate QuerySet (hit the DB)
          </button>
        )}

        {!isLastLazy && !isDone && currentStep < 2 && (
          <button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            Next → Chain another method
          </button>
        )}

        {isDone && (
          <button
            onClick={handleReset}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
          >
            ↺ Start over
          </button>
        )}
      </div>
    </div>
  );
}
