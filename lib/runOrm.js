/**
 * High-level test runner: executes user Django ORM code in Pyodide
 * against the exercise's schema + sample data, then compares the repr
 * output to the solution's repr output.
 *
 * The repr (rather than `==`) is the comparison surface because that's
 * what the user sees in the Django shell — `<QuerySet [...]>`, `True`,
 * `5`, `{'avg': 12.99}`, etc.
 *
 * Falls back to the AST-based answer checker on:
 *   • Pyodide load failure (offline, blocked CDN, etc.)
 *   • Schema/sample data raising an unsupported error
 *   • Either side failing to produce output
 */

import { getPyodide } from './pyRuntime';
import { checkAnswer } from './answerChecker';

/**
 * @typedef {Object} RunResult
 * @property {'correct'|'wrong'|'error'|'fallback'} status
 * @property {string} [actual]    repr output of user's code
 * @property {string} [expected]  repr output of solution
 * @property {string} [error]     human-readable error message
 * @property {string} [feedback]  one-line summary
 * @property {boolean} [usedFallback]
 */

/**
 * @param {Object} args
 * @param {string} args.schema       Python with model definitions
 * @param {string} args.sampleData   Python with `Author.objects.create(...)` calls etc.
 * @param {string} args.code         User's submitted Django ORM expression
 * @param {string} args.solution     Reference solution
 * @param {string[]} [args.alternativeSolutions]
 * @param {Object} [args.exercise]   Original exercise (used for AST-fallback)
 * @returns {Promise<RunResult>}
 */
export async function runOrm({
  schema,
  sampleData,
  code,
  solution,
  alternativeSolutions = [],
  exercise = null,
}) {
  const userCode = (code || '').trim();
  if (!userCode) {
    return { status: 'error', error: 'Write your query above and press Run.', feedback: 'No code submitted.' };
  }

  let pyodide;
  try {
    pyodide = await getPyodide();
  } catch (e) {
    return runAstFallback(code, solution, alternativeSolutions, `Couldn't load Python runtime: ${e.message}`);
  }

  // Bootstrap exercise environment once per call: reset DB, eval schema + fixtures.
  try {
    pyodide.runPython('_reset_db()');
    if (schema) pyodide.runPython(schema);
    if (sampleData) pyodide.runPython(sampleData);
  } catch (e) {
    return runAstFallback(code, solution, alternativeSolutions, `Exercise setup error: ${e.message}`);
  }

  // Snapshot the registry so user code can't permanently mutate it.
  pyodide.runPython('import copy as _copy; _SNAPSHOT = {k: list(v) for k, v in _REGISTRY.items()}');

  function restore() {
    pyodide.runPython('_REGISTRY.clear(); _REGISTRY.update({k: list(v) for k, v in _SNAPSHOT.items()})');
  }

  function evalLastExpr(src) {
    // Strip blank lines and Python comments, then split off the last logical line.
    const lines = src
      .split('\n')
      .map((l) => l.replace(/(^|\s)#.*$/, '').trimEnd())
      .filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      return { ok: false, error: 'No code to run.' };
    }
    const lastLine = lines.pop();
    const setup = lines.join('\n');

    // Detect simple top-level assignment: `name = expr`. If so, execute the
    // assignment and use the bound name as the expression to repr.
    const assignMatch = lastLine.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    let exprForRepr;
    let assignmentLine = null;
    if (assignMatch && !lastLine.includes('==')) {
      assignmentLine = lastLine;
      exprForRepr = assignMatch[1];
    } else {
      exprForRepr = lastLine;
    }

    const harness = [
      setup,
      assignmentLine || '',
      `__last__ = (${exprForRepr})`,
      `__repr__ = repr(__last__)`,
    ].join('\n');

    try {
      pyodide.runPython(harness);
      const out = pyodide.globals.get('__repr__');
      return { ok: true, output: String(out) };
    } catch (e) {
      return { ok: false, error: extractPyError(e) };
    }
  }

  // Run user's code
  const userRun = evalLastExpr(userCode);
  if (!userRun.ok) {
    restore();
    return {
      status: 'error',
      error: userRun.error,
      feedback: 'Your code raised an error.',
    };
  }

  // Restore DB state, run solution
  restore();
  const solutions = [solution, ...alternativeSolutions].filter(Boolean);
  let bestExpected = null;
  let solutionError = null;
  for (const sol of solutions) {
    const r = evalLastExpr(sol);
    if (r.ok) {
      bestExpected = r.output;
      // If user's output matches this solution's, short-circuit as correct
      if (normalize(userRun.output) === normalize(r.output)) {
        return {
          status: 'correct',
          actual: userRun.output,
          expected: r.output,
          feedback: 'All tests passed.',
        };
      }
    } else if (!solutionError) {
      solutionError = r.error;
    }
    restore();
  }

  if (!bestExpected) {
    return runAstFallback(
      code, solution, alternativeSolutions,
      `Couldn't evaluate the reference solution${solutionError ? `: ${solutionError}` : '.'}`
    );
  }

  return {
    status: 'wrong',
    actual: userRun.output,
    expected: bestExpected,
    feedback: 'Output differs from expected.',
  };
}

function normalize(s) {
  // Compare ignoring trailing whitespace and quote style differences.
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
}

function extractPyError(err) {
  const msg = err?.message || String(err);
  // Pyodide errors include a long traceback; grab the final line which is
  // usually `ExceptionType: message`.
  const lines = msg.split('\n').filter((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (/^[A-Z]\w*Error|^[A-Z]\w*Exception|^DoesNotExist/.test(trimmed)) {
      return trimmed;
    }
  }
  return lines[lines.length - 1] || msg;
}

function runAstFallback(code, solution, alternativeSolutions, why) {
  const ast = checkAnswer(code, solution, alternativeSolutions);
  return {
    status: ast.status === 'correct' ? 'correct' : ast.status === 'empty' ? 'error' : 'wrong',
    feedback: ast.feedback,
    error: why,
    usedFallback: true,
  };
}
