import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Shield, Lock, Search, Check, CreditCard, Banknote, Smartphone, Percent, Ticket } from '../components/ui/Icons'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderService } from '../services/orderService'
import { paymentService } from '../services/paymentService'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../services/api'

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua & Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia & Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' }, { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' }, { code: 'CV', name: 'Cape Verde' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Congo (DRC)' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' }, { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' }, { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' }, { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' }, { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' }, { code: 'MH', name: 'Marshall Islands' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' }, { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'KP', name: 'North Korea' }, { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' },
  { code: 'PS', name: 'Palestine' }, { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' },
  { code: 'KN', name: 'Saint Kitts & Nevis' }, { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent & the Grenadines' }, { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'São Tomé & Príncipe' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' },
  { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad & Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' }, { code: 'VA', name: 'Vatican City' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
]

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Pay securely with Stripe' },
  { id: 'jazzcash', label: 'JazzCash / Easypaisa', icon: Smartphone, desc: 'Pay with mobile wallet' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
]

export default function Checkout() {
  const { items, totalPrice, discount, coupon, clearCart, applyCoupon, removeCoupon } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    fullName: user?.name || '',
    guestEmail: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US',
  })
  const [countrySearch, setCountrySearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [jazzcashOrder, setJazzcashOrder] = useState(null)
  const [promoCode, setPromoCode] = useState('')
  const [validating, setValidating] = useState(false)

  const canceled = searchParams.get('canceled')
  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  )

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const shipping = totalPrice >= 50 ? 0 : 9.99
  const grandTotal = Math.max(0, totalPrice + shipping - discount)

  const orderPayload = {
    items: items.map((i) => ({
      product: i.product,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    })),
    shippingAddress: form,
    itemsPrice: totalPrice,
    shippingPrice: shipping,
    discount,
    totalPrice: grandTotal,
  }

  const handleJazzcashPayment = async (orderData) => {
    setSubmitting(true)
    try {
      const res = user
        ? await paymentService.createJazzcashOrder(orderData)
        : await paymentService.createGuestJazzcashOrder({ ...orderData, guestEmail: form.guestEmail })
      setJazzcashOrder(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'JazzCash payment failed.')
      setSubmitting(false)
    }
  }

  const handleSimulatePayment = async () => {
    setSubmitting(true)
    try {
      await paymentService.verifyJazzcashPayment({ order_id: jazzcashOrder.orderId })
      clearCart()
      setJazzcashOrder(null)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed.')
      setSubmitting(false)
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...orderPayload,
        paymentMethod,
        guestEmail: !user ? form.guestEmail : undefined,
      }

      if (paymentMethod === 'cod') {
        if (user) {
          await orderService.create(payload)
        } else {
          await api.post('/orders/guest', payload)
        }
        clearCart()
        setSuccess(true)
      } else if (paymentMethod === 'jazzcash') {
        await handleJazzcashPayment(payload)
      } else {
        const res = user
          ? await paymentService.createCheckoutSession(payload)
          : await paymentService.createGuestCheckoutSession(payload)
        clearCart()
        window.location.href = res.data.sessionUrl
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0 && !success && !jazzcashOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
        <Link to="/shop" className="text-primary-400 font-medium hover:text-primary-300">
          Continue Shopping
        </Link>
      </div>
    )
  }

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => navigate('/orders', { replace: true }), 1500)
      return () => clearTimeout(t)
    }
  }, [success, navigate])

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={28} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Order placed!</h1>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        <p className="text-gray-400 text-sm mb-8">Redirecting to your orders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/cart" className="hover:text-gray-300 transition-colors">Cart</Link>
        <span>/</span>
        <span className="text-white font-medium">Checkout</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Checkout</h1>

      {jazzcashOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-night-900 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone size={28} className="text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">JazzCash Payment</h2>
            {jazzcashOrder.demo ? (
              <>
                <p className="text-gray-500 text-sm mb-6">{jazzcashOrder.message}</p>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : (
                    'Simulate Payment'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setJazzcashOrder(null); setSubmitting(false) }}
                  className="mt-3 w-full px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-night-800 transition-colors text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-2">Redirecting to JazzCash...</p>
                <p className="text-xs text-gray-400 mb-6">You will be redirected to the secure JazzCash payment page.</p>
                <form action={jazzcashOrder.redirectUrl} method="POST" onSubmit={() => clearCart()} ref={(ref) => ref && ref.submit()}>
                  {Object.entries(jazzcashOrder.formFields).map(([key, val]) => (
                    <input key={key} type="hidden" name={key} value={val} />
                  ))}
                  <button type="submit" className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                    Proceed to JazzCash
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {canceled && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl">
          Payment was canceled. You can try again.
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left column — shipping + payment */}
          <div className="lg:col-span-3 space-y-5">
            {/* Shipping address */}
            <div className="bg-night-900 rounded-xl border border-night-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-5">Shipping Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <input type="text" required value={form.fullName} onChange={update('fullName')}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                {!user && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-gray-400 font-normal">(for order updates)</span></label>
                    <input type="email" required value={form.guestEmail} onChange={update('guestEmail')}
                      className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="you@example.com" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <input type="text" required value={form.address} onChange={update('address')}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                    <input type="text" required value={form.city} onChange={update('city')}
                      className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Postal Code</label>
                    <input type="text" required value={form.postalCode} onChange={update('postalCode')}
                      className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                  <div className="relative mb-2">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search your country..."
                      className="w-full pl-9 pr-3 py-2 border border-night-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  </div>
                  <select value={form.country} onChange={(e) => { update('country')(e); setCountrySearch('') }}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Select a country</option>
                    {filteredCountries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {countrySearch && filteredCountries.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No countries match &quot;{countrySearch}&quot;</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-night-900 rounded-xl border border-night-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon
                  const selected = paymentMethod === pm.id
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500'
                          : 'border-night-700 hover:border-night-600 hover:bg-white/5'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selected ? 'bg-primary-500/15 text-primary-300' : 'bg-night-800 text-gray-500'}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${selected ? 'text-primary-300' : 'text-white'}`}>{pm.label}</p>
                        <p className="text-xs text-gray-500">{pm.desc}</p>
                      </div>
                      {selected && <Check size={18} className="text-primary-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-night-900 rounded-xl border border-night-700 p-6 shadow-sm sticky top-28">
              <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.product} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-night-800 overflow-hidden shrink-0">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <form onSubmit={handleApplyPromo} className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code"
                      className="w-full pl-9 pr-3 py-2 border border-night-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                {coupon && (
                  <p className="flex items-center gap-1 mt-2 text-xs text-green-700 font-medium">
                    <Percent size={12} />
                    Discount of {formatCurrency(discount)} applied!
                  </p>
                )}
              </form>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-700">Free</span> : formatCurrency(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-base font-bold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Lock size={18} />
                )}
                {submitting
                  ? paymentMethod === 'stripe' ? 'Redirecting to Stripe...' : 'Processing...'
                  : paymentMethod === 'stripe' ? `Pay ${formatCurrency(grandTotal)}`
                  : paymentMethod === 'jazzcash' ? `Pay with JazzCash — ${formatCurrency(grandTotal)}`
                  : `Place Order — ${formatCurrency(grandTotal)}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <Shield size={14} />
                <span>Secure checkout · SSL encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
