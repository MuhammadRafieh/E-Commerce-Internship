import { Router } from 'express'
import { chat } from '../controllers/aiController.js'
import { generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/chat', generalLimiter, chat)

export default router
