import { redis, CACHE_KEYS } from '../config/redis.js'

const DEFAULT_TTL = 300 // 5 minutes

export function cacheProducts() {
  return async (req, res, next) => {
    /* only cache the unfiltered full catalog (no query params) */
    if (Object.keys(req.query).length > 0) return next()
    if (!redis) return next()

    try {
      const cached = await redis.get(CACHE_KEYS.PRODUCTS_ALL)
      if (cached) {
        return res.json(JSON.parse(cached))
      }
    } catch {
      /* cache miss — proceed */
    }

    const originalJson = res.json.bind(res)
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis
          .setex(CACHE_KEYS.PRODUCTS_ALL, DEFAULT_TTL, JSON.stringify(body))
          .catch(() => {})
      }
      return originalJson(body)
    }

    next()
  }
}

export async function invalidateProductCache() {
  if (!redis) return
  try {
    await redis.del(CACHE_KEYS.PRODUCTS_ALL)
  } catch {
    /* silently fail */
  }
}
