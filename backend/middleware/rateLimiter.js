import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
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
  message: { message: 'Too many reset attempts. Please try again later.' },
})

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 checkout submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many checkout attempts. Please try again later.' },
})

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
})
