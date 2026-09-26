import { normalise, tokenize, contentWords, fuzzyMatch, containsPhrase, FILLER } from './text.js'
import {
  CATEGORY_SYNONYMS,
  ATTRIBUTE_SYNONYMS,
  DEAL_SIGNALS,
  STOCK_SIGNALS,
  INTENT_PATTERNS,
  REFINEMENT_SIGNALS,
  RECIPIENT_WORDS,
} from './ontology.js'

/** Length of the common prefix of two strings. */
const sharedPrefix = (a, b) => {
  let i = 0
  const n = Math.min(a.length, b.length)
  while (i < n && a[i] === b[i]) i++
  return i
}

const toNumber = (s) => {
  const n = Number(String(s).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/**
 * Blank out every span of `text` that an earlier stage has already
 * interpreted, so the leftovers are genuinely just product keywords.
 *
 * The previous approach compared words against a blocklist, which left
 * fragments behind ("under", "500") that were then searched for as if they
 * were product names. Removing the matched spans is both simpler and correct.
 */
const maskSpans = (text, spans) => {
  if (!spans.length) return text
  const chars = [...text]
  for (const [start, end] of spans) {
    for (let i = start; i < end && i < chars.length; i++) chars[i] = ' '
  }
  return chars.join('')
}

/**
 * Character range covered by a `String.match` result.
 * `String.match` returns null when nothing matched, and match arrays carry
 * `.index` plus the full match at `[0]` — so no regex re-parsing is needed.
 */
const spanOfMatch = (m) => (m && typeof m.index === 'number' ? [[m.index, m.index + m[0].length]] : [])

/**
 * Character ranges for every literal phrase in `phrases`, matched on word
 * boundaries. Plain `indexOf` would let "gift" match inside "gifts" and mask
 * only part of the word, leaving a stray "s" behind as a search term.
 */
const spansForPhrases = (text, phrases) => {
  if (!Array.isArray(phrases)) return []
  const out = []
  for (const phrase of phrases) {
    if (!phrase) continue
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'g')
    let m
    while ((m = rx.exec(text)) !== null) {
      if (m[0].length === 0) {
        rx.lastIndex++
        continue
      }
      out.push([m.index, m.index + m[0].length])
    }
  }
  return out
}

/**
 * Turns a shopper sentence into a structured query.
 *
 * Every field is scored or explicitly nulled — nothing is guessed silently.
 * A null means "the user did not ask for this", which the response layer
 * needs in order to avoid claiming a filter was applied when it wasn't.
 */
export const understand = (rawText, { vocabulary = new Set() } = {}) => {
  const text = normalise(rawText)
  const result = {
    raw: String(rawText || ''),
    text,
    intents: [],
    category: null,
    categoryHint: null,
    price: null,
    minPrice: null,
    maxPrice: null,
    sort: null,
    inStockOnly: false,
    dealsOnly: false,
    attributes: {},
    terms: [],
    originalTerms: [],
    isRefinement: false,
    isQuestion: false,
    unknownTerms: [],
  }

  if (!text) return result

  /* ---- Question detection ---- */
  result.isQuestion = /\?\s*$/.test(text) || /^(what|which|who|when|where|how|do|does|is|are|can|should)\b/.test(text)

  /* ---- Price ---- */
  const between = text.match(/between\s*(?:rs\.?\s*)?(\d[\d,]*)\s*(?:and|-|to)\s*(?:rs\.?\s*)?(\d[\d,]*)/)
  const under = text.match(/(?:under|below|less than|cheaper than|max|up to|within|budget of)\s*(?:rs\.?\s*)?(\d[\d,]*)/)
  const above = text.match(/(?:above|over|more than|min|at least|greater than|starting at)\s*(?:rs\.?\s*)?(\d[\d,]*)/)

  if (between) {
    result.price = { min: toNumber(between[1]), max: toNumber(between[2]) }
  } else if (under) {
    result.maxPrice = toNumber(under[1])
  } else if (above) {
    result.minPrice = toNumber(above[1])
  }

  /* ---- Category ----
     Resolve against the synonym map. Exact phrase match first, then a prefix
     pass so an inflected or clipped word still lands: "cloths" -> clothing,
     "jewellery" -> fashion, "skincare" -> beauty. Without the prefix pass
     "show me cloths" matched nothing because BM25 needs exact token hits. */
  for (const [slug, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some((w) => containsPhrase(text, w))) {
      result.category = slug
      break
    }
  }

  if (!result.category) {
    const words = contentWords(text)
    for (const [slug, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
      const hit = words.find((w) => w.length >= 4 && synonyms.some((syn) => sharedPrefix(w, syn) >= 4))
      if (hit) {
        result.category = slug
        /* The word that implied the category is not also a product keyword.
           Without this, "cloths" resolves to fashion and then gets fed to
           BM25 as a search term, which matches nothing. */
        result.categoryHint = hit
        break
      }
    }
  }

  /* ---- Attributes (color, material, ...) ---- */
  for (const [attr, words] of Object.entries(ATTRIBUTE_SYNONYMS)) {
    const hit = words.find((w) => containsPhrase(text, w))
    if (hit) result.attributes[attr] = hit
  }

  /* ---- Intents (scored, all matches kept) ---- */
  for (const [intent, phrases] of Object.entries(INTENT_PATTERNS)) {
    if (phrases.some((p) => containsPhrase(text, p))) result.intents.push(intent)
  }

  /* ---- Sort ---- */
  if (result.intents.includes('cheapest')) result.sort = { price: 1 }
  else if (result.intents.includes('mostExpensive')) result.sort = { price: -1 }
  else if (result.intents.includes('bestRated')) result.sort = { rating: -1, numReviews: -1 }
  else if (result.intents.includes('mostReviewed')) result.sort = { numReviews: -1 }
  else if (result.intents.includes('newest')) result.sort = { createdAt: -1 }

  result.inStockOnly = STOCK_SIGNALS.some((s) => containsPhrase(text, s))
  /* "deals under 2000" asks for both, so a price must not suppress the
     discount filter. Price words like "cheap" no longer live in
     DEAL_SIGNALS, so this no longer misfires on sort requests. */
  result.dealsOnly = DEAL_SIGNALS.some((s) => containsPhrase(text, s))

  result.isRefinement = REFINEMENT_SIGNALS.some((s) => containsPhrase(text, s))

  /* ---- Search terms ----
     Remove every span already accounted for (prices, sort words, category
     and attribute words, deal/stock phrases), then whatever remains is what
     the shopper is actually searching for by name. */
  const masked = maskSpans(text, [
    ...spanOfMatch(between),
    ...spanOfMatch(under),
    ...spanOfMatch(above),
    ...spansForPhrases(text, Object.values(INTENT_PATTERNS).flat()),
    ...spansForPhrases(text, DEAL_SIGNALS),
    ...spansForPhrases(text, STOCK_SIGNALS),
    ...spansForPhrases(text, Object.values(CATEGORY_SYNONYMS).flat()),
    ...spansForPhrases(
      text,
      Object.entries(result.attributes).flatMap(([k]) => ATTRIBUTE_SYNONYMS[k] || []),
    ),
    ...spansForPhrases(text, REFINEMENT_SIGNALS),
    ...spansForPhrases(text, RECIPIENT_WORDS),
    ...spansForPhrases(text, INTENT_PATTERNS.forWho || []),
    ...(result.categoryHint ? spansForPhrases(text, [result.categoryHint]) : []),
  ])

  const candidates = contentWords(masked).filter((w) => !FILLER.has(w))

  for (const word of candidates) {
    const stemmed = tokenize(word)[0] || word
    result.originalTerms.push(word)

    /* Correct obvious typos against the catalogue vocabulary. A word already
       present verbatim is never a typo, even if its stem differs — otherwise
       "headphones" gets reported as a misspelling of "headphone". */
    const known = vocabulary.has(word)
    const corrected = !known && vocabulary.size ? fuzzyMatch(stemmed, vocabulary) : null

    if (corrected && corrected !== stemmed) {
      result.terms.push(corrected)
      result.unknownTerms.push({ from: word, to: corrected })
    } else {
      result.terms.push(stemmed)
    }
  }

  /* Deduplicate while preserving order. */
  result.terms = [...new Set(result.terms)]

  return result
}

/** A short human summary of what was understood, for logging/debugging. */
export const describeUnderstanding = (u) => {
  const bits = []
  if (u.category) bits.push(`category=${u.category}`)
  if (u.minPrice != null) bits.push(`min=${u.minPrice}`)
  if (u.maxPrice != null) bits.push(`max=${u.maxPrice}`)
  if (u.price) bits.push(`range=${u.price.min}-${u.price.max}`)
  if (u.dealsOnly) bits.push('deals')
  if (u.inStockOnly) bits.push('inStock')
  if (u.sort) bits.push(`sort=${Object.keys(u.sort)[0]}`)
  if (Object.keys(u.attributes).length) bits.push(`attrs=${JSON.stringify(u.attributes)}`)
  if (u.terms.length) bits.push(`terms=[${u.terms.join(',')}]`)
  if (u.unknownTerms.length) bits.push(`corrected=[${u.unknownTerms.join(',')}]`)
  return bits.join(' ') || 'nothing'
}
