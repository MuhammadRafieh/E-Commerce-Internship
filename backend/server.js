import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { connectDB } from './config/db.js'
import { corsOptions } from './config/cors.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import Order from './models/Order.js'
import Product from './models/Product.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

const app = express()

/* Stripe webhook — needs raw body BEFORE express.json */
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
        const order = await Order.findById(orderId)
        if (order) {
          order.isPaid = true
          order.paidAt = new Date()
          /* Stock is deducted when admin confirms the order */
          await order.save()
        }
      }
    }

    res.json({ received: true })
  })
}

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})
