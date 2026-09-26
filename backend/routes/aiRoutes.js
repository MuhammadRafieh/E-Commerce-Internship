import { Router } from 'express'
import { chat, health } from '../controllers/aiController.js'
import { generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/chat', generalLimiter, chat)
router.get('/health', health)

export default router
