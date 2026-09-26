import { Redis } from '@upstash/redis'

/**
 * Shared rate-limit counters for serverless deployments.
 *
 * Why this exists: express-rate-limit's default store keeps counters in the
 * process's memory. On Vercel each cold start gets a fresh instance, so the
 * default store is effectively no limit at all — an attacker can spin through
 * the login and password-reset endpoints by simply causing cold starts.
 * Upstash Redis is an HTTP API, so it needs no TCP connection from a lambda.
 *
 * Behaviour when Redis is unconfigured or unreachable:
 *   - unconfigured -> no store is supplied, so express-rate-limit falls back to
 *     its in-memory default. Correct for local development.
 *   - unreachable  -> the limiter ALLOWS the request rather than rejecting it.
 *     Failing closed would mean a Redis outage locks every customer out of
 *     logging in, which is a far worse outcome than briefly losing rate
 *     limiting. Availability wins over throttling here, deliberately.
 */

let redis = null
let attempted = false

const isConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const getRedis = () => {
  if (!isConfigured()) return null
  if (!attempted) {
    attempted = true
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
        /* Bounded retries. Without this the client retries with backoff, so
           during an outage the limiter still "fails open" but every request
           pays the full retry budget first — turning a dependency problem
           into a latency problem for the whole site. */
        retry: { retries: 1, backoff: (attempt) => Math.min(100 * 2 ** attempt, 300) },
        timeout: 2000,
      })
    } catch (err) {
      console.error('[rate-limit] Upstash init failed, using in-memory store:', err.message)
      redis = null
    }
  }
  return redis
}

let warnedUnavailable = false
/* Set once a command has actually failed, so /health can report degradation
   rather than claiming a working backend just because the client constructed. */
let degraded = false

/**
 * Store shape expected by express-rate-limit: increment a key, set a TTL on
 * first use, and report the current count plus time to reset.
 */
export const sharedRateLimitStore = (prefix) => {
  const client = getRedis()
  if (!client) return undefined

  const keyFor = (id) => `rl:${prefix}:${id}`

  return {
    async increment(key) {
      const redisKey = keyFor(key)
      try {
        const count = await client.incr(redisKey)

        if (count === 1) {
          /* Only set the window on first hit, so the TTL is not extended by
             continued traffic and the window actually expires. */
          await client.expire(redisKey, Math.ceil((Number(key.split(':').pop()) || 60) / 1000))
        }

        const ttl = await client.ttl(redisKey)
        return {
          totalHits: count,
          resetTime: new Date(Date.now() + Math.max(ttl, 0) * 1000),
        }
      } catch (err) {
        degraded = true
        if (!warnedUnavailable) {
          warnedUnavailable = true
          console.error(
            '[rate-limit] Redis unavailable, allowing request without counting:',
            err.message,
          )
        }
        /* Fail open — see the note at the top of this file.
           Must be a POSITIVE integer: express-rate-limit validates the value
           and throws ERR_ERL_INVALID_HITS on 0, which would turn a Redis
           outage into a 500. Returning 1 sits below every limiter's max, so
           the request is allowed and nothing is counted. */
        return { totalHits: 1, resetTime: new Date(Date.now() + 60_000) }
      }
    },

    async decrement(key) {
      try {
        await client.decr(keyFor(key))
      } catch {
        /* Nothing sensible to do; the window will expire on its own. */
      }
    },

    async resetKey(key) {
      try {
        await client.del(keyFor(key))
      } catch {
        /* ignore */
      }
    },

    async resetAll() {
      /* Intentionally not implemented: scanning keys to delete them all would
         be slow and expensive on a shared database. Call resetKey instead. */
    },
  }
}

/** Introspection for /api/ai/health and debugging. */
export const rateLimitBackend = () => {
  if (!isConfigured()) return 'in-memory'
  return degraded ? 'upstash(degraded)' : 'upstash'
}
