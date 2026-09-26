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
import { splitWords, stem } from './text.js'

/** Length of the common prefix of two strings. */
const sharedPrefix = (a, b) => {
  let i = 0
  const n = Math.min(a.length, b.length)
  while (i < n && a[i] === b[i]) i++
  return i
}

const RESULT_LIMIT = 6

/* Indexes are rebuilt lazily: a catalogue change should be picked up without
   a restart, but not at the cost of rebuilding on every message. The index is
   cached alongside the products because building it is O(documents x terms) —
   trivial for 11 products, wasteful for thousands. */
let cache = { products: null, index: null, at: 0 }
const TTL_MS = 30_000

const loadCatalogue = async () => {
  if (cache.products && Date.now() - cache.at < TTL_MS) return cache.products
  const products = await Product.find({}).lean()
  cache = { products, index: new CatalogIndex(products), at: Date.now() }
  return products
}

const invalidate = () => {
  cache = { products: null, index: null, at: 0 }
}

/** Introspection for the health endpoint. */
export const getStats = () => ({
  products: cache.products ? cache.products.length : null,
  indexed: Boolean(cache.index),
  vocabulary: cache.index ? cache.index.vocabulary().size : 0,
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

/**
 * Apply attribute filters.
 *
 * Matching is done per token with a shared-prefix comparison rather than a
 * plain substring test, because a shopper's words and the product's wording
 * routinely differ by a hyphen or a suffix: asking for "noise cancelling" must
 * match "Noise-Cancelling" in the title and "noise cancellation" in the
 * description. A substring test fails both.
 */
const matchesAttributes = (product, attributes) => {
  const text = [product.name, product.description, (product.tags || []).join(' '), product.category]
    .filter(Boolean)
    .join(' ')

  const productTokens = new Set(splitWords(text).map(stem))

  return Object.values(attributes).every((value) => {
    const wanted = splitWords(value).filter((w) => w.length > 1)
    if (!wanted.length) return true

    return wanted.every((w) => {
      const target = stem(w)
      if (productTokens.has(target)) return true
      /* Allow morphological variants: "cancelling" vs "cancellation". */
      for (const token of productTokens) {
        if (Math.abs(token.length - target.length) > 4) continue
        if (sharedPrefix(token, target) >= 4) return true
      }
      return false
    })
  })
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
  const index = cache.index
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))]

  const u = understand(message, {
    vocabulary: index.vocabulary(),
    categories,
  })

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

  const searchTerms = u.terms.length > 0
  let termsMatchedNothing = false

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
  if (searchTerms) {
    const subIndex = new CatalogIndex(candidates)
    const ranked = subIndex.search(u.terms).map((r) => r.product)
    if (ranked.length) {
      candidates = ranked
    } else {
      /* The words being searched for exist in no product. Record that
         regardless of any other filter, otherwise the unfiltered set is
         reported as a match — which is how "running shoes" came back with
         "I found 11 products". What happens next depends on whether the user
         also asked for a sort or a hard filter. */
      termsMatchedNothing = true
      candidates = []
    }
  }

  if (Object.keys(u.attributes).length) {
    candidates = candidates.filter((p) => matchesAttributes(p, u.attributes))
  }

  const sorted = sortProducts(candidates, u.sort)
  const isRefinement = Boolean(previous?.products?.length) && u.isRefinement

  /* A bare sort request with leftover nouns ("newest arrivals") is a browse,
     not a failed search. Checked first so it is not swallowed below. */
  if (!sorted.length && !hardSignal && u.sort) {
    const browsed = sortAndSlice(all, u)
    return {
      reply: describeResults({ query: u, products: browsed, total: all.length }),
      products: browsed.map(shape),
      meta: { kind: 'browse', query: describeQuery(u), total: all.length },
    }
  }

  /* Nothing survived. Work out the real reason before answering, so the reply
     names the thing that was actually missing instead of blaming a word that
     does exist ("gold necklace" must not report that there is no necklace). */
  if (!sorted.length) {
    const named = u.originalTerms.slice(0, 3).map((t) => `"${t}"`).join(' or ')

    let reason
    if (termsMatchedNothing) {
      reason = `I don't stock ${named}.`
    } else if (Object.keys(u.attributes).length) {
      const attrs = Object.values(u.attributes).slice(0, 2).map((a) => `"${a}"`).join(' or ')
      reason = `Nothing here matches ${attrs}.`
    } else if (u.category && !all.some((p) => p.category === u.category)) {
      reason = `We don't have a ${u.category.replace(/-/g, ' ')} section yet.`
    } else {
      reason = noResults(u)
    }

    /* Widen only the search, never the stated reason. */
    const relaxed = all.filter(
      (p) =>
        (!u.category || p.category === u.category) &&
        (!u.maxPrice || p.price <= u.maxPrice) &&
        (!u.minPrice || p.price >= u.minPrice) &&
        (!u.dealsOnly || (p.originalPrice && p.originalPrice > p.price)) &&
        (!u.inStockOnly || (p.stock ?? 0) > 0) &&
        (termsMatchedNothing || matchesAttributes(p, u.attributes)),
    )

    if (relaxed.length && (termsMatchedNothing || Object.keys(u.attributes).length)) {
      const fallback = sortAndSlice(relaxed, u)
      const scope = categoryLabel(u.category) || 'the store'
      return {
        reply: `${reason} Here is the closest we have in ${scope}.`,
        products: fallback.map(shape),
        meta: { kind: 'widened', query: describeQuery(u), total: relaxed.length },
      }
    }

    return {
      reply: reason,
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
