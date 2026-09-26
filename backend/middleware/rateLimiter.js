import rateLimit from 'express-rate-limit'
import { sharedRateLimitStore, rateLimitBackend } from './rateLimitStore.js'

/**
 * Rate limiters.
 *
 * Each limiter passes a shared Upstash-backed store when UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN are set, so counters survive serverless cold
 * starts. Without them it falls back to the in-memory default, which is correct
 * for local development but is effectively no limit on a lambda.
 */

const windowMs = 15 * 60 * 1000

export const authLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: sharedRateLimitStore('auth'),
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
})

/**
 * Dedicated budget for the password-reset flow. Kept separate from
 * `authLimiter` so that exhausting login attempts cannot lock a user out of
 * recovering their account, and so `forgot-password` cannot be used to flood
 * an inbox. Reset tokens are 256-bit, so this is about abuse, not brute force.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reset attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: sharedRateLimitStore('reset'),
  message: { message: 'Too many reset attempts. Please try again later.' },
})

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 checkout submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: sharedRateLimitStore('checkout'),
  message: { message: 'Too many checkout attempts. Please try again later.' },
})

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: sharedRateLimitStore('general'),
  message: { message: 'Too many requests. Please slow down.' },
})

export { rateLimitBackend }
