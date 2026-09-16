import { Router } from 'express'
import {
  getProducts,
  getProductById,
  getRecommendations,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { cacheProducts } from '../middleware/cacheMiddleware.js'

const router = Router()

router.get('/', cacheProducts(), getProducts)
router.get('/:id', getProductById)
router.get('/:id/recommendations', getRecommendations)
router.post('/', protect, adminOnly, createProduct)
router.put('/:id', protect, adminOnly, updateProduct)
router.delete('/:id', protect, adminOnly, deleteProduct)

export default router
