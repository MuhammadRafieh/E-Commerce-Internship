import Coupon from '../models/Coupon.js'

/* ─── shared validation logic ─── */
async function validateCouponCode(code, orderTotal) {
  const result = { valid: false, discount: 0, finalTotal: orderTotal, coupon: null, message: '' }

  if (!code || orderTotal == null) {
    result.message = 'Coupon code and order total are required'
    return result
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true })

  if (!coupon) {
    result.message = 'Invalid or expired coupon code'
    return result
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    result.message = 'This coupon has expired'
    return result
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    result.message = 'This coupon has reached its usage limit'
    return result
  }

  if (orderTotal < coupon.minOrderValue) {
    result.message = `Minimum order value of Rs ${coupon.minOrderValue} required for this coupon`
    return result
  }

  let discount = 0
  if (coupon.discountType === 'percentage') {
    discount = (orderTotal * coupon.discountAmount) / 100
    if (discount > orderTotal) discount = orderTotal
  } else {
    discount = Math.min(coupon.discountAmount, orderTotal)
  }

  result.valid = true
  result.discount = Math.round(discount * 100) / 100
  result.finalTotal = Math.round((orderTotal - discount) * 100) / 100
  result.coupon = { code: coupon.code, discountType: coupon.discountType, discountAmount: coupon.discountAmount }
  result.message = `Coupon applied! You saved Rs ${result.discount}`
  return result
}

/**
 * POST /api/coupons/validate
 * Body: { code, orderTotal }
 */
export const validateCoupon = async (req, res) => {
  const { code, orderTotal } = req.body
  const result = await validateCouponCode(code, orderTotal)

  if (!result.valid) {
    return res.status(400).json({ valid: false, message: result.message })
  }

  res.json({
    valid: true,
    discountType: result.coupon.discountType,
    discountAmount: result.discount,
    finalTotal: result.finalTotal,
    coupon: result.coupon,
  })
}

/**
 * POST /api/coupons/apply
 * Body: { code, orderTotal }
 * Validates + increments usedCount
 */
export const applyCoupon = async (req, res) => {
  const { code, orderTotal } = req.body
  const result = await validateCouponCode(code, orderTotal)

  if (!result.valid) {
    return res.status(400).json({ valid: false, message: result.message })
  }

  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } })

  res.json({
    valid: true,
    discountType: result.coupon.discountType,
    discountAmount: result.discount,
    finalTotal: result.finalTotal,
    coupon: result.coupon,
    message: result.message,
  })
}

/* ================================================================
 *  ADMIN CRUD
 * ================================================================ */

/**
 * GET /api/coupons — list all coupons
 */
export const getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 })
  res.json(coupons)
}

/**
 * GET /api/coupons/:id — get single coupon
 */
export const getCouponById = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' })
  res.json(coupon)
}

/**
 * POST /api/coupons — create a new coupon
 */
export const createCoupon = async (req, res) => {
  const { code, discountType, discountAmount, minOrderValue, maxUses, expiresAt, isActive } = req.body

  if (!code || !discountType || discountAmount == null) {
    return res.status(400).json({ message: 'Code, discount type, and discount amount are required' })
  }

  if (!['percentage', 'flat'].includes(discountType)) {
    return res.status(400).json({ message: 'discountType must be "percentage" or "flat"' })
  }

  if (discountAmount < 0) {
    return res.status(400).json({ message: 'Discount amount must be positive' })
  }

  const existing = await Coupon.findOne({ code: code.toUpperCase() })
  if (existing) {
    return res.status(409).json({ message: 'A coupon with this code already exists' })
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountAmount,
    minOrderValue: minOrderValue || 0,
    maxUses: maxUses || null,
    expiresAt: expiresAt || null,
    isActive: isActive !== undefined ? isActive : true,
  })

  res.status(201).json(coupon)
}

/**
 * PUT /api/coupons/:id — update a coupon
 */
export const updateCoupon = async (req, res) => {
  const { code, discountType, discountAmount, minOrderValue, maxUses, expiresAt, isActive } = req.body

  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' })

  if (code && code.toUpperCase() !== coupon.code) {
    const existing = await Coupon.findOne({ code: code.toUpperCase() })
    if (existing) return res.status(409).json({ message: 'A coupon with this code already exists' })
  }

  if (code) coupon.code = code.toUpperCase()
  if (discountType) {
    if (!['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({ message: 'discountType must be "percentage" or "flat"' })
    }
    coupon.discountType = discountType
  }
  if (discountAmount != null) coupon.discountAmount = discountAmount
  if (minOrderValue != null) coupon.minOrderValue = minOrderValue
  if (maxUses !== undefined) coupon.maxUses = maxUses
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt
  if (isActive !== undefined) coupon.isActive = isActive

  await coupon.save()
  res.json(coupon)
}

/**
 * PATCH /api/coupons/:id/toggle — toggle isActive
 */
export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' })

  coupon.isActive = !coupon.isActive
  await coupon.save()
  res.json(coupon)
}

/**
 * DELETE /api/coupons/:id — delete a coupon
 */
export const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' })

  await coupon.deleteOne()
  res.json({ message: 'Coupon deleted' })
}
