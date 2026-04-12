'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Simple tokenizer ────────────────────────────────────────────────────────
// Splits a line of Python/Django code into colored tokens.

const DJANGO_BUILTINS = new Set([
  'models', 'Model', 'QuerySet', 'Manager', 'Field', 'CharField', 'IntegerField',
  'TextField', 'BooleanField', 'DateField', 'DateTimeField', 'ForeignKey',
  'ManyToManyField', 'OneToOneField', 'CASCADE', 'SET_NULL', 'PROTECT',
  'objects', 'filter', 'exclude', 'get', 'all', 'create', 'update', 'delete',
  'save', 'annotate', 'aggregate', 'values', 'values_list', 'order_by',
  'select_related', 'prefetch_related', 'Q', 'F', 'Count', 'Sum', 'Avg',
  'Max', 'Min', 'Admin', 'ModelAdmin', 'register',
]);

const KEYWORDS = new Set([
  'def', 'class', 'return', 'import', 'from', 'as', 'if', 'elif', 'else',
  'for', 'while', 'in', 'not', 'and', 'or', 'is', 'lambda', 'with', 'try',
  'except', 'finally', 'raise', 'pass', 'break', 'continue', 'yield',
  'async', 'await', 'global', 'nonlocal', 'del',
]);

const BUILTINS = new Set([
  'True', 'False', 'None', 'print', 'len', 'range', 'type', 'isinstance',
  'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'bool', 'super',
  'self', 'cls', 'property', 'staticmethod', 'classmethod',
]);

function tokenizeLine(line) {
  const tokens = [];
  let i = 0;

  while (i < line.length) {
    // Comment
    if (line[i] === '#') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // Decorator
    if (line[i] === '@') {
      let j = i + 1;
      while (j < line.length && /[\w.]/.test(line[j])) j++;
      tokens.push({ type: 'decorator', value: line.slice(i, j) });
      i = j;
      continue;
    }

    // String: single-quoted, double-quoted, triple-quoted
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      if (line.slice(i, i + 3) === quote.repeat(3)) {
        j = i + 3;
        while (j < line.length && line.slice(j, j + 3) !== quote.repeat(3)) j++;
        j += 3;
      } else {
        while (j < line.length && line[j] !== quote) {
          if (line[j] === '\\') j++;
          j++;
        }
        j++;
      }
      tokens.push({ type: 'string', value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(line[i]) || (line[i] === '-' && /\d/.test(line[i + 1] ?? ''))) {
      let j = i + 1;
      while (j < line.length && /[\d._]/.test(line[j])) j++;
      tokens.push({ type: 'number', value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /\w/.test(line[j])) j++;
      const word = line.slice(i, j);
      let type = 'plain';
      if (KEYWORDS.has(word)) type = 'keyword';
      else if (word === 'self' || word === 'cls') type = 'self';
      else if (DJANGO_BUILTINS.has(word)) type = 'django';
      else if (BUILTINS.has(word)) type = 'builtin';
      else if (/^[A-Z]/.test(word)) type = 'class-name';
      tokens.push({ type, value: word });
      i = j;
      continue;
    }

    // Whitespace
    if (/\s/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /\s/.test(line[j])) j++;
      tokens.push({ type: 'plain', value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Operator / punctuation
    tokens.push({ type: 'operator', value: line[i] });
    i++;
  }

  return tokens;
}

const TOKEN_CLASSES = {
  keyword:    'text-rose-400',
  builtin:    'text-sky-400',
  self:       'text-sky-400',
  string:     'text-amber-300',
  comment:    'text-slate-500 italic',
  decorator:  'text-violet-400',
  number:     'text-yellow-400',
  operator:   'text-rose-300',
  'class-name': 'text-orange-400',
  django:     'text-emerald-400',
  plain:      '',
};

function HighlightedLine({ line }) {
  const tokens = useMemo(() => tokenizeLine(line), [line]);
  return (
    <>
      {tokens.map((tok, idx) => (
        <span key={idx} className={TOKEN_CLASSES[tok.type] ?? ''}>
          {tok.value}
        </span>
      ))}
    </>
  );
}

// ─── Main CodeBlock component ─────────────────────────────────────────────────

/**
 * @param {object}  props
 * @param {string}  props.code
 * @param {string}  [props.language='python']
 * @param {string}  [props.title]
 * @param {boolean} [props.showLineNumbers=false]
 * @param {string}  [props.className]
 */
export default function CodeBlock({
  code = '',
  language = 'python',
  title,
  showLineNumbers = false,
  className,
}) {
  const [copied, setCopied] = useState(false);

  const lines = code.trimEnd().split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div
      className={cn(
        'code-block rounded-xl overflow-hidden border border-slate-700/60 shadow-xl shadow-black/20',
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          {/* Traffic-light dots */}
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />

          {title && (
            <span className="ml-2 text-xs text-slate-400 font-mono">{title}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language label */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{language}</span>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy code"
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150',
              copied
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/40'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/40 hover:bg-slate-600/60 hover:text-slate-200'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <pre className="overflow-x-auto p-5 text-sm leading-relaxed font-mono bg-[#0d1117] text-slate-200">
        <code>
          {lines.map((line, index) => (
            <div key={index} className="table-row">
              {showLineNumbers && (
                <span
                  className="table-cell pr-5 text-right text-slate-600 select-none min-w-[2.5rem]"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
              )}
              <span className="table-cell">
                <HighlightedLine line={line} />
                {'\n'}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
