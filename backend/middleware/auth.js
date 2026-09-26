import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Token invalid' })
  }

  /* A password change bumps tokenVersion, which retires every token issued
     before it. Without this check a stolen token would stay usable for the
     remainder of its 7-day lifetime. */
  try {
    const user = await User.findById(decoded.id).select('tokenVersion').lean()
    if (!user || user.tokenVersion !== (decoded.ver ?? 0)) {
      return res.status(401).json({ message: 'Session expired — please sign in again' })
    }
  } catch {
    return res.status(401).json({ message: 'Not authorized' })
  }

  req.user = { id: decoded.id, role: decoded.role }
  next()
}

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized — protect middleware required first' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}
