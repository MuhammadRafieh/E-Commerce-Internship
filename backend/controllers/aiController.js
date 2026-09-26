import { answer, getStats } from '../utils/nlp/engine.js'
import { rateLimitBackend } from '../middleware/rateLimiter.js'

const MAX_MESSAGE_LENGTH = 500
const RESULT_CONTEXT_LIMIT = 6

/**
 * POST /api/ai/chat
 *
 * The assistant runs entirely locally: the message is parsed for intent and
 * entities, matching products are retrieved from MongoDB and ranked with
 * BM25, and the reply is composed from those results.
 *
 * There is no language model in the loop. That is deliberate — it means the
 * assistant cannot invent a product, price, or discount, because every fact in
 * a reply comes from a database row. The trade-off is that replies are
 * templated rather than freely composed, so phrasing is predictable.
 */
export const chat = async (req, res) => {
  const { message, previous } = req.body || {}

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      reply: 'Type a message and I will help you find something.',
      products: [],
    })
  }

  const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH)

  try {
    /* The previous assistant turn enables refinements ("cheaper", "something
       else"). Only product names are read from it, and only as context. */
    let prior = null
    if (previous && Array.isArray(previous.products)) {
      const names = previous.products
        .filter((p) => p && typeof p.name === 'string')
        .slice(0, RESULT_CONTEXT_LIMIT)
        .map((p) => ({ name: p.name }))
      if (names.length) prior = { products: names }
    }

    const { reply, products, meta } = await answer(trimmed, { previous: prior })

    res.json({ reply, products, source: 'local', meta })
  } catch (err) {
    console.error('[ai] chat failed:', err)
    res.status(500).json({
      reply: 'Sorry, something went wrong on my end. Please try again.',
      products: [],
    })
  }
}

/** GET /api/ai/health — engine status, index size, and rate-limit backend. */
export const health = async (req, res) => {
  try {
    res.json({
      ok: true,
      engine: 'local-nlp',
      rateLimit: rateLimitBackend(),
      ...getStats(),
    })
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message })
  }
}
