/**
 * Django ORM answer checker — AST-based using acorn.
 *
 * Django ORM queries are syntactically near-identical to JavaScript method chains.
 * After converting Python literals (True/False/None → true/false/null),
 * acorn can parse them into a proper ESTree AST for accurate structural comparison.
 */
import * as acorn from 'acorn'

// ─── Preprocessing ─────────────────────────────────────────────────────────────

function preprocessQuery(src) {
  return (src || '')
    .split('\n')
    .map((line) => {
      // Strip Python inline comments and trailing whitespace
      return line.replace(/#.*$/, '').trimEnd()
    })
    .filter((line) => {
      const t = line.trim()
      // Drop blank lines and import statements
      return t.length > 0 && !t.startsWith('import ') && !t.startsWith('from ')
    })
    .join('\n')
    .trim()
    // Python literals → JS equivalents
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
}

// ─── Acorn parsing ─────────────────────────────────────────────────────────────

function parseJs(src) {
  try {
    return acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script' })
  } catch {
    return null
  }
}

// Walk the Program body to find the main ORM CallExpression.
// Handles:  Model.objects.filter(...)       (bare expression)
//           result = Model.objects.all()    (assignment)
function findOrmNode(program) {
  for (const stmt of program.body) {
    if (stmt.type !== 'ExpressionStatement') continue
    const expr = stmt.expression

    if (isOrmCall(expr)) return expr

    // variable = Model.objects...
    if (expr.type === 'AssignmentExpression' && isOrmCall(expr.right)) {
      return expr.right
    }
  }
  return null
}

// A node "looks like" an ORM call if it eventually has `.objects.` in the chain.
function isOrmCall(node) {
  if (!node || node.type !== 'CallExpression') return false
  let cur = node
  while (cur) {
    if (cur.type === 'MemberExpression') {
      if (cur.property?.name === 'objects') return true
      cur = cur.object
    } else if (cur.type === 'CallExpression') {
      cur = cur.callee?.object ?? cur.callee
    } else {
      break
    }
  }
  return false
}

// ─── Chain extraction ──────────────────────────────────────────────────────────

/**
 * Converts an acorn CallExpression into a structured chain:
 * { model: string, chain: [{ method, args: SerializedArg[] }] }
 */
function extractChain(callNode) {
  const chain = []
  let cur = callNode

  // Walk leftward through the nested CallExpression → MemberExpression tree
  while (cur && cur.type === 'CallExpression') {
    if (cur.callee?.type !== 'MemberExpression') break
    const method = cur.callee.property?.name ?? cur.callee.property?.value
    chain.unshift({ method: (method || '').toLowerCase(), args: cur.arguments.map(serializeNode) })
    cur = cur.callee.object
  }

  // cur is now the Model.objects MemberExpression
  let model = null
  if (
    cur?.type === 'MemberExpression' &&
    cur.object?.type === 'Identifier' &&
    cur.property?.name === 'objects'
  ) {
    model = cur.object.name
  }

  return { model, chain }
}

// ─── Node serializer ───────────────────────────────────────────────────────────

function serializeNode(node) {
  if (!node) return { kind: 'unknown' }

  switch (node.type) {
    case 'Literal':
      return { kind: 'literal', value: node.value }

    case 'Identifier':
      if (node.name === 'true')  return { kind: 'bool', value: true }
      if (node.name === 'false') return { kind: 'bool', value: false }
      if (node.name === 'null')  return { kind: 'null', value: null }
      return { kind: 'ident', value: node.name }

    case 'AssignmentExpression':
      // kwarg: field_name=value  or  field__lookup=value
      return {
        kind: 'kwarg',
        name: node.left?.name ?? node.left?.value ?? '',
        value: serializeNode(node.right),
      }

    case 'CallExpression': {
      // Aggregate functions, Q(), F(), etc.
      const fn = node.callee?.type === 'Identifier'
        ? node.callee.name
        : node.callee?.property?.name ?? 'unknown'
      return { kind: 'call', fn, args: node.arguments.map(serializeNode) }
    }

    case 'UnaryExpression':
      if (node.operator === '-') {
        const inner = serializeNode(node.argument)
        // -1984 becomes { kind:'literal', value:-1984 }
        if (inner.kind === 'literal' && typeof inner.value === 'number')
          return { kind: 'literal', value: -inner.value }
        return { kind: 'neg', value: inner }
      }
      return { kind: 'unary', op: node.operator, value: serializeNode(node.argument) }

    case 'BinaryExpression':
      // Q() | Q(), F('price') * 2, etc.
      return {
        kind: 'binary',
        op: node.operator,
        left: serializeNode(node.left),
        right: serializeNode(node.right),
      }

    case 'SpreadElement':
      return { kind: 'spread', value: serializeNode(node.argument) }

    default:
      return { kind: 'unknown', type: node.type }
  }
}

// ─── Value equality ────────────────────────────────────────────────────────────

// Strip __exact lookup suffix — filter(field=x) ≡ filter(field__exact=x)
function normalizeKwarg(name) {
  return (name || '').replace(/__exact$/, '')
}

function valEq(a, b) {
  if (!a || !b) return false
  // Both literals
  if (a.kind === 'literal' && b.kind === 'literal') {
    // Allow loose coercion: '1984' == 1984
    return a.value === b.value || String(a.value) === String(b.value)
  }
  // Both booleans
  if (a.kind === 'bool' && b.kind === 'bool') return a.value === b.value
  // Both null
  if (a.kind === 'null' && b.kind === 'null') return true
  // Both identifiers (e.g. field references)
  if (a.kind === 'ident' && b.kind === 'ident')
    return a.value.toLowerCase() === b.value.toLowerCase()
  // Both function calls: Count, Sum, F, Q, …
  if (a.kind === 'call' && b.kind === 'call') {
    return (
      a.fn.toLowerCase() === b.fn.toLowerCase() &&
      argsSimilarity(a.args, b.args) >= 0.9
    )
  }
  // Negation
  if (a.kind === 'neg' && b.kind === 'neg') return valEq(a.value, b.value)
  // Binary
  if (a.kind === 'binary' && b.kind === 'binary')
    return a.op === b.op && valEq(a.left, b.left) && valEq(a.right, b.right)
  // Cross-kind: string '1984' ≡ number 1984
  if (
    (a.kind === 'literal' || a.kind === 'ident') &&
    (b.kind === 'literal' || b.kind === 'ident')
  ) {
    return String(a.value) === String(b.value)
  }
  return false
}

// ─── Argument similarity ───────────────────────────────────────────────────────

/**
 * Returns 0–1 similarity between two argument lists.
 * Kwargs are order-independent; positional args are order-dependent.
 */
function argsSimilarity(userArgs, solArgs) {
  // Partition into positional and keyword
  const uPos = [], uKw = {}
  for (const a of userArgs) {
    if (a.kind === 'kwarg') uKw[normalizeKwarg(a.name)] = a.value
    else uPos.push(a)
  }
  const sPos = [], sKw = {}
  for (const a of solArgs) {
    if (a.kind === 'kwarg') sKw[normalizeKwarg(a.name)] = a.value
    else sPos.push(a)
  }

  let matched = 0
  let total = 0

  // Positional
  const posLen = Math.max(uPos.length, sPos.length)
  total += posLen
  for (let i = 0; i < Math.min(uPos.length, sPos.length); i++) {
    if (valEq(uPos[i], sPos[i])) matched++
  }

  // Kwargs (order-independent)
  const sKeys = Object.keys(sKw)
  const uKeys = Object.keys(uKw)
  total += Math.max(sKeys.length, uKeys.length)
  for (const k of sKeys) {
    if (k in uKw && valEq(sKw[k], uKw[k])) matched++
  }

  // Both completely empty → perfect
  if (total === 0) return 1.0
  return matched / total
}

// ─── Chain similarity ──────────────────────────────────────────────────────────

function chainSimilarity(userChain, solChain) {
  if (solChain.length === 0) return userChain.length === 0 ? 1 : 0.5

  let methodScore = 0   // 0–1: which solution methods appear in user chain
  let argScore = 0      // 0–1: how well the matching methods' args match

  for (const solStep of solChain) {
    // Find the corresponding user step with the same method name
    const userStep = userChain.find((s) => s.method === solStep.method)
    if (userStep) {
      methodScore += 1
      argScore += argsSimilarity(userStep.args, solStep.args)
    }
  }

  const n = solChain.length
  const mScore = methodScore / n       // 0–1
  const aScore = argScore / n          // 0–1
  const orderPenalty = chainOrderPenalty(userChain, solChain)

  // Weighted: args matter more than order
  return mScore * 0.4 + aScore * 0.5 + (1 - orderPenalty) * 0.1
}

/** Returns 0 (perfect order) – 1 (fully reversed) */
function chainOrderPenalty(user, sol) {
  if (sol.length <= 1) return 0
  let inversions = 0
  const solMethods = sol.map((s) => s.method)
  const userPositions = solMethods.map((m) => user.findIndex((s) => s.method === m))
  for (let i = 0; i < userPositions.length - 1; i++) {
    for (let j = i + 1; j < userPositions.length; j++) {
      if (userPositions[i] !== -1 && userPositions[j] !== -1 && userPositions[i] > userPositions[j])
        inversions++
    }
  }
  const maxInversions = (sol.length * (sol.length - 1)) / 2
  return maxInversions === 0 ? 0 : inversions / maxInversions
}

// ─── Parse a Django query into a chain representation ─────────────────────────

function parseDjangoChain(src) {
  const cleaned = preprocessQuery(src)
  if (!cleaned) return null
  const program = parseJs(cleaned)
  if (!program) return null
  const ormNode = findOrmNode(program)
  if (!ormNode) return null
  return extractChain(ormNode)
}

// ─── Missing / extra method feedback ──────────────────────────────────────────

function buildIssues(userChain, solChain) {
  const solMethods = new Set(solChain.map((s) => s.method))
  const userMethods = new Set(userChain.map((s) => s.method))

  const missing = [...solMethods].filter((m) => !userMethods.has(m))
  const extra = [...userMethods].filter((m) => !solMethods.has(m))

  const issues = []
  if (missing.length) issues.push(`Missing method(s): .${missing.join('(), .')}()`)
  if (extra.length && missing.length) issues.push(`Unexpected method(s): .${extra.join('(), .')}()`)

  // Arg-level issues for matching methods
  for (const solStep of solChain) {
    const userStep = userChain.find((s) => s.method === solStep.method)
    if (!userStep) continue
    const sim = argsSimilarity(userStep.args, solStep.args)
    if (sim < 0.9 && sim > 0) {
      issues.push(`Arguments for .${solStep.method}() don't quite match — check field names and values.`)
    } else if (sim === 0 && solStep.args.length > 0) {
      issues.push(`Wrong arguments passed to .${solStep.method}().`)
    }
  }

  return issues
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Compares a user's Django ORM query against solution(s).
 *
 * Returns:
 * {
 *   score: 0–100,
 *   status: 'correct' | 'close' | 'partial' | 'wrong' | 'empty',
 *   feedback: string,
 *   details: { modelMatch?, methodsMatch?, argsMatch?, exactMatch? },
 *   issues: string[],
 * }
 */
export function checkAnswer(userQuery, solution, alternativeSolutions = []) {
  if (!userQuery?.trim()) {
    return {
      score: 0,
      status: 'empty',
      feedback: 'Write your query above and click Run Tests.',
      details: {},
      issues: [],
    }
  }

  const allSolutions = [solution, ...alternativeSolutions]

  // ── 1. Try exact normalized string match across all solutions ────────────────
  const userPre = preprocessQuery(userQuery)
  for (const sol of allSolutions) {
    const solPre = preprocessQuery(sol)
    if (userPre.replace(/\s+/g, '').replace(/'/g, '"') ===
        solPre.replace(/\s+/g, '').replace(/'/g, '"')) {
      return {
        score: 100,
        status: 'correct',
        feedback: 'Perfect! Your answer is exactly correct.',
        details: { exactMatch: true },
        issues: [],
      }
    }
  }

  // ── 2. Parse the user's query into a chain ───────────────────────────────────
  const userParsed = parseDjangoChain(userQuery)

  // ── 3. Score against each solution, keep the best ───────────────────────────
  let bestScore = 0
  let bestSolParsed = null

  for (const sol of allSolutions) {
    const solParsed = parseDjangoChain(sol)
    if (!solParsed) continue

    let score = 0
    // If user also failed to parse, use string fallback later
    if (userParsed) {
      const modelMatch = userParsed.model?.toLowerCase() === solParsed.model?.toLowerCase()
      const chainSim = chainSimilarity(userParsed.chain, solParsed.chain)
      score = (modelMatch ? 25 : 0) + Math.round(chainSim * 75)
    }
    if (score > bestScore) {
      bestScore = score
      bestSolParsed = solParsed
    }
  }

  // ── 4. Fallback: if AST parsing totally failed, use regex token matching ──────
  if (!userParsed || !bestSolParsed) {
    return fallbackCheck(userQuery, solution, alternativeSolutions)
  }

  // ── 5. Re-score precisely against the best-matching solution ──────────────────
  const modelMatch = userParsed.model?.toLowerCase() === bestSolParsed.model?.toLowerCase()
  const chainSim = chainSimilarity(userParsed.chain, bestSolParsed.chain)
  const rawScore = (modelMatch ? 25 : 0) + Math.round(chainSim * 75)
  const finalScore = Math.min(rawScore, 99)  // 100 is reserved for exact match

  // Build detail flags and issues
  const solMethods = new Set(bestSolParsed.chain.map((s) => s.method))
  const userMethods = new Set(userParsed.chain.map((s) => s.method))
  const allMethodsPresent = [...solMethods].every((m) => userMethods.has(m))

  // Check if all args are correct for matching methods
  let allArgsCorrect = true
  for (const solStep of bestSolParsed.chain) {
    const userStep = userParsed.chain.find((s) => s.method === solStep.method)
    if (!userStep || argsSimilarity(userStep.args, solStep.args) < 0.9) {
      allArgsCorrect = false
      break
    }
  }

  const details = {
    modelMatch,
    methodsMatch: allMethodsPresent,
    argsMatch: allArgsCorrect,
  }

  const issues = buildIssues(userParsed.chain, bestSolParsed.chain)
  if (!modelMatch && bestSolParsed.model) {
    issues.unshift(`Expected model "${bestSolParsed.model}", found "${userParsed.model || 'unknown'}"`)
  }

  // Determine status
  let status, feedback
  if (finalScore >= 90) {
    status = 'correct'
    feedback = 'Great work! Your query is semantically correct.'
  } else if (finalScore >= 65) {
    status = 'close'
    feedback = issues[0] ?? 'Almost there — check your field names or arguments.'
  } else if (finalScore >= 35) {
    status = 'partial'
    feedback = issues.slice(0, 2).join(' ') || 'Partially correct — review the required methods.'
  } else {
    status = 'wrong'
    feedback = issues[0] ?? 'Review the problem statement and try a different approach.'
  }

  return { score: finalScore, status, feedback, details, issues }
}

// ─── Regex-based fallback (if acorn can't parse the query) ────────────────────

function normalizeRaw(q) {
  return q.trim()
    .replace(/#[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/'/g, '"')
    .toLowerCase()
    .trim()
}

function extractTokens(q) {
  const n = normalizeRaw(q)
  const model = n.match(/^(\w+)\.objects/)?.[1] ?? null
  const methodPat = /\.(filter|exclude|order_by|all|get|first|last|count|exists|values|values_list|distinct|annotate|aggregate|select_related|prefetch_related|only|defer|create|update|delete|bulk_create|union|intersection|difference|iterator|none)\(/g
  const methods = []
  let m
  while ((m = methodPat.exec(n))) methods.push(m[1])
  const argPat = /(\w+(?:__\w+)*)\s*=/g
  const args = []
  while ((m = argPat.exec(n))) args.push(m[1].replace(/__exact$/, ''))
  return { model, methods, args }
}

function fallbackCheck(userQuery, solution, alternativeSolutions) {
  const allSols = [solution, ...alternativeSolutions]
  const u = extractTokens(userQuery)
  let bestScore = 0

  for (const sol of allSols) {
    const s = extractTokens(sol)
    let score = 0
    if (u.model && s.model && u.model === s.model) score += 25
    const uM = new Set(u.methods), sM = new Set(s.methods)
    const mIntersect = [...sM].filter((x) => uM.has(x))
    score += sM.size > 0 ? (mIntersect.length / sM.size) * 40 : 20
    const uA = new Set(u.args), sA = new Set(s.args)
    const aIntersect = [...sA].filter((x) => uA.has(x))
    score += sA.size > 0 ? (aIntersect.length / sA.size) * 35 : 15
    if (score > bestScore) bestScore = score
  }

  const final = Math.round(Math.min(bestScore, 99))
  let status = final >= 85 ? 'correct' : final >= 60 ? 'close' : final >= 30 ? 'partial' : 'wrong'
  let feedback =
    status === 'correct' ? 'Your query looks correct!' :
    status === 'close' ? 'Almost there — check field names and arguments.' :
    status === 'partial' ? 'Partially correct — review the required methods.' :
    'Review the problem statement and try again.'

  return { score: final, status, feedback, details: {}, issues: [] }
}
