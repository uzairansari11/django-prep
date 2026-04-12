'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_AUTHOR_DATA = [
  { id: 1, name: 'J.K. Rowling' },
  { id: 2, name: 'George Orwell' },
  { id: 3, name: 'Frank Herbert' },
];

const DEFAULT_BOOK_DATA = [
  { id: 1, title: 'Harry Potter', author_id: 1 },
  { id: 2, title: 'Chamber of Secrets', author_id: 1 },
  { id: 3, title: '1984', author_id: 2 },
  { id: 4, title: 'Animal Farm', author_id: 2 },
  { id: 5, title: 'Dune', author_id: 3 },
];

const DELETE_OPTIONS = [
  {
    key: 'CASCADE',
    label: 'CASCADE',
    color: 'rose',
    description: 'Deleting an Author also deletes all their Books automatically.',
    code: 'author = ForeignKey(Author, on_delete=models.CASCADE)',
  },
  {
    key: 'PROTECT',
    label: 'PROTECT',
    color: 'amber',
    description: 'Prevents deletion of an Author if they have any Books. Raises ProtectedError.',
    code: 'author = ForeignKey(Author, on_delete=models.PROTECT)',
  },
  {
    key: 'SET_NULL',
    label: 'SET_NULL',
    color: 'sky',
    description: 'Sets author_id to NULL on all related Books when the Author is deleted.',
    code: 'author = ForeignKey(Author, null=True, on_delete=models.SET_NULL)',
  },
];

const OPTION_COLORS = {
  rose: {
    btn: 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300',
    activeBtn: 'bg-rose-600 border-rose-600 text-white',
    highlight: 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700/60',
    badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  },
  amber: {
    btn: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    activeBtn: 'bg-amber-600 border-amber-600 text-white',
    highlight: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700/60',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  sky: {
    btn: 'bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300',
    activeBtn: 'bg-sky-600 border-sky-600 text-white',
    highlight: 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700/60',
    badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  },
};

export default function FKExplainer({
  authorData = DEFAULT_AUTHOR_DATA,
  bookData = DEFAULT_BOOK_DATA,
}) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeDeleteOption, setActiveDeleteOption] = useState(null);
  const [deletedAuthorId, setDeletedAuthorId] = useState(null);
  const [showError, setShowError] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const authorRefs = useRef({});
  const bookRefs = useRef({});
  const [lineCoords, setLineCoords] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  useEffect(() => {
    if (!selectedBook) { setLineCoords(null); return; }

    function calcLine() {
      const bookEl = bookRefs.current[selectedBook.id];
      const authorEl = authorRefs.current[selectedBook.author_id];
      const container = containerRef.current;
      if (!bookEl || !authorEl || !container) return;

      const cr = container.getBoundingClientRect();
      const br = bookEl.getBoundingClientRect();
      const ar = authorEl.getBoundingClientRect();

      setLineCoords({
        x1: br.left - cr.left,
        y1: br.top - cr.top + br.height / 2,
        x2: ar.right - cr.left,
        y2: ar.top - cr.top + ar.height / 2,
      });
    }

    calcLine();
    window.addEventListener('resize', calcLine);
    return () => window.removeEventListener('resize', calcLine);
  }, [selectedBook]);

  function handleDeleteAction(optKey) {
    setActiveDeleteOption(optKey);
    setSelectedBook(null);
    setLineCoords(null);
    setShowError(false);
    setDeletedAuthorId(null);

    // Simulate deleting the first author for demonstration
    const targetAuthorId = 1;

    if (optKey === 'PROTECT') {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } else {
      setDeletedAuthorId(targetAuthorId);
    }
  }

  function handleReset() {
    setActiveDeleteOption(null);
    setDeletedAuthorId(null);
    setSelectedBook(null);
    setLineCoords(null);
    setShowError(false);
  }

  const visibleAuthors = authorData.filter((a) =>
    activeDeleteOption === 'CASCADE' ? a.id !== deletedAuthorId : true,
  );

  function getBookAuthorId(book) {
    if (activeDeleteOption === 'SET_NULL' && book.author_id === deletedAuthorId) return null;
    return book.author_id;
  }

  function isBookDeleted(book) {
    return activeDeleteOption === 'CASCADE' && book.author_id === deletedAuthorId;
  }

  const activeOption = DELETE_OPTIONS.find((o) => o.key === activeDeleteOption);

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-700 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">ForeignKey Relationships</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Click a book row to trace the foreign key. Then try on_delete behaviors.
        </p>
      </div>

      {/* Tables */}
      <div ref={containerRef} className="relative">
        {/* SVG connection line */}
        {lineCoords && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 20, width: '100%', height: '100%', overflow: 'visible' }}
          >
            <motion.line
              x1={lineCoords.x1}
              y1={lineCoords.y1}
              x2={lineCoords.x2}
              y2={lineCoords.y2}
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeDasharray="6,3"
              initial={prefersReduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.circle
              cx={lineCoords.x2}
              cy={lineCoords.y2}
              r={5}
              fill="#6366f1"
              initial={prefersReduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            />
          </svg>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Author table */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700" style={{ zIndex: 10, position: 'relative' }}>
            <div className="bg-violet-600 dark:bg-violet-800 px-4 py-2">
              <span className="text-xs font-bold text-white font-mono">Author table</span>
            </div>
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-zinc-400">id</th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-zinc-400">name</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-950">
                <AnimatePresence>
                  {authorData.map((author) => {
                    const isDeleted = activeDeleteOption === 'CASCADE' && author.id === deletedAuthorId;
                    const isTarget = deletedAuthorId === author.id;
                    if (isDeleted) return null;

                    return (
                      <motion.tr
                        key={author.id}
                        ref={(el) => { authorRefs.current[author.id] = el; }}
                        initial={false}
                        exit={prefersReduced ? {} : { opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`border-t border-slate-100 dark:border-zinc-800 transition-all duration-200 ${
                          selectedBook?.author_id === author.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/30'
                            : isTarget && activeDeleteOption === 'SET_NULL'
                              ? 'bg-sky-50 dark:bg-sky-900/10'
                              : ''
                        }`}
                      >
                        <td className="px-3 py-2.5 text-slate-400 dark:text-zinc-500">{author.id}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-zinc-300 font-medium">{author.name}</td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Book table */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700" style={{ zIndex: 10, position: 'relative' }}>
            <div className="bg-indigo-600 dark:bg-indigo-800 px-4 py-2">
              <span className="text-xs font-bold text-white font-mono">Book table</span>
            </div>
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-zinc-400">id</th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-zinc-400">title</th>
                  <th className="px-3 py-2 text-left text-slate-500 dark:text-zinc-400">author_id</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-950">
                <AnimatePresence>
                  {bookData.map((book) => {
                    const deleted = isBookDeleted(book);
                    const authorIdDisplay = getBookAuthorId(book);
                    const isSelected = selectedBook?.id === book.id;
                    const isNulled = activeDeleteOption === 'SET_NULL' && book.author_id === deletedAuthorId;

                    if (deleted) return null;

                    return (
                      <motion.tr
                        key={book.id}
                        ref={(el) => { bookRefs.current[book.id] = el; }}
                        initial={false}
                        exit={prefersReduced ? {} : { opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.4 }}
                        onClick={() => {
                          if (activeDeleteOption) return;
                          setSelectedBook(isSelected ? null : book);
                        }}
                        className={`border-t border-slate-100 dark:border-zinc-800 transition-all duration-200 ${
                          activeDeleteOption ? '' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                        } ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                      >
                        <td className="px-3 py-2.5 text-slate-400 dark:text-zinc-500">{book.id}</td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-zinc-300">{book.title}</td>
                        <td className="px-3 py-2.5">
                          <motion.span
                            animate={
                              !prefersReduced && (isSelected || isNulled)
                                ? { scale: [1, 1.2, 1] }
                                : {}
                            }
                            transition={{ duration: 0.3 }}
                            className={`inline-block font-bold transition-colors duration-200 ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : isNulled
                                  ? 'text-sky-500 dark:text-sky-400'
                                  : 'text-slate-600 dark:text-zinc-400'
                            }`}
                          >
                            {authorIdDisplay === null ? 'NULL' : authorIdDisplay}
                          </motion.span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* on_delete options */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-3">
          Try on_delete behavior — deletes Author #1 (J.K. Rowling):
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DELETE_OPTIONS.map((opt) => {
            const c = OPTION_COLORS[opt.color];
            const isActive = activeDeleteOption === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleDeleteAction(opt.key)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                  isActive ? c.activeBtn : c.btn
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {activeDeleteOption && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              ↺ Reset
            </button>
          )}
        </div>

        {/* PROTECT error state */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 mb-3"
            >
              <span className="text-xl shrink-0">🚫</span>
              <div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">ProtectedError raised!</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
                  Cannot delete author — related books exist. Delete books first.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active option description */}
        <AnimatePresence>
          {activeOption && !showError && (
            <motion.div
              key={activeOption.key}
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-xl border ${OPTION_COLORS[activeOption.color].highlight}`}
            >
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-2">
                {activeOption.label} behavior applied:
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mb-3">{activeOption.description}</p>
              <pre className="bg-slate-900 rounded-lg px-3 py-2 text-[10px] font-mono text-emerald-300 overflow-x-auto">
                {activeOption.code}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
