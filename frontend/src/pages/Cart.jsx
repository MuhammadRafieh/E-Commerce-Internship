import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trash2, ShoppingBag, ChevronLeft, Percent, Ticket, Shield } from '../components/ui/Icons'
import QuantitySelector from '../components/ui/QuantitySelector'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../services/api'

export default function Cart() {
  const { user } = useAuth()
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, coupon, discount, applyCoupon, removeCoupon } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [validating, setValidating] = useState(false)
  const promoApplied = !!coupon

  const handleApplyPromo = async (e) => {
    e.preventDefault()
    if (!promoCode.trim()) return
    if (!user) { toast.error('Please log in to apply a coupon'); return }

    setValidating(true)
    try {
      const res = await api.post('/coupons/validate', {
        code: promoCode.trim(),
        orderTotal: totalPrice,
      })
      if (res.data.valid) {
        applyCoupon(res.data.coupon, res.data.discountAmount)
        setPromoCode('')
        toast.success(`Coupon applied! You saved ${formatCurrency(res.data.discountAmount)}`)
      }
    } catch (err) {
      removeCoupon()
      toast.error(err.response?.data?.message || 'Invalid coupon code')
    } finally {
      setValidating(false)
    }
  }

  const shipping = totalPrice >= 50 ? 0 : 9.99
  const grandTotal = totalPrice + shipping - discount

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-night-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
        <p className="text-gray-400 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97]"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-white font-medium">Cart ({totalItems} items)</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product}
              className="flex gap-4 sm:gap-6 bg-night-900 rounded-xl border border-night-700 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <Link to={`/product/${item.product}`} className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-night-800">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/product/${item.product}`}
                      className="text-sm sm:text-base font-semibold text-white hover:text-primary-400 transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-400 mt-0.5">{formatCurrency(item.price)} each</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors active:scale-90 shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(qty) => updateQuantity(item.product, qty)}
                    min={1}
                    max={99}
                  />
                  <span className="text-base sm:text-lg font-bold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Continue shopping */}
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors mt-2"
          >
            <ChevronLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-night-900 rounded-xl border border-night-700 p-6 shadow-sm sticky top-28">
            <h2 className="text-lg font-semibold text-white mb-6">Order Summary</h2>

            {/* Promo Code */}
            <form onSubmit={handleApplyPromo} className="mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code"
                    className="w-full pl-9 pr-3 py-2 border border-night-700 bg-night-950 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!promoCode.trim() || validating}
                  className="px-4 py-2 text-sm font-medium text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                  {validating ? '...' : 'Apply'}
                </button>
              </div>
              {promoApplied && (
                    <p className="flex items-center gap-1 mt-2 text-xs text-green-500 font-medium">
                  <Percent size={12} />
                  Discount of {formatCurrency(discount)} applied!
                </p>
              )}
            </form>

            {/* Totals */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({totalItems} items)</span>
                <span className="font-medium text-white">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-white">
                  {shipping === 0 ? <span className="text-green-500">Free</span> : formatCurrency(shipping)}
                </span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(discount)}</span>
                </div>
              )}
              <hr className="border-night-700" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold text-white text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <Link
              to="/checkout"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] shadow-md shadow-primary-600/20"
            >
              Proceed to Checkout
            </Link>

            {/* Trust badges */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield size={14} />
              <span>Secure checkout · SSL encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
