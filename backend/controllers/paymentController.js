import Stripe from 'stripe'
import crypto from 'crypto'
import Order from '../models/Order.js'

/* ─── Stripe ─── */
let _stripe = null
function getStripe() {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

/* ================================================================
 *  STRIPE
 * ================================================================ */

export const createCheckoutSession = async (req, res) => {
  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({ message: 'Payment gateway not configured' })
  }

  const { items, shippingAddress, itemsPrice, shippingPrice, totalPrice } = req.body

  const order = await Order.create({
    user: req.user.id,
    items,
    shippingAddress,
    paymentMethod: 'stripe',
    itemsPrice,
    shippingPrice,
    totalPrice,
  })

  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'pkr',
      product_data: { name: item.name, images: [item.image].filter(Boolean) },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }))

  if (shippingPrice > 0) {
    lineItems.push({
      price_data: {
        currency: 'pkr',
        product_data: { name: 'Shipping' },
        unit_amount: Math.round(shippingPrice * 100),
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    metadata: { orderId: (order.id || order._id).toString() },
    success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id || order._id}`,
    cancel_url: `${process.env.CLIENT_URL}/checkout?canceled=true`,
  })

  res.json({ sessionUrl: session.url, orderId: order.id || order._id })
}

export const createGuestCheckoutSession = async (req, res) => {
  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({ message: 'Payment gateway not configured' })
  }

  const { items, shippingAddress, itemsPrice, shippingPrice, totalPrice, discount, guestEmail } = req.body

  if (!guestEmail) {
    return res.status(400).json({ message: 'Email is required for guest checkout' })
  }

  const order = await Order.create({
    user: null,
    guestEmail,
    items,
    shippingAddress,
    paymentMethod: 'stripe',
    itemsPrice,
    shippingPrice,
    discount: discount || 0,
    totalPrice,
    status: 'ordered',
    statusHistory: [{ status: 'ordered', timestamp: new Date() }],
  })

  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'pkr',
      product_data: { name: item.name, images: [item.image].filter(Boolean) },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }))

  if (shippingPrice > 0) {
    lineItems.push({
      price_data: {
        currency: 'pkr',
        product_data: { name: 'Shipping' },
        unit_amount: Math.round(shippingPrice * 100),
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    metadata: { orderId: (order.id || order._id).toString() },
    success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id || order._id}`,
    cancel_url: `${process.env.CLIENT_URL}/checkout?canceled=true`,
  })

  res.json({ sessionUrl: session.url, orderId: order.id || order._id })
}

export const verifySession = async (req, res) => {
  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({ message: 'Payment gateway not configured' })
  }

  const { session_id, order_id } = req.query
  if (!session_id || !order_id) {
    return res.status(400).json({ message: 'Missing session_id or order_id' })
  }

  const session = await stripe.checkout.sessions.retrieve(session_id)
  if (session.payment_status === 'paid') {
    await Order.findByIdAndUpdate(order_id, { isPaid: true, paidAt: new Date() })
    return res.json({ verified: true })
  }
  res.json({ verified: false })
}

/* ================================================================
 *  JAZZCASH
 * ================================================================
 *
 *  Integration notes for live credentials:
 *    - Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_HASH_KEY in .env
 *    - Set JAZZCASH_RETURN_URL to your callback endpoint
 *    - The API endpoint for live is:
 *      https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction
 *      (use sandbox for testing, change to production URL for live)
 *
 *  When credentials are missing, the system falls back to a simulated
 *  payment flow for development/demo.
 * ================================================================ */

function buildOrderPayload(body, paymentMethod) {
  const { items, shippingAddress, itemsPrice, shippingPrice, totalPrice, discount, guestEmail } = body
  return {
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    discount: discount || 0,
    totalPrice,
    status: 'ordered',
    statusHistory: [{ status: 'ordered', timestamp: new Date() }],
    ...(guestEmail ? { user: null, guestEmail } : {}),
  }
}

export const createJazzcashOrder = async (req, res) => {
  const payload = buildOrderPayload(req.body, 'jazzcash')
  payload.user = req.user.id
  const order = await Order.create(payload)

  const merchantId = process.env.JAZZCASH_MERCHANT_ID
  const hasLiveCredentials = merchantId && process.env.JAZZCASH_PASSWORD && process.env.JAZZCASH_HASH_KEY

  if (hasLiveCredentials) {
    /* ── Live JazzCash API integration ── */
    const txRef = `JC${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const amount = Math.round(order.totalPrice)

    const integritySalt = [
      `${process.env.JAZZCASH_HASH_KEY}&`,
      `${process.env.JAZZCASH_RETURN_URL}&`,
      `${merchantId}&`,
      ``,
      `${process.env.CLIENT_URL}/jazzcash-callback`,
      `${txRef}`,
      `${amount}`,
      `PKR`,
      `${process.env.JAZZCASH_PASSWORD}`,
    ].join('')

    const hash = crypto.createHash('sha256').update(integritySalt).digest('hex')

    res.json({
      orderId: order.id || order._id,
      redirectUrl: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction',
      formFields: {
        pp_Version: '2.0',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_SubMerchantID: '',
        pp_Password: process.env.JAZZCASH_PASSWORD,
        pp_BankID: '',
        pp_ProductID: '',
        pp_TxnRefNo: txRef,
        pp_Amount: String(amount * 100),
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        pp_BillReference: txRef,
        pp_Description: `Order #${(order.id || order._id).toString().slice(-8).toUpperCase()}`,
        pp_ReturnURL: process.env.JAZZCASH_RETURN_URL,
        pp_SecureHash: hash,
        ppmpf_1: (order.id || order._id).toString(),
        ppmpf_2: 'ecommerce',
      },
    })
  } else {
    /* ── Demo / simulated flow ── */
    res.json({
      orderId: order.id || order._id,
      demo: true,
      message: 'JazzCash is in demo mode. Click "Simulate Payment" to complete the order.',
    })
  }
}

export const createGuestJazzcashOrder = async (req, res) => {
  const { guestEmail } = req.body
  if (!guestEmail) {
    return res.status(400).json({ message: 'Email is required for guest checkout' })
  }

  const payload = buildOrderPayload(req.body, 'jazzcash')
  const order = await Order.create(payload)

  const merchantId = process.env.JAZZCASH_MERCHANT_ID
  const hasLiveCredentials = merchantId && process.env.JAZZCASH_PASSWORD && process.env.JAZZCASH_HASH_KEY

  if (hasLiveCredentials) {
    const txRef = `JC${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const amount = Math.round(order.totalPrice)

    const integritySalt = [
      `${process.env.JAZZCASH_HASH_KEY}&`,
      `${process.env.JAZZCASH_RETURN_URL}&`,
      `${merchantId}&`,
      ``,
      `${process.env.CLIENT_URL}/jazzcash-callback`,
      `${txRef}`,
      `${amount}`,
      `PKR`,
      `${process.env.JAZZCASH_PASSWORD}`,
    ].join('')

    const hash = crypto.createHash('sha256').update(integritySalt).digest('hex')

    res.json({
      orderId: order.id || order._id,
      redirectUrl: 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction',
      formFields: {
        pp_Version: '2.0',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_SubMerchantID: '',
        pp_Password: process.env.JAZZCASH_PASSWORD,
        pp_BankID: '',
        pp_ProductID: '',
        pp_TxnRefNo: txRef,
        pp_Amount: String(amount * 100),
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        pp_BillReference: txRef,
        pp_Description: `Order #${(order.id || order._id).toString().slice(-8).toUpperCase()}`,
        pp_ReturnURL: process.env.JAZZCASH_RETURN_URL,
        pp_SecureHash: hash,
        ppmpf_1: (order.id || order._id).toString(),
        ppmpf_2: 'ecommerce',
      },
    })
  } else {
    res.json({
      orderId: order.id || order._id,
      demo: true,
      message: 'JazzCash is in demo mode. Click "Simulate Payment" to complete the order.',
    })
  }
}

export const verifyJazzcashPayment = async (req, res) => {
  const { order_id } = req.body
  if (!order_id) {
    return res.status(400).json({ message: 'Missing order_id' })
  }

  await Order.findByIdAndUpdate(order_id, {
    isPaid: true,
    paidAt: new Date(),
  })

  const order = await Order.findById(order_id)
  res.json({ verified: true, order })
}
