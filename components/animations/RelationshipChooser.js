'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Result definitions ─────────────────────────────────────────────────────────

const RESULTS = {
  onetone: {
    name: 'OneToOneField',
    color: 'purple',
    tagline: 'An extension of the parent object',
    examples: [
      'User ↔ UserProfile',
      'Author ↔ AuthorBio',
      'Company ↔ CompanySettings',
    ],
    code: `user = models.OneToOneField(\n    User, on_delete=models.CASCADE,\n    related_name='profile'\n)`,
    bgFrom: 'from-purple-50 dark:from-purple-950/40',
    border: 'border-purple-200 dark:border-purple-700/60',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    icon: '1:1',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
  },
  foreignkey: {
    name: 'ForeignKey',
    color: 'blue',
    tagline: 'Many children belong to one parent',
    examples: [
      'Book → Author (many books, one author)',
      'Comment → Post',
      'Order → Customer',
    ],
    code: `author = models.ForeignKey(\n    Author, on_delete=models.CASCADE,\n    related_name='books'\n)`,
    bgFrom: 'from-blue-50 dark:from-blue-950/40',
    border: 'border-blue-200 dark:border-blue-700/60',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: '1:N',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
  },
  m2m: {
    name: 'ManyToManyField',
    color: 'green',
    tagline: 'Many on both sides, no extra join data',
    examples: [
      'Article ↔ Tag',
      'Student ↔ Course',
      'Book ↔ Category',
    ],
    code: `tags = models.ManyToManyField(\n    Tag, related_name='articles', blank=True\n)`,
    bgFrom: 'from-emerald-50 dark:from-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-700/60',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: 'N:M',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
  },
  'm2m-through': {
    name: 'ManyToManyField + through=',
    color: 'orange',
    tagline: 'Many on both sides, WITH extra join data',
    examples: [
      'Order ↔ Product (via OrderItem with quantity)',
      'Student ↔ Course (via Enrollment with grade)',
      'Employee ↔ Project (via Assignment with role)',
    ],
    code: `products = models.ManyToManyField(\n    Product, through='OrderItem'\n)\n\nclass OrderItem(models.Model):\n    order = models.ForeignKey(Order, on_delete=models.CASCADE)\n    product = models.ForeignKey(Product, on_delete=models.CASCADE)\n    quantity = models.PositiveIntegerField()`,
    bgFrom: 'from-orange-50 dark:from-orange-950/40',
    border: 'border-orange-200 dark:border-orange-700/60',
    badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    icon: 'N:M+',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300',
  },
};

// ── Question definitions ───────────────────────────────────────────────────────

const QUESTIONS = {
  q1: {
    id: 'q1',
    text: 'Can ONE [A] have MULTIPLE [B]s?',
    hint: 'e.g. Can one Author have many Books?',
    answers: [
      { label: 'Yes — one A can have many Bs', next: 'q2b', display: 'Yes' },
      { label: 'No — exactly one B per A', next: 'q2a', display: 'No' },
    ],
  },
  q2a: {
    id: 'q2a',
    text: 'Does [B] exist independently without [A]?',
    hint: 'e.g. Can a UserProfile exist without a User?',
    answers: [
      { label: 'No — B only makes sense with A', next: 'onetone', display: 'No' },
      { label: 'Yes — B can exist on its own', next: 'onetone', display: 'Yes' },
    ],
  },
  q2b: {
    id: 'q2b',
    text: 'Can ONE [B] also have MULTIPLE [A]s? (reverse direction)',
    hint: 'e.g. Can one Tag apply to many Articles?',
    answers: [
      { label: 'Yes — many A relate to many B', next: 'q3', display: 'Yes' },
      { label: 'No — B belongs to only one A', next: 'foreignkey', display: 'No' },
    ],
  },
  q3: {
    id: 'q3',
    text: 'Does the relationship itself need extra data?',
    hint: 'e.g. quantity on an order line, grade on an enrollment, role on a project assignment',
    answers: [
      { label: 'Yes — extra data on the join', next: 'm2m-through', display: 'Yes' },
      { label: 'No — just the connection itself', next: 'm2m', display: 'No' },
    ],
  },
};

const RESULT_KEYS = new Set(['onetone', 'foreignkey', 'm2m', 'm2m-through']);

// ── Animation variants ─────────────────────────────────────────────────────────

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } },
};

const resultVariants = {
  initial: { opacity: 0, scale: 0.93, y: 30 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function BreadcrumbTrail({ answers }) {
  if (answers.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-5 min-h-[24px]">
      {answers.map((a, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-medium border border-slate-200 dark:border-zinc-600">
            {a}
          </span>
          {i < answers.length - 1 && (
            <span className="text-slate-300 dark:text-slate-600 text-xs">›</span>
          )}
        </span>
      ))}
    </div>
  );
}

function QuestionCard({ question, onAnswer }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <motion.div
      key={question.id}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 p-6 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-2">
        Decision question
      </p>
      <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-1 leading-snug">
        {question.text}
      </h3>
      {question.hint && (
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 italic">{question.hint}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {question.answers.map((ans, idx) => (
          <motion.button
            key={idx}
            onClick={() => onAnswer(ans)}
            onHoverStart={() => setHoveredIdx(idx)}
            onHoverEnd={() => setHoveredIdx(null)}
            whileTap={{ scale: 0.97 }}
            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${
              hoveredIdx === idx
                ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'border-slate-200 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}
          >
            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
              hoveredIdx === idx
                ? 'bg-indigo-100 dark:bg-indigo-800/60 text-indigo-600 dark:text-indigo-300'
                : 'bg-white dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
            }`}>
              {ans.display}
            </span>
            <span className="leading-tight">{ans.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ResultCard({ resultKey, onReset }) {
  const r = RESULTS[resultKey];
  if (!r) return null;

  return (
    <motion.div
      key="result"
      variants={resultVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`rounded-2xl border ${r.border} bg-gradient-to-br ${r.bgFrom} to-white dark:to-slate-800 p-6 shadow-sm`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
            Use this relationship
          </p>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${r.iconBg}`}>
              {r.icon}
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              {r.name}
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1.5 italic">{r.tagline}</p>
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
          className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${r.iconBg} border ${r.border}`}
        >
          {r.icon}
        </motion.div>
      </div>

      {/* Real-world examples */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5">
          Real-world examples
        </p>
        <ul className="space-y-1.5">
          {r.examples.map((ex, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-300"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${r.dot} shrink-0 mt-1.5`} />
              {ex}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Code snippet */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5">
          Django code
        </p>
        <pre className={`text-xs font-mono p-4 rounded-xl border ${r.border} bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre`}>
          {r.code}
        </pre>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-150"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Start Over
      </button>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RelationshipChooser() {
  const [step, setStep] = useState('q1');
  const [answers, setAnswers] = useState([]);

  const isResult = RESULT_KEYS.has(step);

  function handleAnswer(ans) {
    setAnswers((prev) => [...prev, ans.display]);
    setStep(ans.next);
  }

  function handleReset() {
    setStep('q1');
    setAnswers([]);
  }

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-700 p-5 sm:p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <svg className="w-[18px] h-[18px] text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Relationship Decision Tree</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Answer 2-3 questions to find the right field type</p>
        </div>
      </div>

      {/* Progress dots */}
      {!isResult && (
        <div className="flex items-center gap-1.5 mb-4">
          {['q1', 'q2a', 'q3'].map((q, i) => {
            const reached = answers.length > i;
            const current = step === q || (step === 'q2b' && i === 1);
            return (
              <div
                key={q}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  reached
                    ? 'bg-indigo-500 w-6'
                    : current
                    ? 'bg-indigo-300 dark:bg-indigo-600 w-6'
                    : 'bg-slate-200 dark:bg-zinc-800 w-4'
                }`}
              />
            );
          })}
          <span className="text-xs text-slate-400 dark:text-zinc-500 ml-1">
            Step {Math.min(answers.length + 1, 3)} of 3
          </span>
        </div>
      )}

      {/* Breadcrumb */}
      <BreadcrumbTrail answers={answers} />

      {/* Animated content */}
      <AnimatePresence mode="wait">
        {isResult ? (
          <ResultCard key={step} resultKey={step} onReset={handleReset} />
        ) : (
          <QuestionCard
            key={step}
            question={QUESTIONS[step]}
            onAnswer={handleAnswer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
