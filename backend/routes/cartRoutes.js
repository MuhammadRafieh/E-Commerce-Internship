import { Router } from 'express'
import { getCart, addToCart, removeFromCart } from '../controllers/cartController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)
router.get('/', getCart)
router.post('/', addToCart)
router.delete('/:productId', removeFromCart)

export default router
