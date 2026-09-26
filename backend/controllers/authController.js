import crypto from 'crypto'
import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import { env } from '../config/env.js'
import { sendPasswordResetEmail } from '../utils/sendEmail.js'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

function setTokenCookie(res, token) {
  res.cookie('token', token, COOKIE_OPTIONS)
}

function clearTokenCookie(res) {
  res.cookie('token', '', { ...COOKIE_OPTIONS, maxAge: 0 })
}

export const register = async (req, res) => {
  const { name, email, password } = req.body
  const exists = await User.findOne({ email })
  if (exists) return res.status(400).json({ message: 'Email already in use' })

  const user = await User.create({ name, email, password })
  const token = generateToken(user._id, user.role, user.tokenVersion)
  setTokenCookie(res, token)
  res.status(201).json({ user })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = generateToken(user._id, user.role, user.tokenVersion)
  setTokenCookie(res, token)
  res.json({ user })
}

export const logout = async (req, res) => {
  clearTokenCookie(res)
  res.json({ message: 'Logged out' })
}

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id)
  res.json(user)
}

export const updateProfile = async (req, res) => {
  const { name, email } = req.body
  const user = await User.findById(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  if (email && email !== user.email) {
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ message: 'Email already in use' })
    user.email = email
  }
  if (name) user.name = name

  await user.save()
  res.json(user)
}

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' })
  }

  const user = await User.findById(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })

  user.password = newPassword
  /* Any outstanding reset link is void once the password changes. */
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  /* Retire tokens issued before this change, including the caller's. */
  user.tokenVersion += 1
  await user.save()
  clearTokenCookie(res)
  res.json({ message: 'Password updated. Please sign in again.', reauth: true })
}

/**
 * Always responds 200 with the same message whether or not the address is
 * registered, so this endpoint cannot be used to discover which emails
 * have accounts.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body
  const genericMessage =
    'If an account exists for that email, a reset link has been sent.'

  if (!email) return res.json({ message: genericMessage })

  const user = await User.findOne({ email: String(email).toLowerCase() })

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex')

    user.resetPasswordToken = sha256(rawToken)
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await user.save()

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${clientUrl}/reset-password/${rawToken}`,
    })
  }

  res.json({ message: genericMessage })
}

export const resetPassword = async (req, res) => {
  const { password } = req.body
  const { token } = req.params

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' })
  }
  if (!token) {
    return res.status(400).json({ message: 'Reset token is required' })
  }

  const user = await User.findOne({
    resetPasswordToken: sha256(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires')

  if (!user) {
    return res.status(400).json({ message: 'This reset link is invalid or has expired' })
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  /* Invalidate any session opened with the old password. */
  user.tokenVersion += 1
  await user.save()

  /* Force re-authentication with the new credentials. */
  clearTokenCookie(res)
  res.json({ message: 'Password has been reset. You can now sign in.', reauth: true })
}
