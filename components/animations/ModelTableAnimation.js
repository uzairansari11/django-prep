'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_FIELDS = [
  { name: 'title', type: 'CharField', dbColumn: 'title', sampleValues: ['Harry Potter', 'Dune', '1984'] },
  { name: 'price', type: 'DecimalField', dbColumn: 'price', sampleValues: ['9.99', '14.99', '7.99'] },
  { name: 'published', type: 'DateField', dbColumn: 'published', sampleValues: ['1997-06-26', '1965-08-01', '1949-06-08'] },
  { name: 'in_stock', type: 'BooleanField', dbColumn: 'in_stock', sampleValues: ['True', 'True', 'False'] },
];

const TYPE_COLOR = {
  CharField: 'text-emerald-400',
  IntegerField: 'text-sky-400',
  DecimalField: 'text-sky-400',
  BooleanField: 'text-amber-400',
  DateField: 'text-violet-400',
  TextField: 'text-emerald-400',
  ForeignKey: 'text-rose-400',
  default: 'text-slate-400',
};

function getTypeColor(type) {
  return TYPE_COLOR[type] || TYPE_COLOR.default;
}

function buildCreateSQL(modelName, fields) {
  const cols = fields
    .map((f) => {
      const colType =
        f.type === 'CharField'
          ? 'VARCHAR(255)'
          : f.type === 'DecimalField'
            ? 'DECIMAL(10,2)'
            : f.type === 'BooleanField'
              ? 'BOOLEAN'
              : f.type === 'DateField'
                ? 'DATE'
                : f.type === 'TextField'
                  ? 'TEXT'
                  : f.type === 'IntegerField'
                    ? 'INTEGER'
                    : 'VARCHAR(255)';
      return `    ${f.dbColumn.toLowerCase()} ${colType} NOT NULL`;
    })
    .join(',\n');
  return `CREATE TABLE myapp_${modelName.toLowerCase()} (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n${cols}\n);`;
}

export default function ModelTableAnimation({ modelName = 'Book', fields = DEFAULT_FIELDS }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showSQL, setShowSQL] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  function runAnimation() {
    if (animating) return;
    setActiveIndex(-1);
    setAnimating(true);

    if (prefersReduced) {
      setActiveIndex(fields.length - 1);
      setAnimating(false);
      return;
    }

    fields.forEach((_, i) => {
      setTimeout(
        () => {
          setActiveIndex(i);
          if (i === fields.length - 1) setAnimating(false);
        },
        300 + i * 500,
      );
    });
  }

  useEffect(() => {
    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
  const createSQL = buildCreateSQL(modelName, fields);

  const isFieldActive = useCallback(
    (i) => {
      if (hoveredIndex !== null) return hoveredIndex === i;
      return activeIndex >= i;
    },
    [hoveredIndex, activeIndex],
  );

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-700 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Model → Database Table
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            How a Django model maps to a real database table
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSQL((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors border border-slate-200 dark:border-zinc-700"
          >
            {showSQL ? 'Hide' : 'Show'} SQL CREATE TABLE
          </button>
          <button
            onClick={runAnimation}
            disabled={animating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
          >
            ↺ Replay
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_48px_1fr] gap-4 lg:gap-0 items-start">
        {/* LEFT: Python model */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-black border-b border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-xs font-mono text-slate-400">models.py</span>
          </div>
          <pre className="bg-slate-900 p-4 text-xs font-mono leading-relaxed overflow-x-auto">
            <span className="text-violet-400">class </span>
            <span className="text-amber-400">{modelName}</span>
            <span className="text-slate-300">(models.Model):</span>
            {'\n'}
            {fields.map((field, i) => (
              <motion.span
                key={field.name}
                className={`block cursor-pointer transition-all duration-200 rounded px-1 -mx-1 ${
                  isFieldActive(i)
                    ? 'bg-indigo-500/10 border-l-2 border-indigo-400'
                    : 'border-l-2 border-transparent'
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                animate={
                  !prefersReduced && activeIndex === i && hoveredIndex === null
                    ? { backgroundColor: ['rgba(99,102,241,0.05)', 'rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)'] }
                    : {}
                }
                transition={{ duration: 0.6 }}
              >
                {'    '}
                <span className="text-sky-400">{field.name}</span>
                <span className="text-slate-300"> = models.</span>
                <span className={getTypeColor(field.type)}>{field.type}</span>
                <span className="text-slate-400">()</span>
              </motion.span>
            ))}
            {'\n'}
            {'    '}
            <span className="text-violet-400">class </span>
            <span className="text-amber-400">Meta</span>
            <span className="text-slate-300">:</span>
            {'\n'}
            {'        '}
            <span className="text-slate-500">...</span>
          </pre>
        </div>

        {/* CENTER: Connecting arrows */}
        <div className="hidden lg:flex flex-col items-center justify-start pt-16 gap-0">
          {fields.map((field, i) => (
            <motion.div
              key={field.name}
              className="flex items-center justify-center w-full"
              style={{ height: '26px' }}
            >
              <motion.div
                animate={
                  !prefersReduced && isFieldActive(i)
                    ? { scaleX: [0, 1], opacity: [0, 1] }
                    : {}
                }
                initial={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: prefersReduced ? 0 : 0.1 }}
                className={`h-0.5 w-full origin-left transition-colors duration-300 ${
                  isFieldActive(i)
                    ? 'bg-indigo-400 dark:bg-indigo-500'
                    : 'bg-slate-200 dark:bg-zinc-800'
                }`}
              />
              <span
                className={`text-sm shrink-0 transition-colors duration-300 ${
                  isFieldActive(i) ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'
                }`}
              >
                ›
              </span>
            </motion.div>
          ))}
        </div>

        {/* RIGHT: Database table */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-700 dark:bg-emerald-900 border-b border-emerald-600 dark:border-emerald-800">
            <span className="text-xs font-mono font-bold text-emerald-100">
              myapp_{modelName.toLowerCase()} table
            </span>
          </div>
          <div className="overflow-x-auto bg-white dark:bg-zinc-900">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-800">
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-zinc-400 font-semibold">id</th>
                  {fields.map((field, i) => (
                    <th
                      key={field.dbColumn}
                      className={`px-3 py-2 text-left font-semibold transition-all duration-200 cursor-pointer ${
                        isFieldActive(i)
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'text-slate-500 dark:text-zinc-400'
                      }`}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {field.dbColumn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((row) => (
                  <tr
                    key={row}
                    className="border-t border-slate-100 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-2 text-slate-400 dark:text-zinc-500">{row + 1}</td>
                    {fields.map((field, i) => (
                      <td
                        key={field.dbColumn}
                        className={`px-3 py-2 transition-all duration-200 ${
                          isFieldActive(i)
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                            : 'text-slate-600 dark:text-zinc-400'
                        }`}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {field.sampleValues?.[row] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SQL CREATE TABLE panel */}
      <AnimatePresence>
        {showSQL && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden mt-4"
          >
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-black border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400">SQL CREATE TABLE statement</span>
              </div>
              <pre className="bg-slate-900 p-4 text-xs font-mono text-sky-300 leading-relaxed overflow-x-auto whitespace-pre">
                {createSQL}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
