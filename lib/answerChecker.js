/**
 * Normalizes a Django ORM query string for comparison.
 * Strips whitespace, normalizes quotes, lowercases.
 */
export function normalizeQuery(query) {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/'/g, '"')           // normalize single to double quotes
    .replace(/\s*,\s*/g, ', ')   // normalize comma spacing
    .replace(/\s*=\s*/g, '=')    // normalize = spacing
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .toLowerCase()
}

/**
 * Extracts key tokens from a Django ORM query.
 * Returns an object with: modelName, methods (array), args (array), normalized.
 */
export function extractTokens(query) {
  const normalized = normalizeQuery(query)

  // Extract model name (first word before .objects)
  const modelMatch = normalized.match(/^(\w+)\.objects/)
  const modelName = modelMatch ? modelMatch[1] : null

  // Extract method chain
  const methodPattern =
    /\.(filter|exclude|order_by|all|get|first|last|count|exists|values|values_list|distinct|annotate|aggregate|select_related|prefetch_related|only|defer|create|update|delete|bulk_create|union|intersection|difference|iterator|using|none)\(/g
  const methods = []
  let m
  while ((m = methodPattern.exec(normalized)) !== null) {
    methods.push(m[1])
  }

  // Extract key arguments (field names and lookup types like field__gte)
  const argPattern = /(\w+(?:__\w+)*)\s*=/g
  const args = []
  while ((m = argPattern.exec(normalized)) !== null) {
    args.push(m[1])
  }

  return { modelName, methods, args, normalized }
}

/**
 * Checks if two queries are semantically equivalent.
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
  // Empty check
  if (!userQuery || !userQuery.trim()) {
    return {
      score: 0,
      status: 'empty',
      feedback: 'Please write your answer before submitting.',
      details: {},
      issues: [],
    }
  }

  const allSolutions = [solution, ...alternativeSolutions]

  // Exact match (normalized)
  const userNorm = normalizeQuery(userQuery)
  for (const sol of allSolutions) {
    if (normalizeQuery(sol) === userNorm) {
      return {
        score: 100,
        status: 'correct',
        feedback: 'Perfect! Your answer is exactly correct.',
        details: { exactMatch: true },
        issues: [],
      }
    }
  }

  // Semantic token matching against primary solution
  const userTokens = extractTokens(userQuery)
  const solTokens = extractTokens(solution)

  let score = 0
  const details = {}
  const issues = []

  // Model name match — 30 points
  if (userTokens.modelName && solTokens.modelName) {
    if (userTokens.modelName === solTokens.modelName) {
      score += 30
      details.modelMatch = true
    } else {
      details.modelMatch = false
      issues.push(
        `Expected model "${solTokens.modelName}" but found "${userTokens.modelName}"`,
      )
    }
  }

  // Methods match — 40 points
  const solMethodSet = new Set(solTokens.methods)
  const userMethodSet = new Set(userTokens.methods)
  const methodIntersection = [...solMethodSet].filter((m) => userMethodSet.has(m))
  const methodScore =
    solTokens.methods.length > 0
      ? (methodIntersection.length / solTokens.methods.length) * 40
      : 20
  score += methodScore

  const missingMethods = [...solMethodSet].filter((m) => !userMethodSet.has(m))
  const extraMethods = [...userMethodSet].filter((m) => !solMethodSet.has(m))
  details.methodsMatch = missingMethods.length === 0
  if (missingMethods.length > 0) {
    issues.push(`Missing method(s): ${missingMethods.join(', ')}`)
  }
  if (extraMethods.length > 0 && missingMethods.length > 0) {
    issues.push(`Unexpected method(s): ${extraMethods.join(', ')}`)
  }

  // Args match — 30 points
  const solArgSet = new Set(solTokens.args)
  const userArgSet = new Set(userTokens.args)
  const argIntersection = [...solArgSet].filter((a) => userArgSet.has(a))
  const argScore =
    solTokens.args.length > 0
      ? (argIntersection.length / solTokens.args.length) * 30
      : 15
  score += argScore

  const missingArgs = [...solArgSet].filter((a) => !userArgSet.has(a))
  details.argsMatch = missingArgs.length === 0
  if (missingArgs.length > 0) {
    issues.push(`Missing field/argument(s): ${missingArgs.join(', ')}`)
  }

  const finalScore = Math.round(score)

  // Determine status and feedback
  let status, feedback
  if (finalScore >= 85) {
    status = 'correct'
    feedback =
      'Great work! Your query is semantically correct. The exact formatting may differ slightly.'
  } else if (finalScore >= 60) {
    status = 'close'
    feedback = `Almost there! ${issues[0] || 'Check your syntax carefully.'}`
  } else if (finalScore >= 30) {
    status = 'partial'
    feedback = `Partially correct. ${issues.slice(0, 2).join(' ')}`
  } else {
    status = 'wrong'
    feedback =
      issues.length > 0
        ? `Not quite. ${issues[0]}`
        : 'Review the problem statement and try a different approach.'
  }

  return { score: finalScore, status, feedback, details, issues }
}
