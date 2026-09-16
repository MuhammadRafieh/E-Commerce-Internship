import Product from '../models/Product.js'

/**
 * POST /api/ai/chat
 *
 * Evaluates natural-language shopping intents and returns
 * matching products as interactive links.
 *
 * Supported intents:
 *   "show me things under Rs 30"
 *   "best rated headphones"
 *   "cheapest products"
 *   "what's in the electronics category"
 */
export const chat = async (req, res) => {
  const { message } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ reply: "Please type a message so I can help you shop.", products: [] })
  }

  const normalized = message.toLowerCase().trim()
  const filter = {}

  /* --- Price filters --- */
  const underMatch = normalized.match(/under\s*(?:rs\.?\s*)?(\d+)/i)
  const aboveMatch = normalized.match(/(?:above|over)\s*(?:rs\.?\s*)?(\d+)/i)
  const rangeMatch = normalized.match(/between\s*(?:rs\.?\s*)?(\d+)\s*(?:and|[-])\s*(?:rs\.?\s*)?(\d+)/i)
  const maxMatch = normalized.match(/max\s*(?:rs\.?\s*)?(\d+)/i)
  const minMatch = normalized.match(/min\s*(?:rs\.?\s*)?(\d+)/i)

  if (rangeMatch) {
    filter.price = { $gte: Number(rangeMatch[1]), $lte: Number(rangeMatch[2]) }
  } else if (underMatch || maxMatch) {
    const val = Number((underMatch || maxMatch)[1])
    filter.price = { $lte: val }
  } else if (aboveMatch || minMatch) {
    const val = Number((aboveMatch || minMatch)[1])
    filter.price = { $gte: val }
  }

  /* --- Category detection --- */
  const categoryKeywords = {
    electronics: ['electronics', 'electronic', 'gadget', 'tech'],
    clothing: ['clothing', 'clothes', 'apparel', 'wear', 'fashion', 'shirt', 'dress'],
    home: ['home', 'kitchen', 'garden', 'furniture', 'decor'],
    sports: ['sports', 'sport', 'fitness', 'gym', 'outdoor'],
    books: ['books', 'book', 'reading', 'literature'],
  }

  let detectedCategory = null
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      detectedCategory = cat
      break
    }
  }
  if (detectedCategory) {
    filter.category = detectedCategory
  }

  /* --- Specific product name search --- */
  const nameMatch = normalized.match(/(?:search|find|looking for|show)\s+["']?([a-z0-9\s]+)["']?/)
  if (nameMatch && !detectedCategory && !filter.price) {
    filter.name = { $regex: nameMatch[1].trim(), $options: 'i' }
  }

  /* --- Sorting intent --- */
  let sortOption = { createdAt: -1 }
  if (normalized.includes('cheapest') || normalized.includes('lowest') || normalized.includes('least expensive')) {
    sortOption = { price: 1 }
  } else if (normalized.includes('best rated') || normalized.includes('highest rated') || normalized.includes('top rated')) {
    sortOption = { rating: -1 }
  } else if (normalized.includes('most expensive') || normalized.includes('priciest')) {
    sortOption = { price: -1 }
  } else if (normalized.includes('newest') || normalized.includes('recent')) {
    sortOption = { createdAt: -1 }
  } else if (normalized.includes('popular') || normalized.includes('most reviewed')) {
    sortOption = { numReviews: -1 }
  }

  /* --- Execute query --- */
  const pipeline = [
    { $match: Object.keys(filter).length > 0 ? filter : {} },
    { $sort: sortOption },
    { $limit: 6 },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        price: 1,
        image: 1,
        category: 1,
        rating: 1,
      },
    },
  ]

  const products = await Product.aggregate(pipeline)

  /* --- Build reply --- */
  let reply = ''
  if (products.length === 0) {
    reply = "I couldn't find any products matching your request. Try different keywords or browse our shop."
  } else if (products.length === 1) {
    reply = `I found 1 product matching your search:`
  } else {
    const intro = detectedCategory ? `Here are some great ${detectedCategory} options` : 'Here is what I found'
    reply = `${intro} (${products.length} results):`
  }

  res.json({ reply, products })
}
