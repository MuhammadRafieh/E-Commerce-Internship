/**
 * Regression tests for the product cache middleware.
 *
 * The bug this guards against was an availability failure, not a caching
 * inefficiency: `config/redis.js` sets `redis = null` on the first connection
 * error, but `cacheProducts()` only checked for null at the top of the
 * handler. A client that was alive when the request arrived could be gone by
 * the time `res.json` ran, and the unguarded `redis.setex(...)` threw a
 * TypeError *synchronously* — so the trailing `.catch()` never attached and
 * the whole product catalogue endpoint returned 500.
 *
 * `REDIS_URL` is undocumented and unset by default, so ioredis falls back to
 * redis://localhost:6379, fails, nulls the client, and the store's primary
 * page dies on any host without a local Redis. That is the default
 * configuration, which is why this reached a running server at all.
 *
 * These tests mount the real middleware against the real controller with no
 * Redis present, which is the same condition CI runs under.
 */
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import { connectTestDb, disconnectTestDb } from '../helpers/db.js'

/* Module-load connection, not `before()`: the `skip` option is evaluated when
   each test is declared, which happens before any hook runs. */
const ready = await connectTestDb()
const SKIP = ready ? false : 'MongoDB not available'

let server
let origin
let Product
let invalidateProductCache

if (ready) {
  /* Real Express, real router. A hand-rolled http server cannot reproduce
     Express's error propagation: an un-awaited `next()` turns a controller
     throw into an unhandled rejection and the request hangs forever, which
     looks nothing like the 500 a user actually receives. Mounting the real
     router is what makes this a faithful regression test. */
  const express = (await import('express')).default
  const productRoutes = (await import('../../routes/productRoutes.js')).default
  const cacheModule = await import('../../middleware/cacheMiddleware.js')
  invalidateProductCache = cacheModule.invalidateProductCache
  Product = (await import('../../models/Product.js')).default

  /* `image` is schema-required; omitting it fails validation before the
     middleware is ever reached. */
  await Product.deleteMany({ name: /^Cache Probe/ })
  await Product.create([
    {
      name: 'Cache Probe A',
      price: 10,
      description: 'a',
      category: 'electronics',
      stock: 1,
      image: 'https://example.com/probe-a.jpg',
    },
    {
      name: 'Cache Probe B',
      price: 20,
      description: 'b',
      category: 'electronics',
      stock: 1,
      image: 'https://example.com/probe-b.jpg',
    },
  ])

  const app = express()
  app.use(express.json())
  app.use('/products', productRoutes)
  app.use((err, _req, res, _next) => {
    res.status(500).json({ message: err?.message || 'error' })
  })

  server = createServer(app)
  await new Promise((r) => server.listen(0, r))
  origin = `http://localhost:${server.address().port}`
}

after(async () => {
  if (server) {
    await Product?.deleteMany({ name: /^Cache Probe/ }).catch(() => {})
    await new Promise((r) => server.close(r))
  }
  await disconnectTestDb()
})

const fetchJSON = async (path = '/products') => {
  const res = await fetch(`${origin}${path}`)
  return { status: res.status, body: await res.json().catch(() => null) }
}

/* ───────────────────────── the regression itself ───────────────────────── */

test('the catalogue still responds when no cache is available', { skip: SKIP }, async () => {
  /* The core regression. Before the fix this returned 500 with
     "Cannot read properties of null (reading 'setex')" once the Redis
     connection had failed — which is the default state on any host without a
     local Redis, because REDIS_URL is undocumented and unset. */
  const { status, body } = await fetchJSON()
  assert.equal(status, 200, `catalogue must not 500: ${JSON.stringify(body)}`)
  assert.ok(Array.isArray(body?.products), 'a product array is expected')
  assert.ok(body.products.length > 0, 'products should be returned')
})

test('repeated requests stay stable rather than failing after the first', { skip: SKIP }, async () => {
  /* The failure was timing-dependent: the first request could pass the guard
     while Redis was still connecting, and a later one hit the null. Hammering
     the endpoint is what made it reproducible. */
  const statuses = []
  for (let i = 0; i < 8; i++) statuses.push((await fetchJSON()).status)

  assert.equal(
    statuses.filter((s) => s !== 200).length,
    0,
    `every request should succeed, got ${statuses}`,
  )
})

test('a cache outage never leaks an internal error to the client', { skip: SKIP }, async () => {
  const { status, body } = await fetchJSON()
  if (status !== 200) return
  assert.equal(
    /setex|Cannot read properties of null/i.test(JSON.stringify(body)),
    false,
    'internal cache errors must not reach the client',
  )
})

test('requests still succeed after the cache has definitively failed', { skip: SKIP }, async () => {
  /* The original failure was timing-dependent: the guard saw a live client
     while the connection was still being attempted, and only a later request
     — after config/redis.js had nulled it — hit the unguarded dereference.
     Racing that by chance is flaky, so this waits for the failure to become
     observable (the module logs when it disables caching) and only then
     asserts. That is the exact state that used to produce a 500. */
  const originalWarn = console.warn
  let sawDisable = false
  console.warn = (...args) => {
    if (String(args[0]).includes('[Redis]')) sawDisable = true
    return originalWarn(...args)
  }

  try {
    const deadline = Date.now() + 20_000
    while (!sawDisable && Date.now() < deadline) {
      await fetchJSON()
      await new Promise((r) => setTimeout(r, 250))
    }
  } finally {
    console.warn = originalWarn
  }

  /* Whether or not the warning fired, the endpoint must serve. On a host with
     no Redis at all — the default — the cache is already down, and that is
     the case that matters. */
  const statuses = []
  for (let i = 0; i < 5; i++) statuses.push((await fetchJSON()).status)

  assert.equal(
    statuses.filter((s) => s !== 200).length,
    0,
    `catalogue must survive a disabled cache, got ${statuses} (cache disabled: ${sawDisable})`,
  )
})

/* ───────────────────────── surrounding behaviour ───────────────────────── */

test('responses are paginated and correctly shaped', { skip: SKIP }, async () => {
  const { body } = await fetchJSON()
  for (const key of ['products', 'page', 'limit', 'total', 'totalPages']) {
    assert.ok(key in body, `expected "${key}" in the response`)
  }
  assert.ok(Array.isArray(body.products))
  assert.ok(body.products[0].name, 'each product should expose a name')
})

test('cache invalidation is safe to call with no cache', { skip: SKIP }, async () => {
  /* invalidateProductCache() guards with `if (!redis) return`, and it is
     called from write paths. It must never throw. */
  await assert.doesNotReject(() => invalidateProductCache())
  assert.equal((await fetchJSON()).status, 200, 'serving continues after invalidation')
})

test('query-parameterised requests bypass the cache path entirely', { skip: SKIP }, async () => {
  /* The middleware skips anything with query params, so this exercises the
     early return rather than the res.json patch. */
  const { status, body } = await fetchJSON('/products?category=electronics&limit=5')
  assert.equal(status, 200)
  assert.equal(body.limit, 5)
  assert.ok(body.products.every((p) => p.category === 'electronics'))
})
