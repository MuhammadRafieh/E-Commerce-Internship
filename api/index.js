import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import Stripe from 'stripe'
import path from 'path'
import { fileURLToPath } from 'url'

import { corsOptions } from '../backend/config/cors.js'
import { errorHandler } from '../backend/middleware/errorHandler.js'
import authRoutes from '../backend/routes/authRoutes.js'
import productRoutes from '../backend/routes/productRoutes.js'
import cartRoutes from '../backend/routes/cartRoutes.js'
import orderRoutes from '../backend/routes/orderRoutes.js'
import categoryRoutes from '../backend/routes/categoryRoutes.js'
import paymentRoutes from '../backend/routes/paymentRoutes.js'
import uploadRoutes from '../backend/routes/uploadRoutes.js'
import aiRoutes from '../backend/routes/aiRoutes.js'
import couponRoutes from '../backend/routes/couponRoutes.js'
import adminRoutes from '../backend/routes/adminRoutes.js'
import Order from '../backend/models/Order.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

let cached = global._mongooseCache
if (!cached) cached = global._mongooseCache = { conn: null, promise: null }

async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then((m) => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}

const app = express()

/* Stripe webhook — raw body BEFORE json middleware */
if (stripe) {
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { isPaid: true, paidAt: new Date() })
      }
    }
    res.json({ received: true })
  })
}

app.use(cors(corsOptions))
/* Required for the HttpOnly auth cookie to be readable by `protect`. Without
   it every authenticated request falls through to the Bearer branch, which
   the browser never sends, so login appears to succeed and then 401s. */
app.use(cookieParser())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '..', 'backend', 'uploads')))

/* Keep in sync with backend/server.js — a route mounted in one but not the
   other is a 404 in production only. */
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api', paymentRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

export default async function handler(req, res) {
  try {
    await dbConnect()
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    return res.status(500).json({ message: 'Database connection failed' })
  }
  return app(req, res)
}
