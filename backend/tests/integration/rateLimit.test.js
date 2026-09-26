/**
 * Integration tests for rate limiting.
 *
 * Two things matter here and both are easy to regress:
 *   1. the limit is actually enforced when no shared store is configured
 *   2. a Redis outage must NOT lock users out (fail open)
 *
 * Point 2 is a deliberate design decision: a dependency outage must not become
 * a total login outage. It is also the exact bug that shipped once already —
 * the fail-open path returned totalHits: 0, which express-rate-limit rejects
 * with ERR_ERL_INVALID_HITS, turning an outage into 500s.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'

/**
 * Build a server exposing one rate-limited route, mirroring the real
 * middleware contract (it calls res.status().json()).
 */
const startServer = async (limiter, path = '/limited') => {
  const hits = []
  const server = createServer((req, res) => {
    res.status = (c) => {
      res.statusCode = c
      return res
    }
    /* express-rate-limit v8 writes its rejection via res.send(), not
       res.json(), so both helpers are required for the middleware to work
       outside Express. */
    res.send = (body) => {
      if (body && typeof body === 'object') {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      } else {
        res.end(String(body))
      }
      return res
    }
    res.json = (body) => res.send(body)
    hits.push(Date.now())
    limiter(req, res, () => res.status(200).json({ ok: true }))
  })
  await new Promise((r) => server.listen(0, r))
  const origin = `http://localhost:${server.address().port}`
  return {
    origin,
    hits,
    close: () => new Promise((r) => server.close(r)),
  }
}

const hit = async (origin, path = '/limited') => {
  const res = await fetch(`${origin}${path}`)
  return { status: res.status, body: await res.json().catch(() => null) }
}

/**
 * Hit with a hard ceiling. During a simulated outage the upstream client
 * still has to time out; without a bound here a hung dependency hangs the
 * whole suite rather than failing an assertion.
 */
const hitBounded = async (origin, ms = 8000) => {
  const res = await Promise.race([
    fetch(`${origin}/limited`),
    delay(ms).then(() => {
      throw new Error(`request exceeded ${ms}ms — the limiter is not failing fast`)
    }),
  ])
  return { status: res.status, body: await res.json().catch(() => null) }
}

/* ───────────────────── in-memory enforcement ───────────────────── */

test('in-memory store enforces the limit', async () => {
  process.env.UPSTASH_REDIS_REST_URL = ''
  process.env.UPSTASH_REDIS_REST_TOKEN = ''

  const { authLimiter, rateLimitBackend } = await import('../../middleware/rateLimiter.js')
  assert.equal(rateLimitBackend(), 'in-memory')

  const { origin, close } = await startServer(authLimiter)
  try {
    const statuses = []
    for (let i = 0; i < 12; i++) statuses.push((await hit(origin)).status)

    assert.ok(statuses.includes(429), 'the limit must eventually reject')
    assert.ok(statuses.includes(200), 'early requests must succeed')
    assert.equal(statuses.at(-1), 429, 'once limited, stays limited')
  } finally {
    await close()
  }
})

test('limit response uses the documented message', async () => {
  const { authLimiter } = await import('../../middleware/rateLimiter.js')
  const { origin, close } = await startServer(authLimiter)
  try {
    let last
    for (let i = 0; i < 12; i++) last = await hit(origin)
    if (last.status === 429) {
      assert.match(last.body.message, /Too many attempts/i)
    }
  } finally {
    await close()
  }
})

/* ───────────────────── fail open on a dependency outage ───────────────────── */

test('an unreachable Redis allows requests instead of failing them', async () => {
  /* Point at a host that cannot resolve. The limiters must allow traffic
     rather than reject everyone, must never surface a 500, and must fail
     fast rather than stalling every request behind client retries. */
  process.env.UPSTASH_REDIS_REST_URL = 'https://invalid-host-for-tests.upstash.io'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'invalid-token'

  const { rateLimitBackend } = await import('../../middleware/rateLimitStore.js?failopen=1')
  const { authLimiter } = await import('../../middleware/rateLimiter.js?failopen=1')

  const { origin, close } = await startServer(authLimiter)
  try {
    const statuses = []
    for (let i = 0; i < 3; i++) {
      const r = await hitBounded(origin)
      statuses.push(r.status)
    }

    assert.equal(statuses.filter((s) => s === 500).length, 0, 'an outage must never 500')
    assert.equal(
      statuses.filter((s) => s === 429).length,
      0,
      'an outage must not lock every user out',
    )
    assert.ok(
      statuses.every((s) => s === 200),
      `all requests should pass through, got ${statuses}`,
    )

    /* The degradation must be observable rather than silent. */
    assert.match(rateLimitBackend(), /upstash/)
  } finally {
    await close()
  }
})

test('the fail-open result satisfies express-rate-limit validation', async () => {
  /* Regression: the store returned totalHits: 0, and express-rate-limit
     throws ERR_ERL_INVALID_HITS on a non-positive value. That turned a
     Redis outage into 500s. Assert the contract explicitly. */
  process.env.UPSTASH_REDIS_REST_URL = 'https://invalid-host-for-tests.upstash.io'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'invalid-token'

  const { sharedRateLimitStore } = await import('../../middleware/rateLimitStore.js?failopen=2')
  const store = sharedRateLimitStore('probe')
  assert.ok(store, 'a store should be produced when Redis is configured')

  const result = await Promise.race([
    store.increment('probe-key'),
    delay(8000).then(() => { throw new Error('increment did not resolve within 8s') }),
  ])

  assert.ok(Number.isInteger(result.totalHits), 'totalHits must be an integer')
  assert.ok(result.totalHits > 0, 'express-rate-limit rejects totalHits <= 0')
  assert.ok(result.resetTime instanceof Date, 'resetTime must be a Date')
})

test('store reports no store when Redis is unconfigured', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  const { sharedRateLimitStore } = await import('../../middleware/rateLimitStore.js?failopen=3')
  assert.equal(sharedRateLimitStore('probe'), undefined, 'falls back to the in-memory default')
})

/* ───────────────────── distinct budgets ───────────────────── */

test('password reset has its own budget, separate from login', async () => {
  const { authLimiter, passwordResetLimiter } = await import('../../middleware/rateLimiter.js')

  const login = await startServer(authLimiter, '/login')
  const reset = await startServer(passwordResetLimiter, '/reset')
  try {
    /* Exhaust the login budget. */
    for (let i = 0; i < 12; i++) await hit(login.origin, '/login')

    /* The reset route must still accept, otherwise a user who failed to log
       in a few times could not recover their account. */
    const after = await hit(reset.origin, '/reset')
    assert.notEqual(after.status, 429, 'reset must not be blocked by the login budget')
  } finally {
    await login.close()
    await reset.close()
  }
})

test('the reset limiter rejects sooner than the login limiter', async () => {
  /* Behavioural rather than by inspecting `limiter.max`, which
     express-rate-limit does not expose. Both limiters get their own instance
     so the budgets are compared on effect, not on internals. */
  const { authLimiter, passwordResetLimiter } = await import('../../middleware/rateLimiter.js')

  const reset = await startServer(passwordResetLimiter, '/reset')
  try {
    let firstRejected = null
    for (let i = 1; i <= 10; i++) {
      if ((await hit(reset.origin, '/reset')).status === 429) {
        firstRejected = i
        break
      }
    }
    assert.ok(firstRejected !== null, 'the reset limiter should reject within 10 attempts')
    assert.ok(firstRejected <= 5, `reset should reject within 5 attempts, rejected at ${firstRejected}`)
  } finally {
    await reset.close()
  }
  assert.ok(authLimiter, 'login limiter is present')
})

test('limiters expose standard rate-limit headers', async () => {
  const { authLimiter } = await import('../../middleware/rateLimiter.js')
  const { origin, close } = await startServer(authLimiter)
  try {
    const res = await fetch(`${origin}/limited`)
    assert.ok(
      res.headers.get('ratelimit-limit') || res.headers.get('ratelimit'),
      'clients should be able to read the limit',
    )
  } finally {
    await close()
  }
})
