import Order, { ORDER_STATUSES } from '../models/Order.js'
import Product from '../models/Product.js'

export const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice, discount } =
    req.body

  const order = await Order.create({
    user: req.user?.id || null,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    discount: discount || 0,
    totalPrice,
    status: 'ordered',
    statusHistory: [{ status: 'ordered', timestamp: new Date() }],
  })

  res.status(201).json(order)
}

export const createGuestOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice, discount, guestEmail } =
    req.body

  if (!guestEmail) {
    return res.status(400).json({ message: 'Email is required for guest checkout' })
  }

  const order = await Order.create({
    user: null,
    guestEmail,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    discount: discount || 0,
    totalPrice,
    status: 'ordered',
    statusHistory: [{ status: 'ordered', timestamp: new Date() }],
  })

  res.status(201).json(order)
}

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt')
  res.json(orders)
}

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email')
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const isAdmin = req.user && req.user.role === 'admin'
  if (!isAdmin && order.user._id.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' })
  }

  res.json(order)
}

export const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt')
  res.json(orders)
}

export const markOrderAsPaid = async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  order.isPaid = true
  order.paidAt = new Date()
  const updated = await order.save()
  res.json(updated)
}

export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const { status, note } = req.body

  if (status) {
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}` })
    }

    /* Deduct stock when confirming an order (only once) */
    if (status === 'confirmed' && order.status !== 'confirmed') {
      for (const item of order.items) {
        const product = await Product.findById(item.product)
        if (!product) {
          return res.status(400).json({ message: `Product "${item.name}" not found in inventory` })
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Available: ${product.stock}, ordered: ${item.quantity}`,
          })
        }
        product.stock -= item.quantity
        await product.save()
      }
    }

    order.status = status
    order.statusHistory.push({ status, note: note || '', timestamp: new Date() })

    if (status === 'delivered') {
      order.isDelivered = true
      order.deliveredAt = new Date()
    }
  }

  const updated = await order.save()
  res.json(updated)
}
