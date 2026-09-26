import Product from '../../models/Product.js'
import Category from '../../models/Category.js'
import { CatalogIndex } from './bm25.js'
import { understand } from './understand.js'
import {
  describeResults,
  noResults,
  clarify,
  describeCatalogue,
  describeRefinement,
  capabilities,
  categoryLabel,
} from './respond.js'
import { normalise } from './text.js'

const RESULT_LIMIT = 6

/* Indexes are rebuilt lazily: a catalogue change should be picked up without
   a restart, but not at the cost of rebuilding on every message. */
let cache = { products: null, at: 0 }
const TTL_MS = 30_000

const loadCatalogue = async () => {
  if (cache.products && Date.now() - cache.at < TTL_MS) return cache.products
  const products = await Product.find({}).lean()
  cache = { products, at: Date.now() }
  return products
}

const invalidate = () => {
  cache = { products: null, at: 0 }
}

/** Introspection for the health endpoint. */
export const getStats = () => ({
  products: cache.products ? cache.products.length : null,
  indexed: Boolean(cache.products),
  vocabulary: cache.products ? new CatalogIndex(cache.products).vocabulary().size : 0,
})

/** Build the Mongo filter implied by a understood query. */
const buildFilter = (u) => {
  const filter = {}

  if (u.category) filter.category = u.category

  if (u.price) {
    filter.price = { $gte: u.price.min, $lte: u.price.max }
  } else {
    if (u.minPrice != null || u.maxPrice != null) {
      filter.price = {}
      if (u.minPrice != null) filter.price.$gte = u.minPrice
      if (u.maxPrice != null) filter.price.$lte = u.maxPrice
    }
  }

  if (u.dealsOnly) filter.originalPrice = { $exists: true, $ne: null }
  if (u.inStockOnly) filter.stock = { $gt: 0 }

  return filter
}

/** Apply attribute filters in JS, where matching a word inside text is fine. */
const matchesAttributes = (product, attributes) => {
  const haystack = normalise(
    [product.name, product.description, (product.tags || []).join(' '), product.category].join(' '),
  )
  return Object.values(attributes).every((value) => haystack.includes(normalise(value)))
}

const sortProducts = (products, sort) => {
  if (!sort) return products
  const [field, dir] = Object.entries(sort)[0]
  return [...products].sort((a, b) => {
    const av = a[field] ?? 0
    const bv = b[field] ?? 0
    return (av - bv) * (dir === 1 ? 1 : -1)
  })
}

/** Apply a sort + limit against the whole catalogue (used for open questions). */
const sortAndSlice = (products, u) => {
  const sorted = sortProducts(products, u.sort)
  return sorted.slice(0, RESULT_LIMIT)
}

const shape = (p) => ({
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
})

/**
 * Answer a message. Purely local: catalogue retrieval, BM25 scoring and
 * templated generation. No network calls.
 *
 * @param {string} message
 * @param {object} [options]
 * @param {object} [options.previous] last assistant turn, for refinements
 */
export const answer = async (message, { previous = null } = {}) => {
  const all = await loadCatalogue()
  const index = new CatalogIndex(all)
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))]

  const u = understand(message, { vocabulary: index.vocabulary() })

  /* --- Meta questions --- */
  if (/\b(help|what can you do|how do i use|commands|capabilities)\b/.test(u.text)) {
    return { reply: capabilities(), products: [], meta: { kind: 'help' } }
  }

  const hasSignal =
    Boolean(u.category) ||
    Boolean(u.terms.length) ||
    u.minPrice != null ||
    u.maxPrice != null ||
    Boolean(u.price) ||
    u.dealsOnly ||
    u.inStockOnly ||
    Object.keys(u.attributes).length > 0 ||
    /* A bare sort request ("best rated", "cheapest") is actionable on its own. */
    Boolean(u.sort) ||
    u.intents.length > 0

  /* --- Nothing actionable --- */
  if (!hasSignal) {
    if (u.isQuestion) {
      return {
        reply: describeCatalogue(sortAndSlice(all, u), categories),
        products: sortAndSlice(all, u).map(shape),
        meta: { kind: 'catalogue' },
      }
    }
    return { reply: clarify(u), products: [], meta: { kind: 'clarify' } }
  }

  const filter = buildFilter(u)

  /* Terms are always applied when present — "cheapest headphones" is a real
     product search with a sort, not a browse. Whether the terms actually
     match anything is decided by the ranking result below, which is a far
     better test than guessing from the shape of the query. */
  const hardSignal =
    Boolean(u.category) ||
    u.minPrice != null ||
    u.maxPrice != null ||
    Boolean(u.price) ||
    u.dealsOnly ||
    u.inStockOnly ||
    Object.keys(u.attributes).length > 0

  let candidates = all.filter(
    (p) =>
      Object.entries(filter).every(([key, value]) => {
        if (key === 'price') {
          return (
            p.price >= (value.$gte ?? -Infinity) && p.price <= (value.$lte ?? Infinity)
          )
        }
        if (key === 'category') return p.category === value
        if (key === 'stock') return (p.stock ?? 0) > 0
        if (key === 'originalPrice') return Boolean(p.originalPrice && p.originalPrice > p.price)
        return true
      }),
  )

  /* BM25 over the candidate set, using the query's product terms. */
  if (u.terms.length) {
    const subIndex = new CatalogIndex(candidates)
    const ranked = subIndex.search(u.terms).map((r) => r.product)
    if (ranked.length) {
      candidates = ranked
    } else if (!hardSignal) {
      /* Stray noun with nothing to match it ("newest arrivals"): browse
         rather than reporting zero results. */
      candidates = []
    }
  }

  if (Object.keys(u.attributes).length) {
    candidates = candidates.filter((p) => matchesAttributes(p, u.attributes))
  }

  const sorted = sortProducts(candidates, u.sort)
  const isRefinement = Boolean(previous?.products?.length) && u.isRefinement

  /* Nothing matched the keywords and there was no hard constraint. If the user
     asked for an ordering ("newest arrivals"), the leftover noun was noise and
     a plain browse is right. If they named a product we do not stock
     ("running shoes"), say so rather than pretending the browse answered it. */
  if (!sorted.length && !hardSignal && u.sort) {
    const browsed = sortAndSlice(all, u)
    return {
      reply: describeResults({ query: u, products: browsed, total: all.length }),
      products: browsed.map(shape),
      meta: { kind: 'browse', query: describeQuery(u), total: all.length },
    }
  }

  if (!sorted.length) {
    /* Widen once: keep hard filters, drop the text match. Say plainly that
       the search was widened — claiming "nothing found" and then listing
       products reads as a contradiction. */
    const relaxed = all.filter(
      (p) =>
        matchesAttributes(p, u.attributes) &&
        (!u.category || p.category === u.category) &&
        (!u.maxPrice || p.price <= u.maxPrice) &&
        (!u.minPrice || p.price >= u.minPrice) &&
        (!u.dealsOnly || (p.originalPrice && p.originalPrice > p.price)) &&
        (!u.inStockOnly || (p.stock ?? 0) > 0),
    )

    if (relaxed.length) {
      const fallback = sortAndSlice(relaxed, u)
      const scope = categoryLabel(u.category) || 'the store'
      const missing = u.terms.length
        ? `I don't stock ${u.originalTerms.slice(0, 3).map((t) => `"${t}"`).join(' or ')}.`
        : 'Nothing matched that.'
      return {
        reply: `${missing} Here is what ${scope} has that is closest to what you asked for.`,
        products: fallback.map(shape),
        meta: { kind: 'widened', query: describeQuery(u), total: relaxed.length },
      }
    }

    return {
      reply: noResults(u),
      products: [],
      meta: { kind: 'none', query: describeQuery(u) },
    }
  }

  const total = sorted.length
  const reply = isRefinement
    ? describeRefinement({
        query: u,
        products: sorted.slice(0, RESULT_LIMIT),
        previousNames: previous.products.map((p) => p.name),
      })
    : describeResults({ query: u, products: sorted, total })

  return {
    reply,
    products: sorted.slice(0, RESULT_LIMIT).map(shape),
    meta: {
      kind: isRefinement ? 'refined' : 'results',
      query: describeQuery(u),
      total,
      corrected: u.unknownTerms.length ? u.unknownTerms : undefined,
    },
  }
}

/** Compact, log-friendly summary of what the engine understood. */
const describeQuery = (u) => {
  const bits = []
  if (u.category) bits.push(u.category)
  if (u.price) bits.push(`${u.price.min}-${u.price.max}`)
  if (u.maxPrice != null) bits.push(`<=${u.maxPrice}`)
  if (u.minPrice != null) bits.push(`>=${u.minPrice}`)
  if (u.dealsOnly) bits.push('deals')
  if (u.inStockOnly) bits.push('stock')
  if (u.terms.length) bits.push(u.terms.join('+'))
  return bits.join(' ') || 'browse'
}

export const resetIndex = invalidate
