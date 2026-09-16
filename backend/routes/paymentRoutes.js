import { Router } from 'express'
import {
  createCheckoutSession, createGuestCheckoutSession, verifySession,
  createJazzcashOrder, createGuestJazzcashOrder, verifyJazzcashPayment,
} from '../controllers/paymentController.js'
import { protect } from '../middleware/auth.js'
import { checkoutLimiter } from '../middleware/rateLimiter.js'

const router = Router()

/* Stripe */
router.post('/create-checkout-session', protect, checkoutLimiter, createCheckoutSession)
router.post('/create-guest-checkout-session', checkoutLimiter, createGuestCheckoutSession)
router.get('/verify-session', verifySession)

/* JazzCash */
router.post('/create-jazzcash-order', protect, checkoutLimiter, createJazzcashOrder)
router.post('/create-guest-jazzcash-order', checkoutLimiter, createGuestJazzcashOrder)
router.post('/verify-jazzcash-payment', verifyJazzcashPayment)

export default router
