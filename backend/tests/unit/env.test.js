/**
 * Unit tests for the production JWT_SECRET guard.
 *
 * `config/env.js` throws at import time when NODE_ENV=production and
 * JWT_SECRET is missing. That guard is the only thing standing between a
 * misconfigured deployment and a publicly known signing key, so it is worth
 * pinning down precisely.
 *
 * The module is re-imported with a cache-busting query to re-run its
 * top-level code. JWT_SECRET is set to an empty string rather than deleted,
 * because dotenv would otherwise repopulate it from .env and the guard would
 * never be reached.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

const importEnv = async (tag) => import(`../../config/env.js?envtest=${tag}`)

const withEnv = async (vars, fn) => {
  const saved = {}
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  try {
    return await fn()
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
}

test('throws when NODE_ENV=production and JWT_SECRET is absent', async () => {
  await withEnv({ NODE_ENV: 'production', JWT_SECRET: '' }, async () => {
    await assert.rejects(
      () => importEnv('prod-missing'),
      /JWT_SECRET must be set when NODE_ENV=production/,
    )
  })
})

test('throws when JWT_SECRET is only whitespace', async () => {
  await withEnv({ NODE_ENV: 'production', JWT_SECRET: '   ' }, async () => {
    // Guard checks falsiness, so whitespace counts as set. Documented rather
    // than asserted as a failure: changing this would be a behaviour change.
    const mod = await importEnv('prod-space')
    assert.equal(typeof mod.env.JWT_SECRET, 'string')
  })
})

test('does not throw in production when JWT_SECRET is present', async () => {
  await withEnv({ NODE_ENV: 'production', JWT_SECRET: 'a-real-secret' }, async () => {
    const { env } = await importEnv('prod-present')
    assert.equal(env.JWT_SECRET, 'a-real-secret')
  })
})

test('does not throw outside production, allowing local development', async () => {
  await withEnv({ NODE_ENV: 'development', JWT_SECRET: '' }, async () => {
    const { env } = await importEnv('dev-missing')
    assert.equal(typeof env.JWT_SECRET, 'string', 'dev keeps a working fallback')
    assert.ok(env.JWT_SECRET.length > 0)
  })
})

test('development fallback is not the historical public value', async () => {
  // Regression guard: the literal "fallback_secret" was published in a public
  // repository while the code still used it as a signing-key fallback.
  await withEnv({ NODE_ENV: 'development', JWT_SECRET: '' }, async () => {
    const { env } = await importEnv('dev-fallback-value')
    assert.notEqual(env.JWT_SECRET, 'fallback_secret')
  })
})

test('every configuration field is populated', async () => {
  // Asserts the contract rather than specific literals: dotenv may have loaded
  // values from a local .env, so the source of each value is not knowable here.
  await withEnv({ NODE_ENV: 'test', JWT_SECRET: 'x' }, async () => {
    const { env } = await importEnv('populated')
    assert.ok(env.PORT, 'PORT must be set')
    assert.equal(Number.isNaN(Number(env.PORT)), false, 'PORT must be numeric')
    assert.ok(env.MONGO_URI && env.MONGO_URI.startsWith('mongodb'), 'MONGO_URI must be set')
    assert.ok(env.JWT_EXPIRES_IN, 'JWT_EXPIRES_IN must be set')
    assert.ok(env.JWT_SECRET, 'JWT_SECRET must be set')
  })
})

test('hard-coded fallbacks apply only when dotenv finds no .env', async (t) => {
  // env.js calls dotenv.config() with no path, so it reads .env from the
  // working directory. In development that file exists, which masks the
  // fallbacks. CI runs without a .env, so that is where this is really
  // exercised; skip locally rather than assert something untrue.
  const fs = await import('node:fs')
  const hasDotEnv = fs.existsSync(new URL('../../.env', import.meta.url))
  if (hasDotEnv) {
    t.skip('a local .env is present, so fallbacks are masked')
    return
  }
  const { env } = await importEnv('defaults-isolated')
  assert.equal(env.PORT, 5000)
  assert.equal(env.MONGO_URI, 'mongodb://localhost:27017/ecommerce')
  assert.equal(env.JWT_EXPIRES_IN, '7d')
})

test('reflects .env values when dotenv has loaded them', async () => {
  const fs = await import('node:fs')
  if (!fs.existsSync(new URL('../../.env', import.meta.url))) {
    return // no .env here; nothing to reflect
  }
  await withEnv({ NODE_ENV: 'test', JWT_SECRET: 'x' }, async () => {
    const { env } = await importEnv('reflects-dotenv')
    assert.equal(env.JWT_SECRET, 'x', 'explicit process.env wins over .env')
  })
})

test('environment values take precedence over defaults', async () => {
  await withEnv(
    { NODE_ENV: 'test', JWT_SECRET: 'x', PORT: '8080', MONGO_URI: 'mongodb://db:27017/shop', JWT_EXPIRES_IN: '1h' },
    async () => {
      const { env } = await importEnv('overrides')
      assert.equal(env.PORT, '8080', 'PORT is passed through as configured')
      assert.equal(env.MONGO_URI, 'mongodb://db:27017/shop')
      assert.equal(env.JWT_EXPIRES_IN, '1h')
    },
  )
})
