import { titleCase } from './text.js'

/**
 * Response generation.
 *
 * There is no language model here — replies are composed from the query that
 * was actually understood plus the results that were actually found. That is
 * the trade-off: phrasing is templated and therefore predictable, but nothing
 * can be invented. Variants keep repeated answers from feeling identical.
 */

const money = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`

/* Deterministic-ish variant picker so a given turn does not flip wording
   between re-renders. */
const pick = (variants, seed) => variants[Math.abs(seed) % variants.length]

const seedFrom = (s) => {
  let h = 0
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) | 0
  return h
}

const productPhrase = (products) => {
  const names = products.slice(0, 3).map((p) => p.name)
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]}, ${names[1]} and ${names[2]}`
}

/** Compose the reply for a successful search. */
export const describeResults = ({ query, products, total, limit = 6 }) => {
  const shown = products.slice(0, limit)
  const seed = seedFrom(query.raw + products.length)

  if (!products.length) {
    return noResults(query)
  }

  const lead = pick(
    [
      `Found ${total} ${total === 1 ? 'match' : 'matches'}.`,
      `I found ${total} ${total === 1 ? 'product' : 'products'} for that.`,
      `${total} ${total === 1 ? 'result' : 'results'} — here ${total === 1 ? 'it is' : 'they are'}.`,
    ],
    seed,
  )

  const detail = pick(
    [
      `Best match: ${productPhrase(shown)}.`,
      `Top ${shown.length}: ${productPhrase(shown)}.`,
      `Closest ${shown.length === 1 ? 'one' : 'ones'}: ${productPhrase(shown)}.`,
    ],
    seed >> 1,
  )

  const qualifier = []
  if (query.maxPrice != null) qualifier.push(`under ${money(query.maxPrice)}`)
  if (query.minPrice != null) qualifier.push(`from ${money(query.minPrice)}`)
  if (query.dealsOnly) qualifier.push('currently discounted')
  if (query.inStockOnly) qualifier.push('in stock')

  const tail = qualifier.length
    ? ` Every result is ${qualifier.length > 1 ? qualifier.slice(0, -1).join(', ') + ' and ' + qualifier[qualifier.length - 1] : qualifier[0]}.`
    : ''

  return `${lead} ${detail}${tail}`
}

/** Honest "I did not find it" — says what was searched, never guesses. */
export const noResults = (query) => {
  const seed = seedFrom(query.raw)

  const what = query.category
    ? `anything in ${query.category.replace('-', ' ')}`
    : query.terms.length
      ? `"${query.originalTerms.slice(0, 3).join('", "')}"`
      : 'that'

  const base = pick(
    [
      `I could not find ${what} in the store.`,
      `Nothing in the catalogue matches ${what}.`,
      `No products matched ${what}.`,
    ],
    seed,
  )

  const suggestion = query.category
    ? `Try browsing the ${query.category.replace('-', ' ')} category instead.`
    : 'Try different keywords, or ask me what categories exist.'

  return `${base} ${suggestion}`
}

/** Reply when the query is too vague to act on. */
export const clarify = (query) => {
  const seed = seedFrom(query.raw)
  return pick(
    [
      'Tell me a bit more — a category, a product name, or a price range works well. For example "wireless headphones under 2000".',
      'I can narrow things down if you give me a category, a keyword, or a budget. What are you after?',
      'Happy to help — try naming a product, a category, or a price range.',
    ],
    seed,
  )
}

/** Explain what the store sells, for open-ended questions. */
export const describeCatalogue = (products, categories) => {
  const names = categories.slice(0, 6).map((c) => c.replace('-', ' '))
  const list =
    names.length <= 2
      ? names.join(' and ')
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

  const examples = products
    .slice(0, 3)
    .map((p) => `${p.name} (${money(p.price)})`)
    .join(', ')

  return `We stock ${products.length} products across ${list}. For example: ${examples}. You can ask me for a category, a price range, current deals, or something for a particular person.`
}

/** Apply a refinement to a previous result set. */
export const describeRefinement = ({ query, products, previousNames }) => {
  if (!products.length) {
    return `Nothing left after that filter, so I have widened it back a little. The closest earlier matches were ${previousNames.slice(0, 2).join(' and ')}.`
  }
  const seed = seedFrom(query.raw + products.length)
  return pick(
    [
      `Narrowed it down to ${products.length}: ${productPhrase(products)}.`,
      `After that, ${products.length} ${products.length === 1 ? 'option' : 'options'} left — ${productPhrase(products)}.`,
      `Filtered down to ${productPhrase(products)}.`,
    ],
    seed,
  )
}

/** Help text. */
export const capabilities = () =>
  [
    'I can help with:',
    '• categories — "show me electronics", "something in fashion"',
    '• prices — "under Rs 500", "between 1000 and 3000"',
    '• sorting — "cheapest", "best rated", "most reviewed", "newest"',
    '• filtering — "deals", "in stock"',
    '• specific products — "wireless headphones", "yoga mat"',
    '• gift ideas — "gift for my dad under 2000"',
  ].join('\n')

/** Short label for a category slug. */
export const categoryLabel = (slug) => (slug ? titleCase(String(slug).replace(/-/g, ' ')) : null)
