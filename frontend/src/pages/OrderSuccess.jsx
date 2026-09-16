import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { Check, Package } from '../components/ui/Icons'
import { paymentService } from '../services/paymentService'

export default function OrderSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(true)
  const fired = useRef(false)

  useEffect(() => {
    if (!sessionId || !orderId) { setChecking(false); return }
    paymentService.verifySession(sessionId, orderId)
      .then((res) => setVerified(res.data.verified))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [sessionId, orderId])

  useEffect(() => {
    if (!checking && verified && !fired.current) {
      fired.current = true
      const duration = 3000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981'],
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      const t = setTimeout(() => navigate('/orders', { replace: true }), 2500)
      return () => clearTimeout(t)
    }
  }, [checking, verified, navigate])

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {checking ? (
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
      ) : (
        <>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            verified ? 'bg-green-500/15' : 'bg-night-800'
          }`}>
              {verified ? (
                <Check size={28} className="text-green-400" />
              ) : (
                <Package size={28} className="text-gray-400" />
              )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {verified ? 'Payment successful!' : orderId ? 'Order received' : 'Missing information'}
          </h1>
          <p className="text-gray-500 mb-2">
            {verified
              ? 'Your payment has been processed successfully.'
              : orderId
                ? 'Your order has been placed. Payment will be verified shortly.'
                : 'We couldn\'t verify your payment details.'}
          </p>
          {orderId && (
            <p className="text-xs text-gray-400 mb-8">
              Order ID: #{orderId.slice(-8).toUpperCase()}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Link to="/orders"
              className="inline-flex px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
              View Orders
            </Link>
            <Link to="/shop"
              className="inline-flex px-6 py-3 border border-night-700 text-gray-200 font-semibold rounded-xl hover:bg-white/10 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
