import { searchCatalog } from '../utils/catalogSearch.js'
import { complete, isLLMEnabled, llmInfo } from '../utils/llm.js'

const MAX_MESSAGE_LENGTH = 500
const MAX_HISTORY = 10

const currency = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`

const buildSystemPrompt = (products) => {
  const lines = products.map((p) => {
    const deal = p.isDeal ? ` (was ${currency(p.originalPrice)}, now ${currency(p.price)})` : ''
    const stock = p.inStock ? 'in stock' : 'out of stock'
    return `- [${p.id}] ${p.name} — ${currency(p.price)}${deal} | ${p.category} | rated ${p.rating}/5 from ${p.numReviews} reviews | ${stock}\n  ${p.description}`
  })

  return [
    'You are the shopping assistant for an online store that sells in INR (Indian Rupees).',
    '',
    'Answer using ONLY the catalogue below. These are real products that exist in the store.',
    '',
    'CATALOGUE:',
    lines.length ? lines.join('\n') : '(no products matched the request)',
    '',
    'Rules:',
    '- Never invent a product, price, or discount that is not in the catalogue.',
    '- If the catalogue is empty, say you could not find a match and suggest different wording.',
    '- Keep replies to 2-3 short sentences. Be friendly but concise.',
    '- Mention the product names and prices you are recommending.',
    '- Do not use markdown, bullet points, or emoji.',
    '- You cannot perform actions like adding to cart or checking out; the user can do that from the product links shown alongside your reply.',
  ].join('\n')
}

/** Deterministic reply used when no LLM is configured, or when it fails. */
const fallbackReply = (products, category) => {
  if (!products.length) {
    return "I couldn't find anything matching that. Try different keywords, or browse the shop page."
  }
  const heading = category ? `Here are some ${category} options` : 'Here is what I found'
  return `${heading} (${products.length} ${products.length === 1 ? 'match' : 'matches'}):`
}

/**
 * POST /api/ai/chat
 *
 * Grounds every answer in real catalogue data: products are retrieved first,
 * then an LLM (when configured) phrases the reply using only those products.
 * This is what stops the assistant from hallucinating items or prices.
 * Falls back to a deterministic reply if the LLM is absent or errors.
 */
export const chat = async (req, res) => {
  const { message, history } = req.body || {}

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      reply: 'Please type a message so I can help you shop.',
      products: [],
    })
  }

  const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH)

  try {
    const { products, category } = await searchCatalog(trimmed, { limit: 8 })

    const priorTurns = Array.isArray(history)
      ? history
          .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .slice(-MAX_HISTORY)
          .map((h) => ({
            role: h.role,
            content: h.content.slice(0, 500),
          }))
      : []

    const llmReply = isLLMEnabled()
      ? await complete({
          system: buildSystemPrompt(products),
          history: [...priorTurns, { role: 'user', content: trimmed }],
        })
      : null

    /* The catalogue is the source of truth for what to show, regardless of
       whether the prose came from the model. */
    const links = products.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      rating: p.rating,
      inStock: p.inStock,
      isDeal: p.isDeal,
    }))

    res.json({
      reply: llmReply || fallbackReply(products, category),
      products: links,
      source: llmReply ? 'llm' : 'rules',
      llm: llmInfo(),
    })
  } catch (err) {
    console.error('[ai] chat failed:', err)
    res.status(500).json({
      reply: "Sorry, something went wrong on my end. Please try again.",
      products: [],
    })
  }
}
