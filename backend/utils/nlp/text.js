/**
 * Lightweight text processing for the local (no-API) assistant.
 * Pure JS — no dependencies. Not a full NLP stack: just the pieces needed
 * to turn a messy shopper sentence into something we can search with.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'so',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'yours',
  'he', 'she', 'it', 'they', 'them', 'their',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'doing', 'have', 'has', 'had', 'having',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'want', 'wanna', 'need', 'like', 'looking', 'look', 'find', 'show',
  'get', 'got', 'give', 'please', 'pls', 'help',
  'some', 'any', 'something', 'anything', 'stuff', 'things', 'thing',
  'good', 'nice', 'cool', 'best', 'great', 'awesome', 'amazing',
  'know', 'tell', 'whats', 'what', 'which', 'where',
  'for', 'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'about',
  'there', 'here', 'am', 're', 've', 'll', 'm', 's',
  'do you', 'do i', 'does', 'has', 'have any',
])

/* Words that carry no product meaning but read as a request. Kept separate
   from STOPWORDS because we still want them for intent detection. */
export const FILLER = new Set([
  'show', 'find', 'looking', 'recommend', 'suggest', 'need', 'want',
  'browse', 'explore', 'search', 'display', 'list', 'give', 'sell', 'offer',
  'buy', 'purchase', 'shop', 'browse',
])

/** Lowercase, strip punctuation, collapse whitespace. */
export const normalise = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9\s.+#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Very small suffix stemmer. Not linguistically correct, but it collapses the
 * differences that matter for catalogue search: plurals and -ing/-ed.
 * Deliberately conservative — over-stemming merges unrelated words.
 */
export const stem = (word) => {
  let w = word
  if (w.length <= 3) return w

  // plurals
  if (/(?:ch|sh|ss|x|z)es$/.test(w)) return w.slice(0, -2)
  if (/[^s]ies$/.test(w)) return w.slice(0, -3) + 'y'
  if (/(?:[^s]s)$/.test(w)) return w.slice(0, -1)

  // verb / adjective endings
  if (/ing$/.test(w) && w.length > 5) {
    const base = w.slice(0, -3)
    return /[aeiou]/.test(base.at(-1)) ? base : base + 'e'
  }
  if (/ed$/.test(w) && w.length > 4) {
    const base = w.slice(0, -2)
    return /[aeiou]/.test(base.at(-1)) ? base : base + 'e'
  }

  return w
}

/** Split into normalised tokens, dropping stopwords and 1-char noise. */
export const tokenize = (text, { keepStopwords = false } = {}) => {
  const words = normalise(text).split(' ').filter(Boolean)
  const out = []
  for (const w of words) {
    if (!keepStopwords && (STOPWORDS.has(w) || w.length < 2)) continue
    out.push(stem(w))
  }
  return out
}

/** Raw words (unstemmed) that survived stopword removal. */
export const contentWords = (text) =>
  normalise(text)
    .split(' ')
    .filter((w) => w && w.length > 1 && !STOPWORDS.has(w))

/** Levenshtein distance, capped for speed. */
export const editDistance = (a, b, max = 2) => {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (cur[j] < best) best = cur[j]
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/**
 * Fuzzy-match query terms against a vocabulary so typos still land
 * ("wireles headphons" -> wireless, headphones).
 */
export const fuzzyMatch = (term, vocabulary, maxDistance = 2) => {
  if (vocabulary.has(term)) return term
  if (term.length < 4) return null

  const limit = term.length > 7 ? 2 : 1
  let best = null
  let bestScore = maxDistance + 1

  for (const candidate of vocabulary) {
    /* Only consider candidates sharing a prefix-ish shape to keep this fast. */
    if (Math.abs(candidate.length - term.length) > limit) continue
    const d = editDistance(term, candidate, limit)
    if (d < bestScore) {
      bestScore = d
      best = candidate
    }
  }
  return bestScore <= limit ? best : null
}

/** True when `text` contains `phrase` as a whole-word sequence. */
export const containsPhrase = (text, phrase) => {
  const re = new RegExp(`(^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i')
  return re.test(text)
}

export const titleCase = (s) =>
  String(s || '')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
