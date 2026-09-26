/**
 * Unit tests for the assistant's intent and entity extraction.
 *
 * `understand()` is the brain of the shopping assistant: every downstream
 * decision (which filter to apply, what to rank, what to tell the user) comes
 * from its output. It is also the most heavily branched module in the backend
 * and previously had no automated coverage — bugs here were only ever found by
 * running the server and reading the reply by hand.
 *
 * These are pure functions: no database, no network.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { understand, describeUnderstanding } from '../../utils/nlp/understand.js'

/* Categories the real store uses, passed in as the engine would. */
const CATEGORIES = ['electronics', 'fashion', 'jewelry', 'home-living', 'beauty', 'sports', 'books']
const VOCAB = new Set([
  'wireless', 'headphone', 'camera', 'bluetooth', 'leather', 'cotton',
  'yoga', 'mat', 'serum', 'ceramic', 'coffee', 'watch', 'necklace', 'running', 'shoe',
])

const parse = (message) => understand(message, { vocabulary: VOCAB, categories: CATEGORIES })

/* ─────────────────────────── price parsing ─────────────────────────── */

test('parses an upper price bound', () => {
  for (const q of ['under Rs 500', 'below 500', 'less than 500', 'max 500', 'up to 500', 'within 500']) {
    const u = parse(q)
    assert.equal(u.maxPrice, 500, `"${q}" should set maxPrice`)
  }
})

test('parses a lower price bound', () => {
  for (const q of ['above 1000', 'over 1000', 'more than 1000', 'min 1000', 'at least 1000']) {
    const u = parse(q)
    assert.equal(u.minPrice, 1000, `"${q}" should set minPrice`)
  }
})

test('parses a price range and strips thousands separators', () => {
  const u = parse('between 1,000 and 5,000')
  assert.deepEqual(u.price, { min: 1000, max: 5000 })
})

test('range wins over a loose bound when both phrases appear', () => {
  // "between 100 and 200 under 900" must not collapse to maxPrice=900.
  const u = parse('between 100 and 200 under 900')
  assert.deepEqual(u.price, { min: 100, max: 200 })
})

test('no price filter when none is mentioned', () => {
  const u = parse('show me electronics')
  assert.equal(u.maxPrice, null)
  assert.equal(u.minPrice, null)
  assert.equal(u.price, null)
})

test('price words are masked out of the search terms', () => {
  // Regression: blocklists left "under" and "500" behind, which were then
  // searched for as if they were product names.
  const u = parse('something under 500')
  assert.equal(u.terms.includes('under'), false)
  assert.equal(u.terms.includes('500'), false)
})

/* ─────────────────────────── category detection ─────────────────────────── */

test('detects a category from its exact slug', () => {
  assert.equal(parse('show me electronics').category, 'electronics')
  assert.equal(parse('show me beauty products').category, 'beauty')
})

test('detects a category through a synonym', () => {
  assert.equal(parse('show me clothes').category, 'fashion')
  assert.equal(parse('some skincare').category, 'beauty')
})

test('resolves an inflected word to its category via shared prefix', () => {
  // "cloths" shares the prefix "cloth" with "clothing"/"clothes".
  assert.equal(parse('show me cloths').category, 'fashion')
})

test('detects a category that exists only in the database, not in the synonym map', () => {
  // Regression: the synonym map knew "fashion" but not "jewelry", so
  // "show me jewelry" returned nothing. Categories now come from the data.
  assert.equal(parse('show me jewelry').category, 'jewelry')
})

test('an unknown category word is not invented', () => {
  assert.equal(parse('show me hovercrafts').category, null)
})

test('the category-implying word is not also a search term', () => {
  // Otherwise "cloths" resolves to fashion and is then fed to BM25 as a
  // product keyword, which matches nothing.
  const u = parse('show me cloths')
  assert.equal(u.categoryHint, 'cloths')
  assert.equal(u.terms.includes('cloth'), false)
})

/* ─────────────────────────── intents and sorting ─────────────────────────── */

test('detects sort intents and maps them to a sort spec', () => {
  assert.deepEqual(parse('cheapest').sort, { price: 1 })
  assert.deepEqual(parse('most expensive').sort, { price: -1 })
  assert.deepEqual(parse('best rated').sort, { rating: -1, numReviews: -1 })
  assert.deepEqual(parse('most reviewed').sort, { numReviews: -1 })
  assert.deepEqual(parse('newest').sort, { createdAt: -1 })
})

test('"cheapest" is a sort request, not a request for discounted items', () => {
  // Regression: "cheap"/"cheapest" lived in the deal-signal list, so asking
  // for the cheapest item returned whatever was on sale.
  assert.equal(parse('cheapest headphones').dealsOnly, false)
})

test('detects a genuine discount request', () => {
  for (const q of ['show me deals', 'any discounts', 'on sale', 'current offers']) {
    assert.equal(parse(q).dealsOnly, true, `"${q}" should be a discount request`)
  }
})

test('discount and price filters combine rather than cancel out', () => {
  // Regression: a price bound used to suppress the discount filter, so
  // "deals under 2000" silently ignored "deals".
  const u = parse('deals under 2000')
  assert.equal(u.dealsOnly, true)
  assert.equal(u.maxPrice, 2000)
})

test('detects an in-stock request', () => {
  assert.equal(parse('what is in stock').inStockOnly, true)
})

test('detects colour and material attributes', () => {
  const u = parse('a black leather wallet')
  assert.equal(u.attributes.color, 'black')
  assert.equal(u.attributes.material, 'leather')
})

/* ─────────────────────────── search terms ─────────────────────────── */

test('keeps genuine product words as search terms', () => {
  const u = parse('wireless headphones')
  assert.deepEqual(u.terms, ['wireless', 'headphone'])
})

test('corrects a typo against the vocabulary and records both forms', () => {
  const u = parse('wireles headphons')
  assert.ok(u.terms.includes('headphone'), 'should resolve to the real term')
  assert.deepEqual(u.unknownTerms, [{ from: 'headphons', to: 'headphone' }])
})

test('does not report a correctly spelled word as a typo', () => {
  // Regression: stemming made "headphones" look like a misspelling of its
  // own singular, so the UI showed a bogus correction.
  const u = parse('headphones')
  assert.equal(u.unknownTerms.length, 0)
})

test('gift framing treats the recipient as context, not a product word', () => {
  // Regression: "for my dad" left "dad" in the term list, which matched
  // nothing and made the assistant report no results.
  const u = parse('gift for my dad under 2000')
  assert.equal(u.terms.includes('dad'), false)
  assert.equal(u.maxPrice, 2000)
})

test('masks a singular gift word without corrupting the plural', () => {
  // Regression: indexOf("gift") matched inside "gifts" and masked only part
  // of the word, leaving a stray "s" to be searched for.
  const u = parse('gifts for a friend')
  assert.equal(u.terms.includes('s'), false)
})

test('drops generic request verbs from the terms', () => {
  const u = parse('do you sell shoes')
  assert.equal(u.terms.includes('sell'), false)
  assert.equal(u.terms.includes('do'), false)
})

test('detects a refinement follow-up', () => {
  assert.equal(parse('something cheaper').isRefinement, true)
  assert.equal(parse('show me books').isRefinement, false)
})

/* ─────────────────────────── question detection ─────────────────────────── */

test('flags questions', () => {
  assert.equal(parse('what do you sell?').isQuestion, true)
  assert.equal(parse('which is cheapest').isQuestion, true)
  assert.equal(parse('show me books').isQuestion, false)
})

/* ─────────────────────────── hostile and degenerate input ─────────────────────────── */

test('empty and whitespace input returns an empty understanding', () => {
  for (const q of ['', '   ', null, undefined]) {
    const u = understand(q)
    assert.equal(u.category, null)
    assert.deepEqual(u.terms, [], `input ${JSON.stringify(q)} should yield no terms`)
  }
})

test('a non-string message is coerced rather than crashing', () => {
  // The controller rejects non-strings before this is reached, but the
  // primitive must not throw if called directly.
  const u = understand(123)
  assert.equal(u.text, '123')
  assert.deepEqual(u.terms, ['123'])
})

test('input containing query operators is treated as plain text', () => {
  // The assistant builds its own queries from parsed terms, so a Mongo
  // operator pasted into the message is just a string. What matters is that
  // nothing throws and no operator survives into a query.
  const u = parse('{"$ne": null} $where sleep(10000)')
  assert.equal(typeof u.text, 'string')
  assert.ok(Array.isArray(u.terms))
  for (const term of u.terms) {
    assert.equal(typeof term, 'string')
    assert.equal(term.includes('$'), false, 'no operator characters should survive')
  }
})

test('punctuated product words still reach the search terms', () => {
  // Regression: "wireless" was listed as a `feature` attribute, so it was
  // masked out of the terms and replaced by a hard filter. A Bluetooth
  // speaker whose text never says "wireless" became unfindable.
  const u = parse('wireless speaker')
  assert.equal(u.attributes.feature, undefined)
  assert.deepEqual(u.terms, ['wireless', 'speaker'])
})

test('very long input does not throw', () => {
  const u = parse('electronics '.repeat(2000))
  assert.equal(typeof u.text, 'string')
})

test('punctuation and symbols alone produce no terms', () => {
  const u = parse('!!! ??? *** ---')
  assert.deepEqual(u.terms, [])
})

test('unicode input does not throw', () => {
  const u = parse('住所 electronics 🎧')
  assert.equal(typeof u.text, 'string')
})

test('no vocabulary supplied is tolerated', () => {
  const u = understand('wireless headphones', { categories: CATEGORIES })
  assert.deepEqual(u.terms, ['wireless', 'headphone'])
})

test('no categories supplied is tolerated', () => {
  const u = understand('show me electronics', { vocabulary: VOCAB })
  assert.equal(typeof u.text, 'string')
})

/* ─────────────────────────── debug helper ─────────────────────────── */

test('describeUnderstanding produces a loggable summary', () => {
  const summary = describeUnderstanding(parse('deals under 2000'))
  assert.match(summary, /2000/)
  assert.match(summary, /deals/)
})

test('describeUnderstanding handles an empty parse', () => {
  assert.equal(describeUnderstanding(understand('')), 'nothing')
})
