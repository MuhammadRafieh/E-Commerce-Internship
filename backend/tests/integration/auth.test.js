/**
 * Integration tests for authentication, RBAC and the User model.
 *
 * These exercise the real Mongoose documents, real bcrypt hashing and the real
 * middleware — the paths where a bug is a security hole rather than a cosmetic
 * defect. They self-skip when MongoDB is unavailable.
 */
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'

import { connectTestDb, disconnectTestDb, clearCollection, testUser } from '../helpers/db.js'

/* Connection and model loading happen at module load, not in `before()`.
   The `skip` option below is evaluated when each test is *declared*, which
   happens before any hook runs — so the connection has to already be settled
   for the skip to be accurate. */
const ready = await connectTestDb()
const SKIP = ready ? false : 'MongoDB not available'

let User
let protect
let adminOnly
let generateToken
let server
let origin

if (ready) {
  User = (await import('../../models/User.js')).default
  ;({ protect, adminOnly } = await import('../../middleware/auth.js'))
  ;({ generateToken } = await import('../../utils/generateToken.js'))
  await clearCollection('users')

  server = createServer((req, res) => {
    /* The middleware is written against Express, so the bare http response
       needs the two helpers it actually uses. Without these every assertion
       sees a 500 from a TypeError instead of the real status. */
    res.status = (code) => {
      res.statusCode = code
      return res
    }
    res.json = (body) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
      return res
    }

    const ok = () => res.status(200).json({ ok: true, user: req.user })
    const path = (req.url || '/').split('?')[0]

    const run = async () => {
      /* protect reads req.cookies; emulate the shape express would provide. */
      req.cookies = {}

      /* Two distinct routes, mirroring the real app: authentication and
         authorization are separate concerns and must be asserted separately.
         Chaining them would make every valid user look like a 403. */
      if (path === '/admin') {
        await protect(req, res, () => adminOnly(req, res, ok))
      } else {
        await protect(req, res, ok)
      }
    }
    run().catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500
        res.end('{}')
      }
    })
  })
  await new Promise((r) => server.listen(0, r))
  origin = `http://localhost:${server.address().port}`
}

after(async () => {
  if (server) await new Promise((r) => server.close(r))
  await disconnectTestDb()
})

const bearer = (token) => ({ Authorization: `Bearer ${token}` })

/** Hit the authentication-only route. */
const call = async (token) => {
  const res = await fetch(`${origin}/protected`, { headers: token ? bearer(token) : {} })
  return { status: res.status, body: await res.json().catch(() => null) }
}

/** Hit the route protected by `protect` + `adminOnly`. */
const callAdmin = async (token) => {
  const res = await fetch(`${origin}/admin`, { headers: token ? bearer(token) : {} })
  return { status: res.status, body: await res.json().catch(() => null) }
}

/* ───────────────────────── User model ───────────────────────── */

test('password is hashed, never stored in plaintext', { skip: SKIP }, async () => {
  const plain = 'super-secret-value'
  const user = await User.create(testUser({ password: plain }))
  const stored = await User.findById(user._id).lean()

  assert.notEqual(stored.password, plain, 'password must not be stored as given')
  assert.match(stored.password, /^\$2[aby]\$/, 'should be a bcrypt hash')
  assert.equal(await user.comparePassword(plain), true)
  assert.equal(await user.comparePassword('wrong-password'), false)
})

test('password is not re-hashed when an unrelated field changes', { skip: SKIP }, async () => {
  const user = await User.create(testUser())
  const firstHash = user.password

  user.name = 'Renamed Person'
  await user.save()

  assert.equal(user.password, firstHash, 'pre-save hook must only fire on password change')
  assert.equal(await user.comparePassword('correct-horse-battery'), true)
})

test('toJSON never leaks the password or reset token', { skip: SKIP }, async () => {
  const user = await User.create(testUser())
  const json = user.toJSON()

  assert.equal(json.password, undefined)
  assert.equal(json.resetPasswordToken, undefined)
  assert.equal(json.resetPasswordExpires, undefined)
  assert.ok(json.email, 'non-sensitive fields are still present')
  assert.ok(json._id, 'the record identifier is still present')
})

test('rejects a password shorter than the schema minimum', { skip: SKIP }, async () => {
  await assert.rejects(() => User.create(testUser({ password: 'short' })))
})

test('rejects a duplicate email', { skip: SKIP }, async () => {
  const email = `dupe-${Date.now()}@example.com`
  await User.create(testUser({ email }))
  await assert.rejects(() => User.create(testUser({ email })))
})

test('defaults to the user role and honours an explicit admin role', { skip: SKIP }, async () => {
  const plain = await User.create(testUser())
  assert.equal(plain.role, 'user')
  assert.equal(plain.tokenVersion, 0)

  const admin = await User.create(testUser({ role: 'admin' }))
  assert.equal(admin.role, 'admin')
})

test('rejects a role outside the enum', { skip: SKIP }, async () => {
  await assert.rejects(() => User.create(testUser({ role: 'superuser' })))
})

/* ───────────────────────── token generation ───────────────────────── */

test('generateToken round-trips id, role and version', { skip: SKIP }, async () => {
  const token = generateToken('abc123', 'admin', 3)
  const { default: jwt } = await import('jsonwebtoken')
  const { env } = await import('../../config/env.js')
  const decoded = jwt.verify(token, env.JWT_SECRET)

  assert.equal(decoded.id, 'abc123')
  assert.equal(decoded.role, 'admin')
  assert.equal(decoded.ver, 3)
})

test('generateToken defaults the version to zero', { skip: SKIP }, async () => {
  const { default: jwt } = await import('jsonwebtoken')
  const { env } = await import('../../config/env.js')
  const decoded = jwt.verify(generateToken('abc123', 'user'), env.JWT_SECRET)
  assert.equal(decoded.ver, 0)
})

/* ───────────────────────── protect middleware ───────────────────────── */

test('rejects a request with no token', { skip: SKIP }, async () => {
  const { status, body } = await call(null)
  assert.equal(status, 401)
  assert.match(body.message, /Not authorized/i)
})

test('rejects a malformed token', { skip: SKIP }, async () => {
  const { status } = await call('not-a-jwt')
  assert.equal(status, 401)
})

test('rejects a token signed with the wrong secret', { skip: SKIP }, async () => {
  const { default: jwt } = await import('jsonwebtoken')
  const forged = jwt.sign({ id: 'x', role: 'admin', ver: 0 }, 'not-the-real-secret')
  const { status } = await call(forged)
  assert.equal(status, 401, 'a foreign signature must never be accepted')
})

test('rejects an "alg: none" token', { skip: SKIP }, async () => {
  const b64 = (s) =>
    Buffer.from(s).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsigned = `${b64('{"alg":"none","typ":"JWT"}')}.${b64('{"id":"x","role":"admin","ver":0}')}.`
  const { status } = await call(unsigned)
  assert.equal(status, 401, 'unsigned tokens must be rejected')
})

test('accepts a valid user token and exposes the identity', { skip: SKIP }, async () => {
  const user = await User.create(testUser())
  const { status, body } = await call(generateToken(user._id, user.role, user.tokenVersion))

  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.user.id, String(user._id))
  assert.equal(body.user.role, 'user')
})

test('rejects a valid signature for a user who no longer exists', { skip: SKIP }, async () => {
  const { default: mongoose } = await import('mongoose')
  const ghost = new mongoose.Types.ObjectId()
  const { status } = await call(generateToken(ghost, 'admin', 0))
  assert.equal(status, 401, 'a token for a deleted user must not authenticate')
})

test('rejects a token whose version no longer matches (post-password-change)', { skip: SKIP }, async () => {
  const user = await User.create(testUser())
  const stale = generateToken(user._id, user.role, 0)

  assert.equal((await call(stale)).status, 200, 'valid before the change')

  user.tokenVersion += 1
  await user.save()

  const { status, body } = await call(stale)
  assert.equal(status, 401, 'a retired token must stop working immediately')
  assert.match(body.message, /Session expired/i)
})

/* ───────────────────────── adminOnly ───────────────────────── */

test('adminOnly allows an admin', { skip: SKIP }, async () => {
  const user = await User.create(testUser({ role: 'admin' }))
  const { status, body } = await callAdmin(generateToken(user._id, user.role, user.tokenVersion))
  assert.equal(status, 200)
  assert.equal(body.user.role, 'admin')
})

test('adminOnly blocks a normal user with 403', { skip: SKIP }, async () => {
  const user = await User.create(testUser())
  const { status, body } = await callAdmin(generateToken(user._id, user.role, user.tokenVersion))
  assert.equal(status, 403)
  assert.match(body.message, /Admin access required/i)
})

test('a user with a valid token still passes authentication', { skip: SKIP }, async () => {
  // Separates the two concerns: the same token is a 200 on /protected and a
  // 403 on /admin. Without this distinction a 403 could be mistaken for an
  // authentication failure.
  const user = await User.create(testUser())
  const token = generateToken(user._id, user.role, user.tokenVersion)
  assert.equal((await call(token)).status, 200)
  assert.equal((await callAdmin(token)).status, 403)
})

test('adminOnly refuses to run without a preceding protect', { skip: SKIP }, async () => {
  // Guards against a future route mounting adminOnly alone, which would
  // otherwise throw a TypeError on undefined rather than returning 401.
  const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this },
    json(b) { this.body = b; return this } }
  let nextCalled = false

  adminOnly({ headers: {} }, res, () => { nextCalled = true })

  assert.equal(nextCalled, false, 'must not call next()')
  assert.equal(res.statusCode, 401)
})
