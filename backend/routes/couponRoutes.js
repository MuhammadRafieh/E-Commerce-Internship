import { Router } from 'express'
import {
  validateCoupon, applyCoupon,
  getAllCoupons, getCouponById, createCoupon, updateCoupon, toggleCoupon, deleteCoupon,
} from '../controllers/couponController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

/* User-facing */
router.post('/validate', protect, validateCoupon)
router.post('/apply', protect, applyCoupon)

/* Admin CRUD */
router.get('/', protect, adminOnly, getAllCoupons)
router.get('/:id', protect, adminOnly, getCouponById)
router.post('/', protect, adminOnly, createCoupon)
router.put('/:id', protect, adminOnly, updateCoupon)
router.patch('/:id/toggle', protect, adminOnly, toggleCoupon)
router.delete('/:id', protect, adminOnly, deleteCoupon)

export default router
