import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search, Check, X, ChevronRight, Calendar, Truck } from '../components/ui/Icons'
import { orderService } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'
import OrderTracker, { ORDER_STEPS, STATUS_LABELS } from '../components/common/OrderTracker'

const STATUS = {
  PAID: { label: 'Paid', class: 'text-green-700 bg-green-50 border-green-200' },
  UNPAID: { label: 'Unpaid', class: 'text-amber-700 bg-amber-50 border-amber-200' },
  DELIVERED: { label: 'Delivered', class: 'text-green-700 bg-green-50 border-green-200' },
  PENDING: { label: 'Processing', class: 'text-teal-700 bg-teal-50 border-teal-200' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchOrders = () => {
    setLoading(true)
    orderService.getAll()
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleMarkAsPaid = async (orderId) => {
    try {
      const res = await orderService.markAsPaid(orderId)
      setOrders((prev) =>
        prev.map((o) =>
          ((o.id || o._id) === orderId ? res.data : o),
        ),
      )
      flash('Order marked as paid')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as paid')
    }
  }

  const flash = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await orderService.update(orderId, { status: newStatus })
      setOrders((prev) =>
        prev.map((o) =>
          (o.id || o._id) === orderId ? res.data : o,
        ),
      )
      flash(`Status updated to "${STATUS_LABELS[newStatus]}"`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status')
    }
  }

  const getNextStatuses = (currentStatus) => {
    const idx = ORDER_STEPS.findIndex((s) => s.key === currentStatus)
    if (idx === -1 || idx >= ORDER_STEPS.length - 1) return []
    return ORDER_STEPS.slice(idx + 1)
  }

  const filtered = orders.filter((o) => {
    if (filter === 'paid') return o.isPaid
    if (filter === 'unpaid') return !o.isPaid
    if (filter === 'delivered') return o.isDelivered
    if (filter === 'pending') return !o.isDelivered
    return true
  }).filter((o) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const oid = (o.id || o._id).toLowerCase()
    const name = (o.user?.name || '').toLowerCase()
    const email = (o.user?.email || '').toLowerCase()
    return oid.includes(q) || name.includes(q) || email.includes(q)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer orders</p>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] shadow-sm"
        >
          Back to Products
        </Link>
      </div>

      {/* Flash messages */}
      {success && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl flex items-center gap-2">
          <Check size={16} className="shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <X size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'unpaid', 'delivered', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-night-900 border border-night-700 text-gray-400 hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No orders found</h2>
          <p className="text-gray-500">No orders match your current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const oid = order.id || order._id
            const isOpen = expanded === oid
            const paidStatus = order.isPaid ? STATUS.PAID : STATUS.UNPAID
            const deliverStatus = order.isDelivered ? STATUS.DELIVERED : STATUS.PENDING
            const currentStatusLabel = STATUS_LABELS[order.status] || deliverStatus.label

            return (
              <div key={oid} className="bg-night-900 rounded-2xl border border-night-700 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : oid)}
                  className="w-full text-left p-5 sm:px-6 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-primary-500/15 rounded-lg flex items-center justify-center shrink-0">
                        <Package size={16} className="text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">#{oid.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.user?.name || 'Unknown'} · {order.user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${paidStatus.class}`}>
                        {paidStatus.label}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${deliverStatus.class}`}>
                        {currentStatusLabel}
                      </span>
                      <span className="text-sm font-bold text-white min-w-[80px] text-right">{formatCurrency(order.totalPrice)}</span>
                      <ChevronRight size={16} className={`text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-night-700 px-5 sm:px-6 py-4 space-y-4 animate-slide-down">
                    {/* Items */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-14 h-14 rounded-xl bg-night-800 overflow-hidden shrink-0 border border-night-700">
                            <img src={item.image} alt="" className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                          </div>
                          <span className="text-sm font-medium text-white">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Status Tracker */}
                    <div className="border-t border-night-700 pt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order Status</p>
                      <OrderTracker status={order.status} statusHistory={order.statusHistory || []} />
                    </div>

                    {/* Price breakdown */}
                    <div className="border-t border-night-700 pt-3 space-y-1 text-sm">
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
                      <div className="border-t border-night-700 pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Shipping To</p>
                        <p className="text-sm text-gray-300">
                          {order.shippingAddress.fullName}<br />
                          {order.shippingAddress.address}, {order.shippingAddress.city}<br />
                          {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                        </p>
                      </div>
                    )}

                    {/* Payment info */}
                    <div className="border-t border-night-700 pt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${order.isPaid ? 'bg-green-500' : 'bg-amber-400'}`} />
                        <span>{order.isPaid ? `Paid ${order.paidAt ? `on ${new Date(order.paidAt).toLocaleDateString('en-PK')}` : ''}` : 'Not paid'}</span>
                        {!order.isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(oid)}
                            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium rounded-md hover:bg-emerald-100 transition-colors"
                          >
                            <Check size={11} />
                            Mark Paid
                          </button>
                        )}
                      </div>
                      <span className="text-gray-300">|</span>
                      <span>{order.paymentMethod === 'stripe' ? 'Card (Stripe)' : 'Cash on Delivery'}</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Status management */}
                    <div className="border-t border-night-700 pt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                      {order.isDelivered ? (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl">
                          <Check size={16} />
                          Order has been delivered
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {getNextStatuses(order.status).map((step) => (
                            <button
                              key={step.key}
                              onClick={() => handleStatusUpdate(oid, step.key)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97]"
                            >
                              <Truck size={16} />
                              Mark as {step.label}
                            </button>
                          ))}
                          {getNextStatuses(order.status).length === 0 && (
                            <span className="text-sm text-gray-500">No further updates available</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
