import dotenv from 'dotenv'
dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

/**
 * Never fall back to a hardcoded secret in production. This file is public,
 * so any literal default is a publicly known signing key — anyone could
 * mint `{ role: 'admin' }` tokens and bypass `protect` / `adminOnly`.
 * Fail at boot instead of silently trusting a guessable value.
 */
if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production')
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
  // Dev-only convenience default. Unreachable in production — see guard above.
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
}
