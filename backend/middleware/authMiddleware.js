import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Verifies the JWT from the Authorization header and attaches
 * `req.user = { id, role }` to the request object.
 *
 * Rejects with 401 if the token is missing, malformed, or expired.
 */
export const protect = (req, res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized — no token provided' })
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token expired — please log in again'
        : 'Token invalid — authentication failed'
    return res.status(401).json({ message })
  }
}

/**
 * Must be used AFTER `protect`. Rejects with 403 if the
 * authenticated user does not have the 'admin' role.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized — protect middleware required first' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden — admin access required' })
  }

  next()
}
