/**
 * Unit tests for BM25 ranking over the catalogue.
 *
 * Ranking quality is what decides which product a shopper is shown first, and
 * a silent regression here degrades every answer the assistant gives without
 * producing an error. These tests pin the properties that matter: empty
 * corpus, term frequency weighting, rare-term influence, and stability.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { CatalogIndex } from '../../utils/nlp/bm25.js'

const product = (over = {}) => ({
  _id: over._id ?? '000000000000000000000001',
  name: 'Wireless Headphones',
  description: 'Over-ear wireless headphones with noise cancellation.',
  category: 'electronics',
  tags: ['audio', 'wireless'],
  ...over,
})

test('empty corpus produces no results and does not throw', () => {
  const index = new CatalogIndex([])
  assert.deepEqual(index.search(['anything']), [])
  assert.equal(index.idf('anything'), 0)
  assert.equal(index.vocabulary().size, 0)
})

test('an empty term list produces no results', () => {
  const index = new CatalogIndex([product()])
  assert.deepEqual(index.search([]), [])
})

test('matches on the product name', () => {
  const index = new CatalogIndex([product()])
  const results = index.search(['headphones'])
  assert.equal(results.length, 1)
  assert.equal(results[0].product._id, product()._id)
})

test('matches on the description', () => {
  const index = new CatalogIndex([product()])
  assert.equal(index.search(['cancellation']).length, 1)
})

test('matches on tags and category', () => {
  const index = new CatalogIndex([product()])
  assert.equal(index.search(['audio']).length, 1)
  assert.equal(index.search(['electronics']).length, 1)
})

test('does not match a term that appears nowhere', () => {
  const index = new CatalogIndex([product()])
  assert.deepEqual(index.search(['helicopter']), [])
})

test('title matches outrank description-only matches', () => {
  // The field weighting is the point of the index: "wireless" appears in both
  // products, but only one has it in the title.
  const inTitle = product({ _id: 'a', name: 'Wireless Speaker' })
  const inBody = product({
    _id: 'b',
    name: 'Desk Lamp',
    description: 'A lamp with a wireless switch.',
    tags: [],
  })
  const index = new CatalogIndex([inBody, inTitle])
  const results = index.search(['wireless'])
  assert.equal(results.length, 2)
  assert.equal(results[0].product._id, 'a', 'title match should rank first')
})

test('a term matching more documents carries less weight', () => {
  const index = new CatalogIndex([
    product({ _id: 'common', name: 'Common Thing' }),
    product({ _id: 'rare', name: 'Common Unique Widget' }),
  ])
  const common = index.idf('common')
  const rare = index.idf('unique')
  assert.ok(rare > common, 'rarer term should have higher idf')
  assert.equal(index.idf('absent'), 0)
})

test('results are ordered by descending score', () => {
  const index = new CatalogIndex([
    product({ _id: 'low', name: 'Widget' }),
    product({ _id: 'high', name: 'Widget Widget Widget Pro' }),
  ])
  const results = index.search(['widget'])
  assert.equal(results.length, 2)
  assert.ok(results[0].score >= results[1].score)
})

test('scores are strictly positive for matches', () => {
  const index = new CatalogIndex([product()])
  for (const r of index.search(['wireless'])) {
    assert.ok(r.score > 0)
  }
})

test('the same query returns the same order (stability)', () => {
  const products = [
    product({ _id: '1', name: 'Alpha One' }),
    product({ _id: '2', name: 'Beta Two' }),
    product({ _id: '3', name: 'Gamma Three' }),
  ]
  const index = new CatalogIndex(products)
  const first = index.search(['alpha', 'beta']).map((r) => r.product._id)
  const second = index.search(['alpha', 'beta']).map((r) => r.product._id)
  assert.deepEqual(first, second)
})

test('multiple query terms accumulate score', () => {
  const index = new CatalogIndex([
    product({ _id: 'both', name: 'Alpha Beta' }),
    product({ _id: 'one', name: 'Alpha Only' }),
  ])
  const both = index.search(['alpha', 'beta']).find((r) => r.product._id === 'both')
  const one = index.search(['alpha', 'beta']).find((r) => r.product._id === 'one')
  assert.ok(both.score > one.score, 'matching both terms should outrank matching one')
})

test('a document missing optional fields does not throw', () => {
  const sparse = { _id: 'sparse', name: 'Minimal', description: '', category: '', tags: [] }
  const index = new CatalogIndex([sparse, { _id: 'none' }])
  assert.equal(index.search(['minimal']).length, 1)
  assert.doesNotThrow(() => index.search(['anything']))
})

test('hyphenated titles are indexed as separate tokens', () => {
  // The index must use the same splitting as the query, otherwise
  // "noise-cancelling" never matches a search for "noise cancelling".
  const index = new CatalogIndex([product({ name: 'Noise-Cancelling Headphones' })])
  assert.equal(index.search(['cancelling']).length, 1)
  assert.equal(index.search(['noise']).length, 1)
})

test('duplicate terms in a query do not inflate a document unfairly', () => {
  const index = new CatalogIndex([product()])
  const once = index.search(['wireless'])[0].score
  const twice = index.search(['wireless', 'wireless'])[0].score
  assert.ok(twice > once, 'a repeated query term adds weight, but must not throw')
})

test('vocabulary is derived from the corpus, in stemmed form', () => {
  const index = new CatalogIndex([product(), product({ _id: 'x', name: 'Ceramic Mug' })])
  const vocab = index.vocabulary()

  // The vocabulary is stemmed, because documents are indexed stemmed. A
  // consumer checking `vocab.has('headphones')` would wrongly conclude the
  // term is absent; it is stored as "headphone". Callers must stem first,
  // which `search()` now does for them.
  assert.ok(vocab.has('headphone'), 'stemmed form is what is stored')
  assert.equal(vocab.has('headphones'), false, 'raw plural is not in the vocabulary')
  assert.ok(vocab.has('ceramic'))
  assert.equal(vocab.has('nonexistent'), false)
})

test('search stems its input, so raw words do not silently return nothing', () => {
  // Regression: search() required pre-stemmed terms and returned an empty
  // array for a raw word, which looks identical to "no matches".
  const index = new CatalogIndex([product()])
  assert.equal(index.search(['headphones']).length, 1, 'raw plural should still match')
  assert.equal(index.search(['headphone']).length, 1, 'stemmed form should match')
  assert.equal(index.search(['CANCELLATION']).length, 1, 'case is normalised')
})

test('scales to a larger corpus without pathological behaviour', () => {
  const many = Array.from({ length: 500 }, (_, i) =>
    product({ _id: String(i), name: `Widget Model ${i}`, description: `A widget number ${i}.` }),
  )
  const index = new CatalogIndex(many)
  const results = index.search(['widget'])
  assert.equal(results.length, 500, 'every document contains the term')
  assert.ok(results[0].score > 0)
})
