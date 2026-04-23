'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// ─── Shared card wrapper ────────────────────────────────────────────────────

function DiagramCard({ title, children }) {
  return (
    <div
      className="rounded-2xl p-6 border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mb-5">
        <p
          className="mb-1"
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-subtle)',
          }}
        >
          Visual Explanation
        </p>
        <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Arrow SVG ──────────────────────────────────────────────────────────────

function Arrow({ color = 'var(--border)' }) {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M0 8h22" stroke={color} strokeWidth="1.5" />
      <path d="M16 2l8 6-8 6" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. REQUEST PIPELINE DIAGRAM — django-project-flow
// ═══════════════════════════════════════════════════════════════════════════

const PIPELINE_NODES = [
  { id: 'browser-in', label: 'Browser', icon: '🌐', hint: 'HTTP Request' },
  { id: 'wsgi', label: 'WSGI', icon: '⚙️', hint: 'Entrypoint' },
  { id: 'middleware', label: 'Middleware', icon: '🔗', hint: 'Stack' },
  { id: 'url', label: 'URL Router', icon: '🗺️', hint: 'urls.py' },
  { id: 'view', label: 'View', icon: '👁️', hint: 'views.py' },
  { id: 'template', label: 'Template', icon: '📄', hint: 'HTML' },
  { id: 'response', label: 'Response', icon: '📬', hint: 'HttpResponse' },
  { id: 'browser-out', label: 'Browser', icon: '🌐', hint: 'Rendered' },
];

function RequestPipelineDiagram() {
  const [activeStep, setActiveStep] = useState(-1);
  const [phase, setPhase] = useState('request'); // 'request' | 'response'
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const TOTAL = PIPELINE_NODES.length;
  const CYCLE_MS = 600;

  useEffect(() => {
    if (paused) return;

    timerRef.current = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        if (next < TOTAL) {
          setPhase('request');
          return next;
        } else if (next < TOTAL * 2) {
          setPhase('response');
          return next;
        } else {
          return -1;
        }
      });
    }, CYCLE_MS);

    return () => clearInterval(timerRef.current);
  }, [paused, TOTAL]);

  function nodeIsActive(i) {
    if (phase === 'request') return activeStep === i;
    const ri = TOTAL * 2 - 1 - (activeStep - TOTAL);
    return ri === i;
  }

  function nodeIsPassed(i) {
    if (phase === 'request') return activeStep > i;
    const ri = TOTAL * 2 - 1 - (activeStep - TOTAL);
    return ri < i;
  }

  return (
    <DiagramCard title="Django Request → Response Pipeline">
      {/* Phase badge */}
      <div className="flex items-center gap-3 mb-5">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: phase === 'request' ? 'rgba(96,165,250,0.15)' : 'rgba(16,185,129,0.15)',
            color: phase === 'request' ? '#60a5fa' : '#10b981',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: phase === 'request' ? '#60a5fa' : '#10b981' }}
          />
          {phase === 'request' ? 'Request traveling →' : '← Response returning'}
        </span>

        <button
          onClick={() => setPaused((p) => !p)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Pipeline — scrollable on small screens */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-0 min-w-max">
          {PIPELINE_NODES.map((node, i) => {
            const active = nodeIsActive(i);
            const passed = nodeIsPassed(i);
            const reqColor = '#60a5fa';
            const resColor = '#10b981';
            const highlightColor = phase === 'request' ? reqColor : resColor;

            return (
              <div key={node.id} className="flex items-center gap-0">
                {/* Node box */}
                <motion.div
                  animate={{
                    borderColor: active ? highlightColor : passed ? `${highlightColor}55` : 'var(--border)',
                    backgroundColor: active ? `${highlightColor}18` : 'var(--surface-2)',
                    boxShadow: active ? `0 0 0 3px ${highlightColor}33` : 'none',
                  }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border cursor-default"
                  style={{ minWidth: 76 }}
                >
                  <span className="text-xl leading-none">{node.icon}</span>
                  <span
                    className="text-[11px] font-semibold text-center leading-tight"
                    style={{ color: active ? highlightColor : 'var(--text)' }}
                  >
                    {node.label}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>
                    {node.hint}
                  </span>

                  {/* Active packet dot */}
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                      className="w-2 h-2 rounded-full mt-0.5"
                      style={{ backgroundColor: highlightColor }}
                    />
                  )}
                </motion.div>

                {/* Arrow connector (not after last) */}
                {i < PIPELINE_NODES.length - 1 && (
                  <Arrow
                    color={
                      passed || active
                        ? phase === 'request'
                          ? '#60a5fa'
                          : '#10b981'
                        : 'var(--border)'
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs" style={{ color: 'var(--text-subtle)' }}>
        Click pause to inspect. Packet travels left→right (request) then right→left (response), looping every {((TOTAL * 2 * CYCLE_MS) / 1000).toFixed(1)}s.
      </p>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MIDDLEWARE STACK DIAGRAM — custom-middleware
// ═══════════════════════════════════════════════════════════════════════════

const MIDDLEWARE_LAYERS = [
  { name: 'SecurityMiddleware', hint: 'enforces HTTPS, sets security headers', color: '#ef4444' },
  { name: 'SessionMiddleware', hint: 'loads & saves session data', color: '#f59e0b' },
  { name: 'AuthenticationMiddleware', hint: 'populates request.user', color: '#60a5fa' },
  { name: 'CsrfViewMiddleware', hint: 'validates CSRF token on POST', color: '#10b981' },
  { name: 'MessageMiddleware', hint: 'enables flash message framework', color: '#a78bfa' },
  { name: 'YourCustomMiddleware', hint: 'add your cross-cutting logic here', color: 'var(--accent)' },
];

function MiddlewareStackDiagram() {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [direction, setDirection] = useState('down'); // 'down' | 'up'
  const [paused, setPaused] = useState(false);
  const N = MIDDLEWARE_LAYERS.length;

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        if (direction === 'down') {
          if (prev < N - 1) return prev + 1;
          setDirection('up');
          return prev;
        } else {
          if (prev > 0) return prev - 1;
          setDirection('down');
          return -1;
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [paused, direction, N]);

  return (
    <DiagramCard title="Django Middleware Stack">
      <div className="flex items-center gap-3 mb-5">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: direction === 'down' ? 'rgba(96,165,250,0.15)' : 'rgba(16,185,129,0.15)',
            color: direction === 'down' ? '#60a5fa' : '#10b981',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: direction === 'down' ? '#60a5fa' : '#10b981' }}
          />
          {direction === 'down' ? '↓ Request passing down' : '↑ Response bubbling up'}
        </span>
        <button
          onClick={() => setPaused((p) => !p)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      <div className="space-y-2">
        {MIDDLEWARE_LAYERS.map((layer, i) => {
          const isActive = activeIdx === i;
          const isPassed = direction === 'down' ? activeIdx > i : activeIdx < i;

          return (
            <motion.div
              key={layer.name}
              animate={{
                borderColor: isActive ? layer.color : isPassed ? `${layer.color}55` : 'var(--border)',
                backgroundColor: isActive ? `${layer.color}14` : 'var(--surface-2)',
                boxShadow: isActive ? `0 0 0 2px ${layer.color}33, 0 0 20px ${layer.color}22` : 'none',
              }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            >
              {/* Color swatch */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: isActive ? layer.color : isPassed ? `${layer.color}99` : 'var(--border)' }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono font-semibold"
                    style={{ color: isActive ? layer.color : 'var(--text)' }}
                  >
                    {layer.name}
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                      style={{ backgroundColor: layer.color, color: '#fff' }}
                    >
                      active
                    </motion.span>
                  )}
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                  {layer.hint}
                </span>
              </div>

              {/* Packet indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: 'var(--text-subtle)' }}>
        <span>SETTINGS_MIDDLEWARE order matters — top runs first on request, last on response.</span>
      </div>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. SIGNAL FLOW DIAGRAM — django-signals
// ═══════════════════════════════════════════════════════════════════════════

const SIGNAL_RECEIVERS = [
  { id: 'r1', label: 'send_welcome_email()', color: '#60a5fa' },
  { id: 'r2', label: 'create_user_profile()', color: '#10b981' },
  { id: 'r3', label: 'log_to_audit_trail()', color: '#f59e0b' },
  { id: 'r4', label: 'invalidate_cache()', color: '#a78bfa' },
];

function SignalFlowDiagram() {
  const [firing, setFiring] = useState(false);
  const [firedReceivers, setFiredReceivers] = useState([]);
  const [signalType, setSignalType] = useState('post_save');

  function fireSignal() {
    if (firing) return;
    setFiring(true);
    setFiredReceivers([]);

    SIGNAL_RECEIVERS.forEach((r, i) => {
      setTimeout(() => {
        setFiredReceivers((prev) => [...prev, r.id]);
        if (i === SIGNAL_RECEIVERS.length - 1) {
          setTimeout(() => {
            setFiring(false);
          }, 600);
        }
      }, 300 + i * 250);
    });
  }

  function resetSignal() {
    setFiring(false);
    setFiredReceivers([]);
  }

  return (
    <DiagramCard title="Django Signals — Publisher → Receiver Flow">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {['pre_save', 'post_save', 'post_delete'].map((sig) => (
          <button
            key={sig}
            onClick={() => { setSignalType(sig); resetSignal(); }}
            className="text-xs px-3 py-1.5 rounded-lg font-mono font-medium transition-all"
            style={{
              backgroundColor: signalType === sig ? 'var(--accent)' : 'var(--surface-2)',
              color: signalType === sig ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${signalType === sig ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {sig}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-6">
        {/* Sender */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <motion.div
            animate={firing ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0 0px var(--accent)', '0 0 0 8px transparent'] } : {}}
            transition={{ duration: 0.4, repeat: firing ? Infinity : 0 }}
            className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: firing ? 'var(--accent-light)' : 'var(--surface-2)',
              borderColor: firing ? 'var(--accent)' : 'var(--border)',
              minWidth: 110,
            }}
          >
            <span className="text-xl">📦</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>User Model</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-subtle)' }}>instance.save()</span>
          </motion.div>

          <button
            onClick={fireSignal}
            disabled={firing}
            className="text-xs px-4 py-2 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: firing ? 'var(--surface-2)' : 'var(--accent)',
              color: firing ? 'var(--text-muted)' : '#fff',
              border: '1px solid transparent',
              cursor: firing ? 'not-allowed' : 'pointer',
            }}
          >
            {firing ? '📡 Firing…' : '▶ Fire signal'}
          </button>
        </div>

        {/* Signal Hub */}
        <div className="flex flex-col items-center gap-1 shrink-0 mt-3">
          <motion.div
            animate={firing ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, repeat: firing ? Infinity : 0 }}
            className="px-3 py-2 rounded-xl border text-center"
            style={{
              backgroundColor: firing ? 'rgba(245,158,11,0.12)' : 'var(--surface-2)',
              borderColor: firing ? '#f59e0b' : 'var(--border)',
              minWidth: 90,
            }}
          >
            <div className="text-base mb-0.5">📡</div>
            <div className="text-[10px] font-mono font-bold" style={{ color: firing ? '#f59e0b' : 'var(--text)' }}>
              {signalType}
            </div>
            <div className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>Signal</div>
          </motion.div>

          {/* Ripple */}
          {firing && (
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute w-16 h-16 rounded-full"
              style={{ backgroundColor: '#f59e0b', pointerEvents: 'none' }}
            />
          )}
        </div>

        {/* Receivers */}
        <div className="flex-1 space-y-2">
          {SIGNAL_RECEIVERS.map((r, i) => {
            const fired = firedReceivers.includes(r.id);
            return (
              <motion.div
                key={r.id}
                animate={{
                  x: fired ? [0, -4, 0] : 0,
                  borderColor: fired ? r.color : 'var(--border)',
                  backgroundColor: fired ? `${r.color}14` : 'var(--surface-2)',
                }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-mono"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: fired ? r.color : 'var(--border)' }}
                />
                <span style={{ color: fired ? r.color : 'var(--text-muted)' }}>{r.label}</span>
                {fired && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto text-[9px] font-bold uppercase"
                    style={{ color: r.color }}
                  >
                    called ✓
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
        Each registered receiver is called synchronously in registration order. Use <code className="font-mono">dispatch_uid</code> to prevent duplicate registration.
      </p>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. QUERY CHAIN DIAGRAM — custom-managers-querysets
// ═══════════════════════════════════════════════════════════════════════════

const QUERY_STEPS = [
  { code: 'Book.objects', label: 'Manager', note: 'Default or custom manager' },
  { code: '.filter(price__lt=20)', label: 'filter()', note: 'Adds WHERE price < 20' },
  { code: '.exclude(is_available=False)', label: 'exclude()', note: 'Adds AND is_available = true' },
  { code: '.order_by("title")', label: 'order_by()', note: 'Adds ORDER BY title ASC' },
  { code: '.values("id", "title", "price")', label: 'values()', note: 'SELECT only these columns' },
];

const FINAL_SQL = `SELECT id, title, price
FROM books_book
WHERE price < 20
  AND is_available = true
ORDER BY title ASC;`;

function QueryChainDiagram() {
  const [visibleStep, setVisibleStep] = useState(0);
  const [showSQL, setShowSQL] = useState(false);

  function next() {
    if (visibleStep < QUERY_STEPS.length - 1) {
      setVisibleStep((v) => v + 1);
    } else {
      setShowSQL(true);
    }
  }

  function reset() {
    setVisibleStep(0);
    setShowSQL(false);
  }

  return (
    <DiagramCard title="ORM QuerySet Chain → SQL">
      <div className="space-y-2 mb-5">
        {QUERY_STEPS.map((step, i) => {
          if (i > visibleStep) return null;
          return (
            <motion.div
              key={step.code}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Connector line */}
              {i > 0 && (
                <div className="flex flex-col items-center">
                  <div className="w-px h-3" style={{ backgroundColor: 'var(--border)' }} />
                </div>
              )}

              <div
                className="flex items-start gap-3 flex-1 px-3 py-2.5 rounded-xl border"
                style={{
                  backgroundColor: i === visibleStep ? 'var(--accent-light)' : 'var(--surface-2)',
                  borderColor: i === visibleStep ? 'var(--accent-border)' : 'var(--border)',
                }}
              >
                <code
                  className="text-xs font-mono font-semibold flex-1"
                  style={{ color: i === visibleStep ? 'var(--accent-text)' : 'var(--text)' }}
                >
                  {step.code}
                </code>
                <span className="text-[10px] shrink-0 pt-0.5" style={{ color: 'var(--text-subtle)' }}>
                  {step.note}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SQL Output */}
      <AnimatePresence>
        {showSQL && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10b981' }}>
                Generated SQL
              </span>
            </div>
            <pre
              className="text-xs font-mono p-4 rounded-xl overflow-x-auto"
              style={{ backgroundColor: '#0d1117', color: '#a5d6ff', border: '1px solid #21262d', lineHeight: 1.7 }}
            >
              {FINAL_SQL}
            </pre>
            <p className="mt-2 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
              QuerySets are lazy — no DB hit until evaluation (iteration, list(), count(), etc.)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-5">
        {!showSQL && (
          <button
            onClick={next}
            className="text-sm px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {visibleStep < QUERY_STEPS.length - 1 ? `Next Step →` : 'Show SQL ↓'}
          </button>
        )}
        <button
          onClick={reset}
          className="text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Reset
        </button>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
          {visibleStep + 1} / {QUERY_STEPS.length} methods
        </span>
      </div>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADMIN LAYOUT DIAGRAM — django-admin-customization
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_PARTS = [
  {
    id: 'search',
    label: 'search_fields',
    desc: 'Defines which fields power the search bar (Q objects under the hood)',
    region: 'top',
  },
  {
    id: 'actions',
    label: 'actions',
    desc: 'Bulk operations shown in the dropdown — "delete selected", custom exports, etc.',
    region: 'top',
  },
  {
    id: 'list_display',
    label: 'list_display',
    desc: 'Columns shown in the changelist table — supports callables & model methods',
    region: 'table',
  },
  {
    id: 'list_filter',
    label: 'list_filter',
    desc: 'Right sidebar filter panels — ForeignKey filters create dynamic select options',
    region: 'sidebar',
  },
  {
    id: 'inlines',
    label: 'inlines',
    desc: 'Edit related objects inline inside the parent object change form',
    region: 'sidebar',
  },
];

function AdminLayoutDiagram() {
  const [hovered, setHovered] = useState(null);
  const active = ADMIN_PARTS.find((p) => p.id === hovered);

  const highlight = (id) => hovered === id;

  function RegionStyle(id) {
    return {
      border: `1px solid ${highlight(id) ? 'var(--accent)' : 'var(--border)'}`,
      backgroundColor: highlight(id) ? 'var(--accent-light)' : 'var(--surface-2)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    };
  }

  return (
    <DiagramCard title="Django Admin Interface — Interactive Map">
      <div className="flex gap-4 flex-col sm:flex-row">
        {/* Mock admin UI */}
        <div className="flex-1 min-w-0 space-y-2 text-xs font-mono">
          {/* Top bar */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-2 py-1.5 rounded-lg"
              style={RegionStyle('search')}
              onMouseEnter={() => setHovered('search')}
              onMouseLeave={() => setHovered(null)}
            >
              🔍 Search books…
            </div>
            <div
              className="px-2 py-1.5 rounded-lg"
              style={RegionStyle('actions')}
              onMouseEnter={() => setHovered('actions')}
              onMouseLeave={() => setHovered(null)}
            >
              Actions ▾
            </div>
          </div>

          {/* Table + sidebar */}
          <div className="flex gap-2">
            {/* Table */}
            <div
              className="flex-1 rounded-lg overflow-hidden"
              style={RegionStyle('list_display')}
              onMouseEnter={() => setHovered('list_display')}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="grid grid-cols-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-subtle)', borderBottom: '1px solid var(--border)' }}
              >
                <span>Title</span><span>Author</span><span>Price</span>
              </div>
              {[['Django ORM', 'A.User', '$19'], ['Pro Python', 'B.Dev', '$29'], ['SQL Deep Dive', 'C.Backend', '$24']].map(([t, a, p]) => (
                <div
                  key={t}
                  className="grid grid-cols-3 px-2 py-1.5 text-[10px] border-b"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  <span style={{ color: 'var(--accent)' }}>{t}</span>
                  <span>{a}</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>

            {/* Filter sidebar */}
            <div className="w-28 space-y-2">
              <div
                className="px-2 py-2 rounded-lg"
                style={RegionStyle('list_filter')}
                onMouseEnter={() => setHovered('list_filter')}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--text-subtle)' }}>Filter by</div>
                <div className="space-y-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  <div>● All</div>
                  <div>○ Available</div>
                  <div>○ Archive</div>
                </div>
              </div>
              <div
                className="px-2 py-2 rounded-lg"
                style={RegionStyle('inlines')}
                onMouseEnter={() => setHovered('inlines')}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="text-[9px] font-bold uppercase mb-1" style={{ color: 'var(--text-subtle)' }}>Inlines</div>
                <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  + Add Review<br />+ Add Tag
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="sm:w-48 shrink-0">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl border"
                style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-text)' }}>
                  {active.label}
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--accent-text)' }}>
                  {active.desc}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl border"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                  Hover over a region to learn what each part of ModelAdmin does.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. COMMAND FLOW DIAGRAM — management-commands
// ═══════════════════════════════════════════════════════════════════════════

const COMMAND_TEXT = 'python manage.py send_reminders --dry-run';
const STDOUT_LINES = [
  { text: 'Loading command: send_reminders', color: '#a8a29e' },
  { text: 'Calling BaseCommand.handle()', color: '#60a5fa' },
  { text: '  → dry_run=True detected', color: '#f59e0b' },
  { text: '  → 3 reminder emails would be sent', color: '#10b981' },
  { text: '✓ Done. (dry run — no emails sent)', color: '#10b981' },
];

function CommandFlowDiagram() {
  const [typedLen, setTypedLen] = useState(0);
  const [showHandle, setShowHandle] = useState(false);
  const [outputLines, setOutputLines] = useState([]);
  const [running, setRunning] = useState(false);

  function runCommand() {
    if (running) return;
    setRunning(true);
    setTypedLen(0);
    setShowHandle(false);
    setOutputLines([]);

    // Type out command
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTypedLen(i);
      if (i >= COMMAND_TEXT.length) {
        clearInterval(typer);
        setTimeout(() => setShowHandle(true), 300);
        STDOUT_LINES.forEach((line, idx) => {
          setTimeout(() => {
            setOutputLines((prev) => [...prev, line]);
            if (idx === STDOUT_LINES.length - 1) setRunning(false);
          }, 700 + idx * 350);
        });
      }
    }, 45);
  }

  function reset() {
    setRunning(false);
    setTypedLen(0);
    setShowHandle(false);
    setOutputLines([]);
  }

  return (
    <DiagramCard title="Management Command Execution Flow">
      {/* Terminal */}
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: '#21262d' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
          <span className="ml-2 text-[10px]" style={{ color: '#666' }}>zsh — manage.py</span>
        </div>

        <div className="p-4 space-y-1 font-mono text-xs" style={{ minHeight: 120 }}>
          {/* Prompt + command */}
          <div style={{ color: '#e6edf3' }}>
            <span style={{ color: '#10b981' }}>$ </span>
            <span>{COMMAND_TEXT.slice(0, typedLen)}</span>
            {typedLen < COMMAND_TEXT.length && typedLen > 0 && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ display: 'inline-block', width: 8, height: 14, backgroundColor: '#e6edf3', verticalAlign: 'text-bottom', marginLeft: 1 }}
              />
            )}
          </div>

          {/* Output lines */}
          {outputLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: line.color }}
            >
              {line.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* handle() method box */}
      <AnimatePresence>
        {showHandle && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 rounded-xl border mb-4"
            style={{ backgroundColor: 'rgba(96,165,250,0.08)', borderColor: '#60a5fa' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>
              BaseCommand.handle() invoked
            </div>
            <pre className="text-[11px] font-mono" style={{ color: '#a5d6ff' }}>
{`def handle(self, *args, **options):
    dry_run = options["dry_run"]
    # your logic here
    self.stdout.write("Done.")`}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          onClick={runCommand}
          disabled={running}
          className="text-sm px-4 py-2 rounded-xl font-semibold"
          style={{
            backgroundColor: running ? 'var(--surface-2)' : 'var(--accent)',
            color: running ? 'var(--text-muted)' : '#fff',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {typedLen === 0 ? '▶ Run Command' : running ? '⏳ Running…' : '▶ Run Again'}
        </button>
        <button
          onClick={reset}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Reset
        </button>
      </div>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. CACHE FLOW DIAGRAM — django-caching
// ═══════════════════════════════════════════════════════════════════════════

function CacheFlowDiagram() {
  const [scenario, setScenario] = useState('hit'); // 'hit' | 'miss'
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);

  const HIT_STEPS = [
    { label: 'Request', icon: '🌐', note: 'Incoming HTTP request' },
    { label: 'Cache.get(key)', icon: '⚡', note: 'Check cache backend', color: '#10b981' },
    { label: 'Cache HIT', icon: '✅', note: 'Data found in cache!', color: '#10b981' },
    { label: 'Response', icon: '📬', note: '~1ms — served instantly', color: '#10b981' },
  ];

  const MISS_STEPS = [
    { label: 'Request', icon: '🌐', note: 'Incoming HTTP request' },
    { label: 'Cache.get(key)', icon: '⚡', note: 'Check cache backend', color: '#f59e0b' },
    { label: 'Cache MISS', icon: '❌', note: 'Not in cache', color: '#ef4444' },
    { label: 'View + DB Query', icon: '🗄️', note: 'Execute slow query', color: '#f59e0b' },
    { label: 'Cache.set(key, val)', icon: '💾', note: 'Store result in cache', color: '#60a5fa' },
    { label: 'Response', icon: '📬', note: '~100ms — data fetched & cached', color: '#f59e0b' },
  ];

  const steps = scenario === 'hit' ? HIT_STEPS : MISS_STEPS;

  function runFlow() {
    if (running) return;
    setRunning(true);
    setStep(-1);

    steps.forEach((_, i) => {
      setTimeout(() => {
        setStep(i);
        if (i === steps.length - 1) {
          setTimeout(() => setRunning(false), 500);
        }
      }, i * 500);
    });
  }

  function reset() {
    setStep(-1);
    setRunning(false);
  }

  return (
    <DiagramCard title="Django Cache Flow — HIT vs MISS">
      {/* Toggle */}
      <div className="flex items-center gap-2 mb-5">
        {['hit', 'miss'].map((s) => (
          <button
            key={s}
            onClick={() => { setScenario(s); reset(); }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: scenario === s ? (s === 'hit' ? '#10b981' : '#ef4444') : 'var(--surface-2)',
              color: scenario === s ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${scenario === s ? (s === 'hit' ? '#10b981' : '#ef4444') : 'var(--border)'}`,
            }}
          >
            Cache {s === 'hit' ? '✅ HIT' : '❌ MISS'}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-5">
        {steps.map((s, i) => {
          const active = step === i;
          const passed = step > i;
          const nodeColor = s.color || 'var(--accent)';

          return (
            <div key={i} className="flex items-center gap-3">
              <motion.div
                animate={{
                  borderColor: active ? nodeColor : passed ? `${nodeColor}55` : 'var(--border)',
                  backgroundColor: active ? `${nodeColor}18` : 'var(--surface-2)',
                  boxShadow: active ? `0 0 0 3px ${nodeColor}28` : 'none',
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 flex-1 px-3 py-2.5 rounded-xl border"
              >
                <span className="text-base shrink-0">{s.icon}</span>
                <div>
                  <div className="text-xs font-semibold font-mono" style={{ color: active ? nodeColor : 'var(--text)' }}>
                    {s.label}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>{s.note}</div>
                </div>
                {active && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="ml-auto w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: nodeColor }}
                  />
                )}
              </motion.div>

              {i < steps.length - 1 && (
                <div
                  className="shrink-0 text-sm"
                  style={{ color: passed || active ? nodeColor : 'var(--border)' }}
                >
                  ↓
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={runFlow}
          disabled={running}
          className="text-sm px-4 py-2 rounded-xl font-semibold"
          style={{
            backgroundColor: running ? 'var(--surface-2)' : scenario === 'hit' ? '#10b981' : '#ef4444',
            color: running ? 'var(--text-muted)' : '#fff',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? '⏳ Animating…' : '▶ Animate'}
        </button>
        <button
          onClick={reset}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Reset
        </button>
      </div>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. AUTH FLOW DIAGRAM — django-auth-permissions
// ═══════════════════════════════════════════════════════════════════════════

const AUTH_STEPS = [
  { id: 'browser', label: 'Browser', icon: '🌐', note: 'POST /login/', color: '#60a5fa' },
  { id: 'form', label: 'Login Form', icon: '📝', note: 'AuthenticationForm validates fields', color: '#60a5fa' },
  { id: 'auth', label: 'authenticate()', icon: '🔐', note: 'Checks username + password against backend', color: '#f59e0b' },
  { id: 'login', label: 'login(request, user)', icon: '✅', note: 'Creates session, sets session cookie', color: '#10b981' },
  { id: 'cookie', label: 'Session Cookie', icon: '🍪', note: 'sessionid set on client — HttpOnly, Secure', color: '#10b981' },
  { id: 'request', label: 'Next Request', icon: '➡️', note: 'Cookie sent automatically by browser', color: '#a78bfa' },
  { id: 'user', label: 'request.user', icon: '👤', note: 'Populated by AuthenticationMiddleware', color: '#a78bfa' },
];

function AuthFlowDiagram() {
  const [activeStep, setActiveStep] = useState(-1);
  const [permCheck, setPermCheck] = useState(null); // null | 'allowed' | 'denied'
  const [running, setRunning] = useState(false);

  function runFlow() {
    if (running) return;
    setRunning(true);
    setActiveStep(-1);
    setPermCheck(null);

    AUTH_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setActiveStep(i);
        if (i === AUTH_STEPS.length - 1) {
          setTimeout(() => {
            setPermCheck('allowed');
            setRunning(false);
          }, 600);
        }
      }, i * 550);
    });
  }

  function reset() {
    setActiveStep(-1);
    setPermCheck(null);
    setRunning(false);
  }

  return (
    <DiagramCard title="Django Authentication & Permission Flow">
      <div className="flex gap-5 flex-col md:flex-row">
        {/* Left: Auth steps */}
        <div className="flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: 'var(--text-subtle)' }}>
            Login → Session Flow
          </p>
          {AUTH_STEPS.map((s, i) => {
            const active = activeStep === i;
            const passed = activeStep > i;

            return (
              <motion.div
                key={s.id}
                animate={{
                  borderColor: active ? s.color : passed ? `${s.color}44` : 'var(--border)',
                  backgroundColor: active ? `${s.color}12` : 'var(--surface-2)',
                  boxShadow: active ? `0 0 0 2px ${s.color}22` : 'none',
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
              >
                <span className="text-base shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs font-semibold font-mono"
                    style={{ color: active ? s.color : 'var(--text)' }}
                  >
                    {s.label}
                  </span>
                  <p className="text-[10px] leading-snug" style={{ color: 'var(--text-subtle)' }}>
                    {s.note}
                  </p>
                </div>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right: Permission check */}
        <div className="md:w-44 shrink-0 space-y-3">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-subtle)' }}>
            Permission Check
          </p>
          <div
            className="p-3 rounded-xl border text-xs font-mono"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <div style={{ color: '#d2a8ff' }}>user.has_perm(</div>
            <div className="pl-3" style={{ color: '#a5d6ff' }}>"books.add_book"</div>
            <div style={{ color: '#d2a8ff' }}>)</div>
          </div>

          <AnimatePresence mode="wait">
            {permCheck === 'allowed' && (
              <motion.div
                key="allowed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl border text-center"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }}
              >
                <div className="text-lg mb-1">✅</div>
                <div className="text-xs font-bold" style={{ color: '#10b981' }}>Allowed</div>
                <div className="text-[10px] mt-1" style={{ color: '#10b981' }}>View renders normally</div>
              </motion.div>
            )}
            {permCheck === 'denied' && (
              <motion.div
                key="denied"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl border text-center"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' }}
              >
                <div className="text-lg mb-1">🚫</div>
                <div className="text-xs font-bold" style={{ color: '#ef4444' }}>Denied</div>
                <div className="text-[10px] mt-1" style={{ color: '#ef4444' }}>403 PermissionDenied raised</div>
              </motion.div>
            )}
          </AnimatePresence>

          {permCheck === 'allowed' && (
            <button
              onClick={() => setPermCheck('denied')}
              className="w-full text-xs py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' }}
            >
              Simulate deny →
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={runFlow}
          disabled={running}
          className="text-sm px-4 py-2 rounded-xl font-semibold"
          style={{
            backgroundColor: running ? 'var(--surface-2)' : 'var(--accent)',
            color: running ? 'var(--text-muted)' : '#fff',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? '⏳ Animating…' : '▶ Simulate Login'}
        </button>
        <button
          onClick={reset}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Reset
        </button>
      </div>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIAGRAM MAP — topicId → component
// ═══════════════════════════════════════════════════════════════════════════

const DIAGRAM_MAP = {
  'django-project-flow': RequestPipelineDiagram,
  'custom-middleware': MiddlewareStackDiagram,
  'django-signals': SignalFlowDiagram,
  'custom-managers-querysets': QueryChainDiagram,
  'django-admin-customization': AdminLayoutDiagram,
  'management-commands': CommandFlowDiagram,
  'django-caching': CacheFlowDiagram,
  'django-auth-permissions': AuthFlowDiagram,
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function DiagramVisual({ topicId }) {
  const Diagram = DIAGRAM_MAP[topicId];
  if (!Diagram) return null;
  return <Diagram />;
}
