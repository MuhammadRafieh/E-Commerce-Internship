/**
 * Shopping domain knowledge for the local assistant.
 *
 * Kept deliberately small and hand-written: it is easier to reason about and
 * cheaper to maintain than a general NLP resource, and it can be extended by
 * adding a line. Nothing here is derived from an external model.
 */

/**
 * Category synonyms keyed by the *slug* stored on products.
 *
 * Only words that identify a *category* belong here. Product nouns such as
 * "headphones", "yoga mat" or "mug" are intentionally absent: if they were
 * listed, a query like "cheapest headphones" would be reduced to a bare
 * category filter and the product word would be thrown away, returning
 * whatever was cheapest in the category instead of the headphones.
 * Those words work better as ordinary search terms through BM25.
 */
export const CATEGORY_SYNONYMS = {
  electronics: [
    'electronics', 'electronic', 'gadget', 'gadgets', 'tech', 'technology',
    'devices', 'device', 'consumer electronics',
  ],
  fashion: [
    'fashion', 'clothing', 'clothes', 'apparel', 'wearables', 'jewellery',
    'jewelry', 'accessories', 'accessory',
  ],
  'home-living': [
    'home', 'living', 'house', 'household', 'kitchen', 'furniture', 'decor',
    'decoration', 'home decor', 'home-living',
  ],
  beauty: [
    'beauty', 'skincare', 'skin care', 'cosmetic', 'cosmetics', 'makeup',
    'grooming', 'personal care',
  ],
  sports: [
    'sports', 'sport', 'fitness', 'gym', 'workout', 'exercise', 'training',
    'outdoor', 'camping',
  ],
  books: [
    'books', 'book', 'reading', 'literature', 'novels', 'fiction',
    'non-fiction', 'nonfiction',
  ],
}

/* Free-text -> canonical filter key. Order matters: first match wins. */
export const ATTRIBUTE_SYNONYMS = {
  color: [
    'color', 'colour', 'red', 'blue', 'green', 'black', 'white', 'yellow',
    'orange', 'purple', 'pink', 'grey', 'gray', 'brown', 'beige', 'navy',
    'gold', 'silver', 'maroon', 'olive', 'teal', 'cyan', 'magenta',
  ],
  material: [
    'material', 'made', 'leather', 'cotton', 'organic', 'wood', 'wooden',
    'metal', 'steel', 'stainless', 'plastic', 'glass', 'ceramic', 'silicone',
    'wool', 'denim', 'linen', 'bamboo', 'rubber', 'marble', 'suede', 'polyester',
  ],
  size: ['size', 'small', 'medium', 'large', 'xl', 'xxl'],
  brand: [
    'brand', 'nike', 'adidas', 'samsung', 'apple', 'sony', 'dell', 'canon',
    'jbl', 'xiaomi', 'lenovo', 'puma', 'reebok',
  ],
}

/* Words that mean "this item is currently discounted". Price-intent words
   like "cheap" or "budget" are deliberately NOT here — those are sorting
   requests, and treating them as a discount filter returned unrelated
   products. */
export const DEAL_SIGNALS = [
  'deal', 'deals', 'discount', 'discounts', 'discounted', 'sale', 'on sale',
  'offer', 'offers', 'offers today', 'bargain', 'reduced', 'clearance',
  'on offer', 'special price',
]

/* Phrases meaning "currently purchasable". */
export const STOCK_SIGNALS = [
  'in stock', 'available', 'available now', 'ready to ship', 'ships',
  'buy now', 'order now',
]

/* Sentiment-ish quality signals, used to nudge ranking rather than filter. */
export const QUALITY_SIGNALS = {
  positive: ['best', 'top', 'great', 'excellent', 'amazing', 'quality', 'premium', 'highly recommended'],
  negative: ['worst', 'bad', 'cheap quality', 'avoid', 'terrible', 'poor'],
}

/* Common shopper phrasings mapped to a canonical intent. The engine scores
   these; it does not stop at the first hit. */
export const INTENT_PATTERNS = {
  cheapest: ['cheapest', 'lowest price', 'least expensive', 'most affordable', 'budget', 'broke'],
  mostExpensive: ['most expensive', 'priciest', 'highest price', 'luxury', 'premium', 'high end'],
  bestRated: ['best rated', 'highest rated', 'top rated', 'best reviewed', '5 star', 'five star'],
  mostReviewed: ['most reviewed', 'popular', 'best selling', 'bestseller', 'top selling', 'trending'],
  newest: ['newest', 'latest', 'recent', 'recently added', 'just in', 'new arrivals'],
  inStock: ['in stock', 'available', 'ready to ship', 'ships'],
  deals: DEAL_SIGNALS,
  compare: ['compare', 'difference between', 'versus', ' vs ', 'better between', 'which is better'],
  similar: ['similar to', 'like this', 'something like', 'alternatives', 'other options', 'comparable'],
  gift: ['gift', 'present', 'birthday', 'anniversary', 'wedding', 'christmas', 'diwali', 'eid'],
  forWho: ['for my', 'for his', 'for her', 'for dad', 'for mom', 'for brother', 'for sister', 'for wife', 'for husband', 'for kids', 'for children'],
};

/* Who a gift is for. These are conversational context, not product keywords,
   so they are masked out of the search terms. */
export const RECIPIENT_WORDS = [
  'gift', 'gifts', 'present', 'presents', 'birthday', 'anniversary', 'wedding',
  'christmas', 'diwali', 'eid', 'ramadan', 'valentine', 'valentines',
  'dad', 'daddy', 'father', 'papa', 'mom', 'mommy', 'mother', 'mum', 'ma',
  'brother', 'sister', 'son', 'daughter', 'wife', 'husband', 'partner',
  'girlfriend', 'boyfriend', 'kids', 'children', 'child', 'friend', 'boss',
  'colleague', 'parents', 'parents', 'him', 'her', 'them', 'self',
]

/* Follow-up phrasings that mean "refine the previous result". */
export const REFINEMENT_SIGNALS = [
  'cheaper', 'less expensive', 'more expensive', 'better', 'different',
  'another', 'others', 'else', 'instead', 'narrow', 'only', 'just',
  'smaller', 'bigger', 'lighter', 'other', 'alternatively',
]
