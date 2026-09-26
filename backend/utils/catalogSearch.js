import Product from '../models/Product.js'
import Category from '../models/Category.js'

/* Extra natural-language synonyms per category slug. The slug itself is
   always matched, so adding a category to the database needs no code change
   here — previously the keyword map was hardcoded and silently drifted out of
   sync with the real category values (e.g. it emitted `clothing` and `home`
   while the database stored `fashion` and `home-living`). */
const SYNONYMS = {
  fashion: ['clothes', 'clothing', 'apparel', 'wear', 'shirt', 'dress', 'jeans', 'shoes', 'sneakers'],
  'home-living': ['home', 'kitchen', 'living', 'furniture', 'decor', 'house', 'bedroom'],
  electronics: ['electronic', 'gadget', 'gadgets', 'tech', 'technology', 'devices', 'computer'],
  beauty: ['beauty', 'skincare', 'cosmetic', 'cosmetics', 'makeup', 'grooming'],
  sports: ['sport', 'sports', 'fitness', 'gym', 'outdoor', 'workout'],
  books: ['book', 'books', 'reading', 'literature', 'novel'],
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Word-boundary test, so "wear" no longer matches "software" or "underwear"
    is still caught by the synonym list, and "book" no longer matches "notebook". */
const hasWord = (text, word) =>
  new RegExp(`(^|[^a-z0-9])${escapeRegex(word)}([^a-z0-9]|$)`, 'i').test(text)

/* ---------- Intent parsing ---------- */

export const parseIntents = (rawMessage) => {
  const text = String(rawMessage || '').toLowerCase().trim()
  const filter = {}
  const intents = {}

  /* Price */
  const between = text.match(/between\s*(?:rs\.?\s*)?(\d[\d,]*)\s*(?:and|-|to)\s*(?:rs\.?\s*)?(\d[\d,]*)/)
  const under = text.match(/(?:under|below|less than|cheaper than|max|up to|within)\s*(?:rs\.?\s*)?(\d[\d,]*)/)
  const above = text.match(/(?:above|over|more than|min|at least|greater than)\s*(?:rs\.?\s*)?(\d[\d,]*)/)
  const num = (v) => Number(String(v).replace(/,/g, ''))

  if (between) {
    filter.price = { $gte: num(between[1]), $lte: num(between[2]) }
    intents.priceRange = true
  } else if (under) {
    filter.price = { $lte: num(under[1]) }
    intents.maxPrice = num(under[1])
  } else if (above) {
    filter.price = { $gte: num(above[1]) }
    intents.minPrice = num(above[1])
  }

  /* Discounts */
  if (/\b(deals?|discounts?|discounted|sale|on sale|offers?|reduced)\b/.test(text)) {
    intents.dealsOnly = true
    filter.originalPrice = { $exists: true, $ne: null }
  }

  /* Availability */
  if (/\b(in stock|available|ready to ship)\b/.test(text)) {
    intents.inStockOnly = true
    filter.stock = { $gt: 0 }
  }

  /* Sorting */
  if (/\b(cheapest|lowest|least expensive|budget)\b/.test(text)) intents.sort = { price: 1 }
  else if (/\b(most expensive|priciest|highest price|premium)\b/.test(text)) intents.sort = { price: -1 }
  else if (/\b(best rated|highest rated|top rated|highest rated)\b/.test(text)) intents.sort = { rating: -1, numReviews: -1 }
  else if (/\b(most reviewed|popular|best selling|top selling)\b/.test(text)) intents.sort = { numReviews: -1 }
  else if (/\b(newest|recent|latest)\b/.test(text)) intents.sort = { createdAt: -1 }
  else intents.sort = { createdAt: -1 }

  return { text, filter, intents }
}

/** Resolves a category slug from free text, using the live category list so
    the assistant can never again invent a category that does not exist. */
export const detectCategory = async (text) => {
  const categories = await Category.find().select('name slug').lean()
  if (!categories.length) return null

  for (const cat of categories) {
    const slug = String(cat.slug).toLowerCase()
    if (hasWord(text, slug) || hasWord(text, String(cat.name).toLowerCase())) return slug

    const extras = SYNONYMS[slug] || []
    if (extras.some((w) => hasWord(text, w))) return slug
  }
  return null
}

/* ---------- Retrieval ---------- */

const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Free-text search across name/description/tags, ignoring filler words so
    "show me some cool headphones" still matches "headphones". */
const SEARCH_STOPWORDS = new Set([
  'show', 'me', 'some', 'find', 'search', 'looking', 'for', 'a', 'an', 'the',
  'any', 'good', 'best', 'nice', 'cool', 'please', 'give', 'get', 'i', 'want',
  'need', 'have', 'display', 'list', 'all', 'products', 'product', 'items', 'item',
  'do', 'you', 'have', 'what', 'whats', 'what\'s', 'is', 'are', 'of', 'in', 'to',
])

const extractTerms = (text) =>
  text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SEARCH_STOPWORDS.has(w))

/**
 * Finds real products to ground the assistant's answer. Returns a small set
 * of candidates; the caller is responsible for phrasing the reply.
 */
export const searchCatalog = async (rawMessage, { limit = 8 } = {}) => {
  const { text, filter, intents } = parseIntents(rawMessage)

  const query = { ...filter }

  const category = await detectCategory(text)
  if (category) query.category = category

  const terms = extractTerms(text)
  if (terms.length) {
    const or = []
    for (const term of terms.slice(0, 6)) {
      const rx = new RegExp(escapeForRegex(term), 'i')
      or.push({ name: rx }, { description: rx }, { tags: rx })
    }
    query.$or = or
  }

  /* If the terms were too generic to be useful (e.g. the whole sentence
     matched nothing), fall back to a broad browse rather than replying
     "no results" for a question that was really about something else. */
  let products = await Product.find(query).sort(intents.sort).limit(limit).lean()

  if (!products.length && (category || Object.keys(filter).length)) {
    const relaxed = {}
    if (category) relaxed.category = category
    else Object.assign(relaxed, filter)
    products = await Product.find(relaxed).sort(intents.sort).limit(limit).lean()
  }

  if (!products.length) {
    products = await Product.find({}).sort(intents.sort).limit(limit).lean()
  }

  return {
    products: products.map((p) => ({
      id: String(p._id),
      name: p.name,
      price: p.price,
      image: p.image,
      originalPrice: p.originalPrice ?? null,
      category: p.category,
      rating: p.rating ?? 0,
      numReviews: p.numReviews ?? 0,
      stock: p.stock ?? 0,
      inStock: (p.stock ?? 0) > 0,
      isDeal: Boolean(p.originalPrice && p.originalPrice > p.price),
      description: (p.description || '').slice(0, 300),
      tags: (p.tags || []).slice(0, 6),
    })),
    intents,
    category,
  }
}
