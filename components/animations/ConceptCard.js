'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DIFFICULTY_COLORS = {
  green: {
    front: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700/60',
    glow: 'shadow-emerald-100 dark:shadow-emerald-900/30',
    label: 'Beginner',
  },
  yellow: {
    front: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-700/60',
    glow: 'shadow-amber-100 dark:shadow-amber-900/30',
    label: 'Intermediate',
  },
  red: {
    front: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-700/60',
    glow: 'shadow-rose-100 dark:shadow-rose-900/30',
    label: 'Advanced',
  },
};

const DEFAULT_FRONT = {
  title: 'QuerySet',
  icon: '🔍',
  description: 'A lazy collection of database objects',
  color: 'green',
};

const DEFAULT_BACK = {
  facts: [
    'Lazy — not executed until needed',
    'Chainable — filter, exclude, order_by',
    'Cached after first evaluation',
  ],
  code: 'qs = Book.objects.filter(price__lt=20)',
  tip: 'Think of it as a recipe, not the meal — the DB query only runs when you "eat" (iterate/evaluate) it.',
};

export default function ConceptCard({ front = DEFAULT_FRONT, back = DEFAULT_BACK }) {
  const [flipped, setFlipped] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const color = front.color || 'green';
  const colors = DIFFICULTY_COLORS[color] || DIFFICULTY_COLORS.green;

  return (
    <div
      className="relative w-full"
      style={{ perspective: prefersReduced ? 'none' : '1000px', minHeight: '220px' }}
    >
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: '100%',
          minHeight: '220px',
        }}
        animate={prefersReduced ? {} : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* FRONT */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className={`absolute inset-0 rounded-2xl overflow-hidden border-2 ${colors.border} shadow-lg ${colors.glow} ${prefersReduced && flipped ? 'hidden' : ''}`}
        >
          <div
            className={`h-full flex flex-col bg-gradient-to-br ${colors.front} p-6 cursor-pointer select-none`}
            onClick={() => setFlipped(true)}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{front.icon}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                {colors.label}
              </span>
            </div>

            <div className="mt-auto">
              <h3 className="text-xl font-bold text-white mb-2">{front.title}</h3>
              <p className="text-sm text-white/80 leading-relaxed">{front.description}</p>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-white/60 text-xs">
              <span>Tap to flip</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: prefersReduced ? 'none' : 'rotateY(180deg)',
          }}
          className={`absolute inset-0 rounded-2xl border-2 ${colors.border} bg-white dark:bg-slate-800 shadow-lg ${colors.glow} ${prefersReduced && !flipped ? 'hidden' : ''} transition-colors duration-200`}
        >
          <div className="h-full flex flex-col p-6 cursor-pointer select-none" onClick={() => setFlipped(false)}>
            {/* Back header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{front.title}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                Key Facts
              </span>
            </div>

            {/* Facts */}
            {back.facts?.length > 0 && (
              <ul className="space-y-2 mb-4">
                {back.facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
            )}

            {/* Code snippet */}
            {back.code && (
              <div className="bg-slate-900 rounded-lg px-3 py-2 mb-3">
                <pre className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap break-all">{back.code}</pre>
              </div>
            )}

            {/* Memory tip */}
            {back.tip && (
              <div className="mt-auto bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800/40">
                <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <span className="font-bold">Memory tip: </span>{back.tip}
                </p>
              </div>
            )}

            <div className="mt-3 flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
              <span>← Tap to flip back</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
