import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Calendar, ChevronRight, Check, X } from '../components/ui/Icons'
import { orderService } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'
import { useAuth } from '../context/AuthContext'
import OrderTracker, { STATUS_LABELS } from '../components/common/OrderTracker'

const STATUS = {
  PAID: { label: 'Paid', class: 'text-green-700 bg-green-50 border-green-200' },
  UNPAID: { label: 'Unpaid', class: 'text-amber-700 bg-amber-50 border-amber-200' },
  DELIVERED: { label: 'Delivered', class: 'text-green-700 bg-green-50 border-green-200' },
  PENDING: { label: 'Processing', class: 'text-teal-700 bg-teal-50 border-teal-200' },
}

export default function MyOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    orderService.getMyOrders()
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
      <div className="flex items-center gap-3 mb-8">
        <Package size={24} className="text-gray-400" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Orders</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <X size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Looks like you haven&apos;t placed any orders.</p>
          <Link to="/shop" className="inline-flex px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const oid = order.id || order._id
          const isOpen = expanded === oid
          const paidStatus = order.isPaid ? STATUS.PAID : STATUS.UNPAID
          const deliverStatus = order.isDelivered ? STATUS.DELIVERED : STATUS.PENDING

          return (
            <div key={oid} className="bg-night-900 rounded-2xl border border-night-700 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : oid)}
                className="w-full text-left p-5 sm:px-6 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">#{oid.slice(-8).toUpperCase()}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Calendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${paidStatus.class}`}>
                      {paidStatus.label}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${deliverStatus.class}`}>
                      {STATUS_LABELS[order.status] || deliverStatus.label}
                    </span>
                    <span className="text-sm font-bold text-white min-w-[80px] text-right">{formatCurrency(order.totalPrice)}</span>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-night-700 px-5 sm:px-6 py-4 space-y-4 animate-slide-down">
                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-night-800 overflow-hidden shrink-0 border border-night-700">
                          <img src={item.image} alt="" className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = ''; e.target.style.display = 'none' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium text-white">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Status Tracker */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Order Status</p>
                    <OrderTracker status={order.status} statusHistory={order.statusHistory || []} />
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.itemsPrice)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span>
                      <span>{order.shippingPrice === 0 ? <span className="text-green-700">Free</span> : formatCurrency(order.shippingPrice)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-white">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalPrice)}</span>
                    </div>
                  </div>

                  {/* Shipping address */}
                  {order.shippingAddress && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Shipping To</p>
                      <p className="text-sm text-gray-300">
                        {order.shippingAddress.fullName}<br />
                        {order.shippingAddress.address}, {order.shippingAddress.city}<br />
                        {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {/* Payment info */}
                    <div className="border-t border-night-700 pt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Check size={14} className={order.isPaid ? 'text-green-500' : 'text-gray-500'} />
                    <span>{order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString('en-PK')}` : 'Awaiting payment'}</span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
