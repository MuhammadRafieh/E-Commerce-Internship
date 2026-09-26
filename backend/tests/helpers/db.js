/**
 * Integration test helpers.
 *
 * The suites below need a live MongoDB because they exercise real Mongoose
 * documents, real bcrypt hashing and the real auth middleware. To keep them
 * runnable anywhere, they:
 *   - use a dedicated throwaway database name, never the development one
 *   - skip themselves (rather than failing) when Mongo is unreachable
 *   - clean up every document they create
 */
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import dotenv from 'dotenv'

const here = dirname(fileURLToPath(import.meta.url))
export const BACKEND_ROOT = resolve(here, '..', '..')

dotenv.config({ path: resolve(BACKEND_ROOT, '.env') })

/** Base URI with the database name replaced, so tests never touch dev data. */
export const TEST_URI = () => {
  const base =
    process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce'
  const url = new URL(base)
  url.pathname = '/ecommerce_test'
  return url.toString()
}

let connected = false

/**
 * Connect once for the whole run. Returns false when Mongo is unavailable so
 * the caller can skip instead of erroring.
 */
export const connectTestDb = async () => {
  if (connected) return true
  mongoose.set('strictQuery', true)
  try {
    await mongoose.connect(TEST_URI(), { serverSelectionTimeoutMS: 3000 })
    connected = true
    return true
  } catch (err) {
    return false
  }
}

export const disconnectTestDb = async () => {
  if (!connected) return
  await mongoose.connection.dropDatabase().catch(() => {})
  await mongoose.disconnect().catch(() => {})
  connected = false
}

export const db = () => mongoose.connection.db

export const clearCollection = async (name) => {
  if (!connected) return
  await db().collection(name).deleteMany({})
}

/** Deterministic, obviously-fake identifiers for created records. */
export const TEST_TAG = '__test__'

export const testUser = (over = {}) => ({
  name: 'Test Person',
  email: `test-${Math.random().toString(36).slice(2, 10)}@example.com`,
  password: 'correct-horse-battery',
  ...over,
})
