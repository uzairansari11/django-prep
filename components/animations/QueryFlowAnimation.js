'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_STEPS = [
  {
    id: 'python',
    label: 'Python Code',
    color: 'indigo',
    icon: '🐍',
    code: null, // filled from props
    description: 'You write Python',
  },
  {
    id: 'orm',
    label: 'Django ORM',
    color: 'violet',
    icon: '⚙️',
    code: 'Converts to SQL params',
    description: 'ORM translates',
  },
  {
    id: 'sql',
    label: 'SQL Query',
    color: 'sky',
    icon: '📄',
    code: null, // filled from props
    description: 'Raw SQL sent to DB',
  },
  {
    id: 'db',
    label: 'Database',
    color: 'emerald',
    icon: '🗄️',
    code: 'Executes query...',
    description: 'DB processes query',
  },
  {
    id: 'results',
    label: 'Results',
    color: 'amber',
    icon: '✅',
    code: null, // filled from props
    description: 'Python objects returned',
  },
];

const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-700/60',
    activeBorder: 'border-indigo-500 dark:border-indigo-400',
    glow: 'shadow-indigo-200 dark:shadow-indigo-900/50',
    label: 'text-indigo-700 dark:text-indigo-300',
    icon: 'bg-indigo-100 dark:bg-indigo-900/40',
    code: 'bg-indigo-900 dark:bg-indigo-950',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-700/60',
    activeBorder: 'border-violet-500 dark:border-violet-400',
    glow: 'shadow-violet-200 dark:shadow-violet-900/50',
    label: 'text-violet-700 dark:text-violet-300',
    icon: 'bg-violet-100 dark:bg-violet-900/40',
    code: 'bg-violet-900 dark:bg-violet-950',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-700/60',
    activeBorder: 'border-sky-500 dark:border-sky-400',
    glow: 'shadow-sky-200 dark:shadow-sky-900/50',
    label: 'text-sky-700 dark:text-sky-300',
    icon: 'bg-sky-100 dark:bg-sky-900/40',
    code: 'bg-sky-900 dark:bg-sky-950',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700/60',
    activeBorder: 'border-emerald-500 dark:border-emerald-400',
    glow: 'shadow-emerald-200 dark:shadow-emerald-900/50',
    label: 'text-emerald-700 dark:text-emerald-300',
    icon: 'bg-emerald-100 dark:bg-emerald-900/40',
    code: 'bg-emerald-900 dark:bg-emerald-950',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700/60',
    activeBorder: 'border-amber-500 dark:border-amber-400',
    glow: 'shadow-amber-200 dark:shadow-amber-900/50',
    label: 'text-amber-700 dark:text-amber-300',
    icon: 'bg-amber-100 dark:bg-amber-900/40',
    code: 'bg-amber-900 dark:bg-amber-950',
  },
};

function Connector({ active, reduced }) {
  return (
    <div className="flex items-center justify-center shrink-0 w-8 sm:w-12">
      <div className="relative flex items-center w-full">
        <div
          className={`h-0.5 flex-1 transition-colors duration-500 ${
            active ? 'bg-indigo-400 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
          style={
            !reduced && active
              ? {
                  backgroundImage:
                    'repeating-linear-gradient(90deg, currentColor 0, currentColor 6px, transparent 6px, transparent 12px)',
                  backgroundSize: '12px 1px',
                  animation: 'dash-flow 0.8s linear infinite',
                }
              : undefined
          }
        />
        <motion.span
          animate={!reduced && active ? { x: [0, 4, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          className={`text-sm ml-0.5 ${active ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`}
        >
          ›
        </motion.span>
      </div>
    </div>
  );
}

export default function QueryFlowAnimation({
  queryExample = 'Book.objects.filter(price__lt=20)',
  sqlExample = 'SELECT * FROM book WHERE price < 20',
  resultExample = '<QuerySet [<Book: Harry Potter>, ...]>',
}) {
  const [activeStep, setActiveStep] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const timerRefs = useRef([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const steps = DEFAULT_STEPS.map((s) => ({
    ...s,
    code:
      s.id === 'python'
        ? queryExample
        : s.id === 'sql'
          ? sqlExample
          : s.id === 'results'
            ? resultExample
            : s.code,
  }));

  function clearTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  function runAnimation() {
    if (animating) return;
    clearTimers();
    setActiveStep(-1);
    setAnimating(true);

    if (prefersReduced) {
      setActiveStep(steps.length - 1);
      setAnimating(false);
      return;
    }

    steps.forEach((_, i) => {
      const t = setTimeout(
        () => {
          setActiveStep(i);
          if (i === steps.length - 1) setAnimating(false);
        },
        400 + i * 400,
      );
      timerRefs.current.push(t);
    });
  }

  useEffect(() => {
    runAnimation();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Django ORM Query Flow</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            How your Python code becomes a database query
          </p>
        </div>
        <button
          onClick={runAnimation}
          disabled={animating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <motion.span
            animate={animating ? { rotate: 360 } : { rotate: 0 }}
            transition={animating ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
            className="inline-block"
          >
            ↺
          </motion.span>
          Replay
        </button>
      </div>

      {/* Flow steps — horizontal scroll on small screens */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const c = COLOR_MAP[step.color];
          const isActive = activeStep >= i;
          const isCurrent = activeStep === i;

          return (
            <div key={step.id} className="flex items-center gap-0 shrink-0">
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, x: -20 }}
                animate={isActive ? { opacity: 1, x: 0 } : prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`relative flex flex-col gap-2 w-36 sm:w-44 p-3 rounded-xl border-2 transition-all duration-300 ${
                  isActive
                    ? `${c.bg} ${c.activeBorder} ${isCurrent ? `shadow-lg ${c.glow}` : ''}`
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Pulse ring on current step */}
                {isCurrent && !prefersReduced && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl border-2 ${c.activeBorder}`}
                    animate={{ scale: [1, 1.04, 1], opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  />
                )}

                {/* Icon + label */}
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm shrink-0 ${
                      isActive ? c.icon : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    {step.icon}
                  </span>
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isActive ? c.label : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Code snippet */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <pre
                        className={`text-[10px] leading-relaxed font-mono rounded-lg px-2 py-1.5 text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all ${c.code}`}
                      >
                        {step.code}
                      </pre>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{step.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Connector arrow between steps */}
              {i < steps.length - 1 && <Connector active={activeStep > i} reduced={prefersReduced} />}
            </div>
          );
        })}
      </div>

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            animate={
              !prefersReduced && activeStep >= i
                ? { scale: [1, 1.3, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.3 }}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              activeStep >= i
                ? `bg-${step.color}-500`
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <style jsx global>{`
        @keyframes dash-flow {
          from { background-position: 0 0; }
          to { background-position: 24px 0; }
        }
      `}</style>
    </div>
  );
}
