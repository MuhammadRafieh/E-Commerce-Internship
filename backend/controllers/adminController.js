import Order from '../models/Order.js'

function dateRange(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d
}

export const getSalesAnalytics = async (req, res) => {
  const now = new Date()
  now.setHours(23, 59, 59, 999)
  const start30 = dateRange(30)
  const start60 = dateRange(60)

  const [currentKpi] = await Order.aggregate([
    { $match: { isPaid: true, paidAt: { $gte: start30, $lte: now } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
        items: { $sum: { $sum: '$items.quantity' } },
        aov: { $avg: '$totalPrice' },
      },
    },
  ])

  const [previousKpi] = await Order.aggregate([
    { $match: { isPaid: true, paidAt: { $gte: start60, $lt: start30 } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
        items: { $sum: { $sum: '$items.quantity' } },
        aov: { $avg: '$totalPrice' },
      },
    },
  ])

  const calcGrowth = (cur, prev) => {
    if (!prev || prev === 0) return 0
    return Number((((cur - prev) / prev) * 100).toFixed(1))
  }

  const kpi = {
    totalRevenue: currentKpi?.revenue ?? 0,
    totalOrders: currentKpi?.orders ?? 0,
    totalItemsSold: currentKpi?.items ?? 0,
    avgOrderValue: currentKpi?.aov ?? 0,
    revenueGrowth: calcGrowth(currentKpi?.revenue ?? 0, previousKpi?.revenue ?? 0),
    ordersGrowth: calcGrowth(currentKpi?.orders ?? 0, previousKpi?.orders ?? 0),
    itemsGrowth: calcGrowth(currentKpi?.items ?? 0, previousKpi?.items ?? 0),
    aovGrowth: calcGrowth(currentKpi?.aov ?? 0, previousKpi?.aov ?? 0),
  }

  const revenueTrend = await Order.aggregate([
    { $match: { isPaid: true, paidAt: { $gte: start30, $lte: now } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const categoryPerformance = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $toLower: { $ifNull: ['$productInfo.category', 'unknown'] } },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ])

  const topProducts = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ])

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(50)
    .lean()

  res.json({ kpi, revenueTrend, categoryPerformance, topProducts, recentOrders })
}
