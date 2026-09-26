/**
 * Unit tests for the NLP text primitives.
 *
 * These are the lowest layer of the assistant and the most heavily branched
 * pure functions in the backend, yet previously had no coverage at all. They
 * need no database, no network and no fixtures.
 *
 * Run: npm test
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalise,
  splitWords,
  tokenize,
  stem,
  contentWords,
  editDistance,
  fuzzyMatch,
  containsPhrase,
  FILLER,
} from '../../utils/nlp/text.js'

test('normalise: lowercases, strips punctuation, collapses whitespace', () => {
  assert.equal(normalise('  Hello,   WORLD!  '), 'hello world')
  assert.equal(normalise('Price: Rs 500'), 'price rs 500')
  assert.equal(normalise(''), '')
  assert.equal(normalise(null), '')
  assert.equal(normalise(undefined), '')
  assert.equal(normalise(42), '42')
})

test('splitWords: splits on whitespace, hyphens and dots', () => {
  // Hyphen splitting is load-bearing: "Noise-Cancelling" must index as two
  // tokens or the assistant cannot match a search for "noise cancelling".
  assert.deepEqual(splitWords('Noise-Cancelling Headphones'), ['noise', 'cancelling', 'headphones'])
  assert.deepEqual(splitWords('t-shirt'), ['t', 'shirt'])
  assert.deepEqual(splitWords('St. Louis'), ['st', 'louis'])
  assert.deepEqual(splitWords('multi  space'), ['multi', 'space'])
  assert.deepEqual(splitWords('   '), [])
  assert.deepEqual(splitWords(''), [])
})

test('stem: reduces regular plurals', () => {
  assert.equal(stem('headphones'), 'headphone')
  assert.equal(stem('boxes'), 'box')
  assert.equal(stem('dresses'), 'dress')
  assert.equal(stem('watches'), 'watch')
  assert.equal(stem('cameras'), 'camera')
  assert.equal(stem('shoes'), 'shoe')
  assert.equal(stem('gadgets'), 'gadget')
})

test('stem: leaves short words untouched', () => {
  // Words of three characters or fewer are returned as-is, which is why
  // "gas" and "mat" survive but "jeans" does not.
  assert.equal(stem('gas'), 'gas')
  assert.equal(stem('mat'), 'mat')
  assert.equal(stem('tv'), 'tv')
  assert.equal(stem('a'), 'a')
})

test('stem: does not over-stem words without the suffix', () => {
  assert.equal(stem('organic'), 'organic')
  assert.equal(stem('battery'), 'battery')
  assert.equal(stem('kitchen'), 'kitchen')
})

test('stem: known over-stemming on -ing/-ed (characterisation)', () => {
  // These assert CURRENT behaviour, not ideal behaviour. The suffix stripper
  // does not handle a final "e" or a doubled consonant, so "running" becomes
  // "runne". This is harmless for BM25 (documents and queries are stemmed
  // identically) but it means "run" and "running" will not match each other,
  // which costs recall. See REVIEW.md.
  assert.equal(stem('running'), 'runne')
  assert.equal(stem('hopping'), 'hoppe')
  assert.equal(stem('tried'), 'tri')
  assert.equal(stem('wanted'), 'wante')
  assert.equal(stem('studied'), 'studi')
})

test('editDistance: counts single-character edits', () => {
  assert.equal(editDistance('same', 'same', 3), 0)
  assert.equal(editDistance('headphone', 'headphones', 3), 1)
  assert.equal(editDistance('wireless', 'wireles', 3), 1)
  assert.equal(editDistance('abc', 'abd', 3), 1)
})

test('editDistance: multi-edit and length-gap behaviour', () => {
  assert.equal(editDistance('kitten', 'sitting', 3), 3)
  // Exceeding the cap short-circuits to max+1 rather than computing.
  assert.equal(editDistance('a', 'abcdefgh', 2), 3)
})

test('editDistance: is symmetric for equal-length inputs', () => {
  const a = 'headphones'
  const b = 'headphons'
  assert.equal(editDistance(a, b, 3), editDistance(b, a, 3))
})

test('fuzzyMatch: returns an exact vocabulary hit unchanged', () => {
  const vocab = new Set(['wireless', 'headphones', 'camera'])
  assert.equal(fuzzyMatch('wireless', vocab), 'wireless')
  assert.equal(fuzzyMatch('camera', vocab), 'camera')
})

test('fuzzyMatch: corrects a single-character typo', () => {
  const vocab = new Set(['wireless', 'headphone', 'camera'])
  assert.equal(fuzzyMatch('wireles', vocab), 'wireless')
  assert.equal(fuzzyMatch('headphonse', vocab), 'headphone')
})

test('fuzzyMatch: returns null for unrelated terms', () => {
  const vocab = new Set(['wireless', 'headphone', 'camera'])
  assert.equal(fuzzyMatch('xyzzy', vocab), null)
})

test('fuzzyMatch: refuses terms shorter than four characters', () => {
  // Guards against nonsense corrections on very short tokens — but only when
  // the term is genuinely absent. An exact hit short-circuits before the
  // length check, so a short word that IS in the vocabulary is returned.
  const vocab = new Set(['ab', 'abcd'])
  assert.equal(fuzzyMatch('abc', vocab), null, 'absent 3-char term is not corrected')
  assert.equal(fuzzyMatch('ab', vocab), 'ab', 'present 3-char term is an exact hit')
})

test('fuzzyMatch: tolerates an empty vocabulary', () => {
  assert.equal(fuzzyMatch('wireless', new Set()), null)
})

test('fuzzyMatch: does not throw when the vocabulary is omitted', () => {
  // Regression: `vocabulary` had no default, so calling with one argument
  // threw TypeError on `undefined.has`. Production guards this at the call
  // site, but the primitive itself should be safe to use directly.
  assert.equal(fuzzyMatch('ab'), null)
  assert.equal(fuzzyMatch('wireless'), null)
})

test('containsPhrase: matches whole words only', () => {
  // The word-boundary requirement is what stops "book" matching "notebook".
  assert.equal(containsPhrase('show me books', 'books'), true)
  assert.equal(containsPhrase('a book here', 'book'), true)
  assert.equal(containsPhrase('t-shirt', 't-shirt'), true)
})

test('containsPhrase: does not match inside a longer word', () => {
  assert.equal(containsPhrase('notebook', 'book'), false)
  assert.equal(containsPhrase('software', 'ware'), false)
  assert.equal(containsPhrase('books', 'book'), false, 'plural is a different token')
  assert.equal(containsPhrase('underwear', 'wear'), false)
})

test('containsPhrase: is case-insensitive and handles empty input', () => {
  assert.equal(containsPhrase('Show Me ELECTRONICS', 'electronics'), true)
  assert.equal(containsPhrase('', 'book'), false)
  // An empty phrase builds a regex that requires a separator, so it does not
  // match arbitrary text. Recorded because the behaviour is non-obvious.
  assert.equal(containsPhrase('anything', ''), false)
})

test('tokenize: stems, drops stopwords and 1-character noise', () => {
  assert.deepEqual(tokenize('show me the headphones'), ['headphone'])
  assert.deepEqual(tokenize('a b headphones'), ['headphone'])
  assert.deepEqual(tokenize(''), [])
})

test('tokenize: keepStopwords option retains stopwords', () => {
  const withStop = tokenize('show me the headphones', { keepStopwords: true })
  assert.ok(withStop.includes('the'))
  assert.ok(withStop.includes('headphone'))
})

test('contentWords: removes stopwords but keeps other qualifiers', () => {
  assert.deepEqual(contentWords('show me the best rated books'), ['rated', 'books'])
  assert.deepEqual(contentWords(''), [])
  assert.deepEqual(contentWords('the a an'), [])
})

test('FILLER: is a Set of request verbs, and never contains real product words', () => {
  assert.equal(FILLER instanceof Set, true)
  for (const word of ['show', 'recommend', 'browse', 'sell']) {
    assert.ok(FILLER.has(word), `expected "${word}" to be filler`)
  }
  for (const word of ['headphones', 'yoga', 'necklace']) {
    assert.equal(FILLER.has(word), false, `"${word}" is a product word, not filler`)
  }
})
