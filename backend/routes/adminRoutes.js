import { Router } from 'express'
import { getSalesAnalytics } from '../controllers/adminController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.use(protect, adminOnly)
router.get('/sales-analytics', getSalesAnalytics)

export default router
