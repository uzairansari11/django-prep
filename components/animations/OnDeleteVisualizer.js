'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Constants ─────────────────────────────────────────────────────────────────

const OPTIONS = [
  {
    key: 'CASCADE',
    label: 'CASCADE',
    color: 'rose',
    description: 'Deletes all related child rows when the parent is deleted.',
    summary: '"If parent dies, I die too"',
  },
  {
    key: 'PROTECT',
    label: 'PROTECT',
    color: 'amber',
    description: 'Blocks deletion if child rows still reference the parent.',
    summary: '"Parent cannot die while I exist"',
  },
  {
    key: 'SET_NULL',
    label: 'SET_NULL',
    color: 'sky',
    description: 'Sets the FK column to NULL when the parent is deleted.',
    summary: '"I become an orphan (null)"',
  },
  {
    key: 'SET_DEFAULT',
    label: 'SET_DEFAULT',
    color: 'yellow',
    description: 'Sets the FK to the default value (e.g. a sentinel author pk=2).',
    summary: '"I get a new default parent"',
  },
  {
    key: 'SET_FN',
    label: 'SET(fn)',
    color: 'violet',
    description: 'Calls a function at deletion time to resolve the new FK value.',
    summary: '"A function picks my new parent"',
  },
  {
    key: 'DO_NOTHING',
    label: 'DO_NOTHING',
    color: 'slate',
    description: 'Does nothing — leaves dangling FK references in the DB.',
    summary: '"Dangerous: dangling reference"',
  },
];

const INITIAL_AUTHORS = [
  { id: 1, name: 'J.K. Rowling' },
  { id: 2, name: 'George Orwell' },
];

const INITIAL_BOOKS = [
  { id: 1, title: 'Harry Potter', authorId: 1 },
  { id: 2, title: 'Chamber of Secrets', authorId: 1 },
  { id: 3, title: '1984', authorId: 2 },
  { id: 4, title: 'Animal Farm', authorId: 2 },
];

// ── Color maps ────────────────────────────────────────────────────────────────

const TAB_COLORS = {
  rose: {
    active: 'bg-rose-600 text-white border-rose-600',
    inactive: 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400',
  },
  amber: {
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400',
  },
  sky: {
    active: 'bg-sky-600 text-white border-sky-600',
    inactive: 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-sky-300 dark:hover:border-sky-700 hover:text-sky-600 dark:hover:text-sky-400',
  },
  yellow: {
    active: 'bg-yellow-500 text-white border-yellow-500',
    inactive: 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-yellow-300 dark:hover:border-yellow-700 hover:text-yellow-600 dark:hover:text-yellow-400',
  },
  violet: {
    active: 'bg-violet-600 text-white border-violet-600',
    inactive: 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400',
  },
  slate: {
    active: 'bg-slate-700 text-white border-slate-700 dark:bg-zinc-700 dark:border-zinc-600',
    inactive: 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
  },
};

const CELL_HIGHLIGHT = {
  CASCADE: null,
  PROTECT: null,
  SET_NULL: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  SET_DEFAULT: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  SET_FN: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  DO_NOTHING: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNewAuthorDisplay(option) {
  switch (option) {
    case 'SET_NULL': return 'NULL';
    case 'SET_DEFAULT': return '2 (default)';
    case 'SET_FN': return 'sentinel_user';
    case 'DO_NOTHING': return '1 (DANGLING!)';
    default: return null;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TableCell({ children, highlight, className = '' }) {
  return (
    <td className={`px-3 py-2.5 text-sm ${className}`}>
      <AnimatePresence mode="wait">
        {highlight ? (
          <motion.span
            key={String(children)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`inline-block px-2 py-0.5 rounded-md font-mono text-xs font-semibold ${highlight}`}
          >
            {children}
          </motion.span>
        ) : (
          <span key={String(children)}>{children}</span>
        )}
      </AnimatePresence>
    </td>
  );
}

function AuthorRow({ author, onDelete, isDeleted, isShaking, isAnimating }) {
  return (
    <AnimatePresence>
      {!isDeleted && (
        <motion.tr
          layout
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, height: 0, scaleY: 0.5, backgroundColor: '#fca5a5' }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          animate={isShaking ? {
            x: [0, -10, 10, -10, 10, -6, 6, 0],
            transition: { duration: 0.45, ease: 'easeInOut' },
          } : {}}
          className="border-b border-slate-100 dark:border-zinc-700/50"
        >
          <td className="px-3 py-2.5 text-sm font-mono text-slate-500 dark:text-zinc-400">{author.id}</td>
          <td className="px-3 py-2.5 text-sm text-slate-800 dark:text-zinc-200 font-medium">{author.name}</td>
          <td className="px-3 py-2.5">
            <button
              onClick={() => onDelete(author.id)}
              disabled={isAnimating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </td>
        </motion.tr>
      )}
    </AnimatePresence>
  );
}

function BookRow({ book, deletedAuthors, bookState, option }) {
  const isDeleted = bookState?.state === 'deleted';
  const newAuthorDisplay = bookState?.newValue ?? null;
  const highlight = newAuthorDisplay ? CELL_HIGHLIGHT[option] : null;

  return (
    <AnimatePresence>
      {!isDeleted && (
        <motion.tr
          layout
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, height: 0, scaleY: 0.5, backgroundColor: '#fca5a5' }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="border-b border-slate-100 dark:border-zinc-700/50"
        >
          <td className="px-3 py-2.5 text-sm font-mono text-slate-500 dark:text-zinc-400">{book.id}</td>
          <td className="px-3 py-2.5 text-sm text-slate-800 dark:text-zinc-200">{book.title}</td>
          <TableCell
            highlight={newAuthorDisplay ? highlight : null}
          >
            <span className="font-mono">{newAuthorDisplay ?? book.authorId}</span>
          </TableCell>
        </motion.tr>
      )}
    </AnimatePresence>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnDeleteVisualizer() {
  const [selectedOption, setSelectedOption] = useState('CASCADE');
  const [deletedAuthors, setDeletedAuthors] = useState(new Set());
  const [bookStates, setBookStates] = useState({});
  const [shakingAuthor, setShakingAuthor] = useState(null);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const activeOption = OPTIONS.find((o) => o.key === selectedOption);

  const handleDelete = useCallback((authorId) => {
    if (isAnimating) return;
    setError(null);
    setIsAnimating(true);

    const affectedBooks = INITIAL_BOOKS.filter((b) => b.authorId === authorId);

    if (selectedOption === 'PROTECT') {
      setShakingAuthor(authorId);
      setError(
        `ProtectedError: Cannot delete Author (pk=${authorId}) because ${affectedBooks.length} Book(s) still reference it via a protected ForeignKey. Reassign or delete those books first.`
      );
      setTimeout(() => {
        setShakingAuthor(null);
        setIsAnimating(false);
      }, 600);
      return;
    }

    if (selectedOption === 'CASCADE') {
      setDeletedAuthors((prev) => new Set([...prev, authorId]));
      setBookStates((prev) => {
        const next = { ...prev };
        affectedBooks.forEach((b) => { next[b.id] = { state: 'deleted' }; });
        return next;
      });
      setTimeout(() => setIsAnimating(false), 500);
      return;
    }

    const newValue = getNewAuthorDisplay(selectedOption);
    setDeletedAuthors((prev) => new Set([...prev, authorId]));
    setBookStates((prev) => {
      const next = { ...prev };
      affectedBooks.forEach((b) => {
        next[b.id] = { state: 'updated', newValue };
      });
      return next;
    });
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, selectedOption]);

  function handleReset() {
    setDeletedAuthors(new Set());
    setBookStates({});
    setError(null);
    setShakingAuthor(null);
    setIsAnimating(false);
  }

  function handleOptionChange(key) {
    handleReset();
    setSelectedOption(key);
  }

  const allAuthorsDeleted = INITIAL_AUTHORS.every((a) => deletedAuthors.has(a.id));

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-700 p-5 sm:p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">on_delete Visualizer</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Click Delete on an author to see what happens</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>

      {/* Option tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {OPTIONS.map((opt) => {
          const colors = TAB_COLORS[opt.color];
          const isActive = selectedOption === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleOptionChange(opt.key)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all duration-150 ${
                isActive ? colors.active : colors.inactive
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Active option description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedOption}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mb-5 p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
        >
          <div className="flex items-start gap-2.5">
            <code className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-md font-mono ${
              TAB_COLORS[activeOption.color].active
            }`}>
              {activeOption.label}
            </code>
            <div>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                {activeOption.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 italic">
                {activeOption.summary}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/60">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs font-mono text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Author table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-700">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold font-mono text-slate-600 dark:text-zinc-400">
              Author
            </span>
            <span className="ml-auto text-xs text-slate-400 dark:text-zinc-500">
              {INITIAL_AUTHORS.filter((a) => !deletedAuthors.has(a.id)).length} rows
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 font-mono">id</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 font-mono">name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400"></th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_AUTHORS.map((author) => (
                  <AuthorRow
                    key={author.id}
                    author={author}
                    onDelete={handleDelete}
                    isDeleted={deletedAuthors.has(author.id)}
                    isShaking={shakingAuthor === author.id}
                    isAnimating={isAnimating}
                  />
                ))}
                {allAuthorsDeleted && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                      (empty table)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Book table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-700">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold font-mono text-slate-600 dark:text-zinc-400">
              Book
            </span>
            <span className="ml-auto text-xs text-slate-400 dark:text-zinc-500">
              {INITIAL_BOOKS.filter((b) => bookStates[b.id]?.state !== 'deleted').length} rows
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 font-mono">id</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 font-mono">title</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 font-mono">author_id</th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_BOOKS.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    deletedAuthors={deletedAuthors}
                    bookState={bookStates[book.id]}
                    option={selectedOption}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DO_NOTHING warning */}
      <AnimatePresence>
        {selectedOption === 'DO_NOTHING' && Object.keys(bookStates).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
          >
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-slate-500 dark:text-zinc-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                <strong className="text-slate-800 dark:text-zinc-200">DO_NOTHING</strong>: The author row is gone but the books still hold the old <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded text-slate-800 dark:text-zinc-200">author_id</code>. Accessing <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded text-slate-800 dark:text-zinc-200">book.author</code> via the ORM will raise <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded text-slate-800 dark:text-zinc-200">Author.DoesNotExist</code>. Only use with <code className="font-mono bg-slate-200 dark:bg-zinc-800 px-1 rounded text-slate-800 dark:text-zinc-200">db_constraint=False</code> for intentionally denormalized data.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'Row deleted', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
          { label: 'Set to NULL', cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
          { label: 'Set to default', cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
          { label: 'Set by fn()', cls: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
          { label: 'Dangling ref', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
          { label: 'No change (PROTECT)', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.cls}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
