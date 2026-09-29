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
        /* Re-checked at point of use, not just at the top of the handler.
           config/redis.js sets `redis = null` on the first connection error, so
           a client that was alive when this request arrived can be gone by the
           time the response is written. Dereferencing it unguarded threw a
           TypeError here and turned a cache outage into a 500 for the whole
           catalogue endpoint. `?.` covers the null case; the try/catch covers
           any synchronous throw, which a trailing .catch() cannot.
           Caching is best-effort and must never fail the response. */
        try {
          redis
            ?.setex(CACHE_KEYS.PRODUCTS_ALL, DEFAULT_TTL, JSON.stringify(body))
            ?.catch(() => {})
        } catch {
          /* cache unavailable — the response is still correct without it */
        }
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
