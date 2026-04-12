'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_MODELS = [
  { name: 'Author', fields: ['id', 'name', 'email'] },
  { name: 'Book', fields: ['id', 'title', 'price', 'author_id'] },
  { name: 'Tag', fields: ['id', 'name', 'slug'] },
  { name: 'Profile', fields: ['id', 'user_id', 'bio', 'avatar'] },
];

const DEFAULT_RELATIONSHIPS = [
  { from: 'Author', to: 'Book', type: 'fk', label: 'One Author → Many Books' },
  { from: 'Book', to: 'Tag', type: 'm2m', label: 'Book ↔ Tag (many to many)' },
  { from: 'Profile', to: 'Author', type: 'o2o', label: 'One Profile ↔ One Author' },
];

const REL_CONFIG = {
  fk: {
    label: 'FK',
    color: 'indigo',
    description: 'ForeignKey — many instances of this model can reference one of the other',
    lineStyle: 'solid',
    endMark: '→',
  },
  m2m: {
    label: 'M2M',
    color: 'violet',
    description: 'ManyToManyField — many records on both sides can relate to each other',
    lineStyle: 'dashed',
    endMark: '↔',
  },
  o2o: {
    label: '1:1',
    color: 'sky',
    description: 'OneToOneField — exactly one record on each side',
    lineStyle: 'solid',
    endMark: '1:1',
  },
};

const COLOR_CLASS = {
  indigo: {
    badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    line: '#6366f1',
    highlight: 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  },
  violet: {
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    line: '#8b5cf6',
    highlight: 'border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/20',
  },
  sky: {
    badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    line: '#0ea5e9',
    highlight: 'border-sky-400 dark:border-sky-500 bg-sky-50 dark:bg-sky-900/20',
  },
};

export default function RelationshipDiagram({ models = DEFAULT_MODELS, relationships = DEFAULT_RELATIONSHIPS }) {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedRel, setSelectedRel] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [modelPositions, setModelPositions] = useState({});
  const containerRef = useRef(null);
  const boxRefs = useRef({});

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const updatePositions = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = {};
    Object.entries(boxRefs.current).forEach(([name, el]) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pos[name] = {
        cx: rect.left - containerRect.left + rect.width / 2,
        cy: rect.top - containerRect.top + rect.height / 2,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        w: rect.width,
        h: rect.height,
      };
    });
    setModelPositions(pos);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const observer = new ResizeObserver(updatePositions);
    if (containerRef.current) observer.observe(containerRef.current);
    updatePositions();
    return () => observer.disconnect();
  }, [mounted, updatePositions]);

  function getRelationshipsForModel(name) {
    return relationships.filter((r) => r.from === name || r.to === name);
  }

  function isModelHighlighted(name) {
    if (selectedModel) {
      if (selectedModel === name) return true;
      return relationships.some(
        (r) => (r.from === selectedModel && r.to === name) || (r.to === selectedModel && r.from === name),
      );
    }
    if (selectedRel) {
      return selectedRel.from === name || selectedRel.to === name;
    }
    return false;
  }

  function drawLine(rel, index) {
    const from = modelPositions[rel.from];
    const to = modelPositions[rel.to];
    if (!from || !to) return null;

    const cfg = REL_CONFIG[rel.type];
    const colorCfg = COLOR_CLASS[cfg.color];
    const isHighlighted = selectedRel === rel || selectedModel === rel.from || selectedModel === rel.to;

    const x1 = from.cx;
    const y1 = from.cy;
    const x2 = to.cx;
    const y2 = to.cy;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const dashArray = cfg.lineStyle === 'dashed' ? '6,4' : undefined;
    const strokeColor = isHighlighted ? colorCfg.line : '#94a3b8';
    const strokeWidth = isHighlighted ? 2.5 : 1.5;

    return (
      <g key={index} style={{ cursor: 'pointer' }} onClick={() => setSelectedRel(selectedRel === rel ? null : rel)}>
        {/* Wider invisible hit area */}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={20} />
        <motion.line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          initial={prefersReduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 + index * 0.2, ease: 'easeOut' }}
        />
        {/* Relationship badge at midpoint */}
        <foreignObject x={midX - 20} y={midY - 12} width={40} height={24}>
          <div
            className={`flex items-center justify-center h-full rounded-full text-[9px] font-bold px-1.5 border ${
              isHighlighted
                ? `${colorCfg.badge} border-current`
                : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-600'
            }`}
          >
            {cfg.endMark}
          </div>
        </foreignObject>
      </g>
    );
  }

  const containerHeight = Math.max(300, models.length > 2 ? 380 : 260);

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-700 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Model Relationships</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Click a model or relationship line to explore
          </p>
        </div>
        {(selectedModel || selectedRel) && (
          <button
            onClick={() => { setSelectedModel(null); setSelectedRel(null); }}
            className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-slate-100 underline transition-colors duration-150"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(REL_CONFIG).map(([type, cfg]) => (
          <div key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${COLOR_CLASS[cfg.color].badge}`}>
            <span>{cfg.endMark}</span>
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Diagram */}
      <div ref={containerRef} className="relative" style={{ height: containerHeight }}>
        {/* SVG lines layer */}
        {mounted && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker id="arrow-indigo" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#6366f1" />
              </marker>
            </defs>
            {/* pointer-events on the group, not the svg */}
            <g style={{ pointerEvents: 'all' }}>
              {relationships.map((rel, i) => drawLine(rel, i))}
            </g>
          </svg>
        )}

        {/* Model boxes positioned in a grid-like layout */}
        <div
          className="absolute inset-0 grid gap-4"
          style={{
            gridTemplateColumns: models.length <= 2 ? '1fr 1fr' : models.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr',
            gridTemplateRows: models.length <= 3 ? '1fr' : '1fr 1fr',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {models.map((model, i) => {
            const highlighted = isModelHighlighted(model.name);
            const rels = getRelationshipsForModel(model.name);

            return (
              <motion.div
                key={model.name}
                ref={(el) => { boxRefs.current[model.name] = el; }}
                initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.12, ease: 'easeOut' }}
                onClick={() => setSelectedModel(selectedModel === model.name ? null : model.name)}
                className={`cursor-pointer rounded-xl border-2 transition-all duration-200 select-none ${
                  highlighted
                    ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40'
                    : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Model box header */}
                <div className={`px-3 py-2 rounded-t-[10px] border-b ${
                  highlighted
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700/60'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-600'
                }`}>
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    {model.name}
                  </div>
                </div>
                <div className="px-3 py-2 space-y-0.5">
                  {model.fields.map((field) => (
                    <div key={field} className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 pl-3.5">
                      {field}
                    </div>
                  ))}
                </div>
                {rels.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-3 pb-2">
                    {rels.map((r) => {
                      const cfg = REL_CONFIG[r.type];
                      return (
                        <span key={`${r.from}-${r.to}-${r.type}`} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${COLOR_CLASS[cfg.color].badge}`}>
                          {cfg.endMark} {r.from === model.name ? r.to : r.from}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tooltip for selected relationship */}
      <AnimatePresence>
        {selectedRel && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`mt-4 p-4 rounded-xl border-2 ${COLOR_CLASS[REL_CONFIG[selectedRel.type].color].highlight}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{REL_CONFIG[selectedRel.type].endMark}</span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {selectedRel.from} → {selectedRel.to}
                  <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_CLASS[REL_CONFIG[selectedRel.type].color].badge}`}>
                    {REL_CONFIG[selectedRel.type].label}
                  </span>
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">{selectedRel.label}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">{REL_CONFIG[selectedRel.type].description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model detail panel */}
      <AnimatePresence>
        {selectedModel && !selectedRel && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700/60"
          >
            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2">{selectedModel} relationships:</p>
            <div className="space-y-1.5">
              {getRelationshipsForModel(selectedModel).map((r) => {
                const cfg = REL_CONFIG[r.type];
                const other = r.from === selectedModel ? r.to : r.from;
                return (
                  <div key={`${r.from}-${r.to}`} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLOR_CLASS[cfg.color].badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-zinc-300">{selectedModel} {cfg.endMark} {other}</span>
                  </div>
                );
              })}
              {getRelationshipsForModel(selectedModel).length === 0 && (
                <p className="text-xs text-slate-500 dark:text-zinc-400">No direct relationships defined</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
