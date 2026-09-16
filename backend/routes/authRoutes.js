import { Router } from 'express'
import { register, login, logout, getProfile, updateProfile, changePassword } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/logout', logout)
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.put('/password', protect, changePassword)

export default router
