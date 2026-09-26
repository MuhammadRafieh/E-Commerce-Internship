/**
 * BM25 ranking over the product catalogue.
 *
 * The previous implementation matched query terms with a naive `$or` of
 * regexes, which ranked everything equally and matched substrings inside
 * unrelated words. BM25 scores each candidate against the corpus, so a title
 * hit outranks a description hit and rare terms count for more.
 */

import { stem, splitWords } from './text.js'

const K1 = 1.5
const B = 0.75

const words = (s) => splitWords(s).map(stem)

/**
 * Build the searchable text for one product, with field weighting.
 *
 * Terms are stemmed here for the same reason query terms are: if documents are
 * indexed as "headphones" but queries are stemmed to "headphone", BM25 finds
 * nothing and the ranking silently degrades to a browse.
 */
const docTerms = (p) => {
  const name = words(p.name)
  const category = words(p.category)
  const tags = (p.tags || []).flatMap((t) => words(t))
  const description = words(p.description)

  return [
    /* Name is repeated so it weighs more heavily than the description. */
    ...name,
    ...name,
    ...name,
    ...category,
    ...tags,
    ...description,
  ].filter(Boolean)
}

export class CatalogIndex {
  constructor(products = []) {
    this.products = products
    this.docs = products.map(docTerms)
    this.df = new Map()
    this.avgLength = 0

    for (const terms of this.docs) {
      this.avgLength += terms.length
      for (const t of new Set(terms)) {
        this.df.set(t, (this.df.get(t) || 0) + 1)
      }
    }

    this.N = this.docs.length
    this.avgLength = this.N ? this.avgLength / this.N : 0
  }

  /** Vocabulary, for fuzzy typo correction. */
  vocabulary() {
    return new Set(this.df.keys())
  }

  idf(term) {
    const n = this.df.get(term) || 0
    if (!n) return 0
    return Math.log(1 + (this.N - n + 0.5) / (n + 0.5))
  }

  /**
   * Score every product against `terms`.
   * Returns an array of { product, score } sorted best-first.
   */
  search(terms) {
    if (!terms.length || !this.N) return []

    const scores = new Array(this.N).fill(0)

    for (const term of terms) {
      const idf = this.idf(term)
      if (idf === 0) continue

      for (let i = 0; i < this.N; i++) {
        const doc = this.docs[i]
        let tf = 0
        for (const t of doc) if (t === term) tf++
        if (!tf) continue

        const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (doc.length / (this.avgLength || 1))))
        scores[i] += idf * norm
      }
    }

    return this.products
      .map((product, i) => ({ product, score: scores[i] }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
  }
}
