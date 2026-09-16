import api from './api'

export const paymentService = {
  /* Stripe */
  createCheckoutSession: (data) => api.post('/create-checkout-session', data),
  createGuestCheckoutSession: (data) => api.post('/create-guest-checkout-session', data),
  verifySession: (sessionId, orderId) => api.get('/verify-session', { params: { session_id: sessionId, order_id: orderId } }),

  /* JazzCash */
  createJazzcashOrder: (data) => api.post('/create-jazzcash-order', data),
  createGuestJazzcashOrder: (data) => api.post('/create-guest-jazzcash-order', data),
  verifyJazzcashPayment: (data) => api.post('/verify-jazzcash-payment', data),
}
