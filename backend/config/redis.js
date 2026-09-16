import { Redis } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let redis = null

if (process.env.NODE_ENV !== 'test') {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })

  redis.on('error', (err) => {
    console.warn('[Redis] Connection error — caching disabled:', err.message)
    redis = null
  })

  redis.on('ready', () => console.log('[Redis] Connected'))
}

export { redis }

export const CACHE_KEYS = {
  PRODUCTS_ALL: 'products:all',
  PRODUCT: (id) => `products:${id}`,
}
