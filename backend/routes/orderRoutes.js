import { Router } from 'express'
import { createOrder, createGuestOrder, getMyOrders, getOrderById, getAllOrders, markOrderAsPaid, updateOrderStatus } from '../controllers/orderController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

/* public — guest checkout (no auth required) */
router.post('/guest', createGuestOrder)

/* authenticated or admin-only */
router.use(protect)
router.post('/', createOrder)
router.get('/mine', getMyOrders)
router.get('/', adminOnly, getAllOrders)
router.get('/:id', getOrderById)
router.put('/:id/pay', adminOnly, markOrderAsPaid)
router.put('/:id', adminOnly, updateOrderStatus)

export default router
