import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
    image: String,
  },
  { _id: false },
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
)

const ORDER_STATUSES = [
  'ordered',
  'confirmed',
  'dispatched',
  'arrived_at_city',
  'assigned_to_rider',
  'delivered',
]

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestEmail: { type: String, default: null },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: { type: String, default: 'stripe' },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'ordered',
    },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
export { ORDER_STATUSES }
