import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const protect = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' })
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch {
    res.status(401).json({ message: 'Token invalid' })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}
