import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, ver: tokenVersion }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}
