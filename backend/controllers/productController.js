import Product from '../models/Product.js'
import { invalidateProductCache } from '../middleware/cacheMiddleware.js'

/* ─── GET /api/products (with $text search + Redis caching via middleware) ─── */
export const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, sort, deals, page = 1, limit = 12 } = req.query

  const filter = {}

  if (deals === 'true') {
    filter.originalPrice = { $exists: true, $gt: 0 }
  }

  if (search) {
    filter.$text = { $search: search }
  }

  if (category) {
    filter.category = category.toLowerCase()
  }

  if (minPrice || maxPrice) {
    filter.price = {}
    if (minPrice) filter.price.$gte = Number(minPrice)
    if (maxPrice) filter.price.$lte = Number(maxPrice)
  }

  let sortOption = { createdAt: -1 }
  if (search) {
    sortOption = { score: { $meta: 'textScore' }, ...sortOption }
  }
  if (sort) {
    const sortMap = {
      price: { price: 1 },
      '-price': { price: -1 },
      name: { name: 1 },
      '-name': { name: -1 },
      createdAt: { createdAt: 1 },
      '-createdAt': { createdAt: -1 },
      rating: { rating: -1 },
      '-rating': { rating: 1 },
    }
    if (search) {
      sortOption = { score: { $meta: 'textScore' }, ...(sortMap[sort] || {}) }
    } else {
      sortOption = sortMap[sort] || sortOption
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12))
  const skip = (pageNum - 1) * limitNum

  const projection = search ? { score: { $meta: 'textScore' } } : undefined

  const [products, total] = await Promise.all([
    Product.find(filter, projection).sort(sortOption).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ])

  res.json({
    products,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  })
}

/* ─── GET /api/products/:id ─── */
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  res.json(product)
}

/* ─── GET /api/products/:id/recommendations ─── */
export const getRecommendations = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const recommendations = await Product.aggregate([
    {
      $match: {
        _id: { $ne: product._id },
        $or: [
          { category: product.category },
          { tags: { $in: product.tags || [] } },
          {
            price: {
              $gte: Math.max(0, product.price - product.price * 0.5),
              $lte: product.price + product.price * 0.5,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        relevance: {
          $add: [
            { $cond: [{ $eq: ['$category', product.category] }, 3, 0] },
            {
              $cond: [
                { $gt: [{ $size: { $setIntersection: ['$tags', product.tags || []] } }, 0] },
                2,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ['$price', Math.max(0, product.price - product.price * 0.5)] },
                    { $lte: ['$price', product.price + product.price * 0.5] },
                  ],
                },
                1,
                0,
              ],
            },
          ],
        },
      },
    },
    { $sort: { relevance: -1, rating: -1 } },
    { $limit: 4 },
  ])

  res.json(recommendations)
}

/* ─── POST /api/products (admin only) ─── */
export const createProduct = async (req, res) => {
  const { name, price, originalPrice, description, category, stock, image, images, rating, numReviews, tags } = req.body

  const product = await Product.create({
    name,
    price,
    originalPrice,
    description,
    category,
    stock,
    image,
    images: images?.length ? images : [image],
    rating,
    numReviews,
    tags,
  })

  await invalidateProductCache()

  res.status(201).json(product)
}

/* ─── PUT /api/products/:id (admin only) ─── */
export const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  await invalidateProductCache()

  res.json(product)
}

/* ─── DELETE /api/products/:id (admin only) ─── */
export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  await invalidateProductCache()

  res.json({ message: 'Product removed' })
}
