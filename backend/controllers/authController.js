import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import { env } from '../config/env.js'

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
  const token = generateToken(user._id, user.role)
  setTokenCookie(res, token)
  res.status(201).json({ user })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = generateToken(user._id, user.role)
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
  await user.save()
  res.json({ message: 'Password updated successfully' })
}
