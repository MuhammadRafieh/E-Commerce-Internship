import Cart from '../models/Cart.js'

export const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate('items.product')
  if (!cart) cart = { items: [] }
  res.json(cart)
}

export const addToCart = async (req, res) => {
  const { productId, quantity, price } = req.body
  let cart = await Cart.findOne({ user: req.user.id })
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] })
  }

  const existing = cart.items.find((i) => i.product.toString() === productId)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.items.push({ product: productId, quantity, price })
  }

  await cart.save()
  cart = await Cart.findOne({ user: req.user.id }).populate('items.product')
  res.json(cart)
}

export const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId)
  await cart.save()
  res.json(cart)
}
