import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Heart,
  Share2,
  Check,
  Truck,
  Shield,
  RefreshCw,
  ShoppingBag,
} from '../components/ui/Icons'
import StarRating from '../components/ui/StarRating'
import QuantitySelector from '../components/ui/QuantitySelector'
import RecommendedProducts from '../components/common/RecommendedProducts'
import { useCart } from '../context/CartContext'
import { productService } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSelectedImage(0)
    setQuantity(1)
    setAddedToCart(false)

    productService.getById(id)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-night-600 border-t-primary-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 mt-4">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Product not found</h1>
        <Link to="/shop" className="mt-4 inline-flex text-primary-400 font-medium hover:text-primary-300">
          Back to Shop
        </Link>
      </div>
    )
  }

  const images = product.images?.length ? product.images : [product.image]
  const outOfStock = (product.stock ?? product.countInStock) === 0

  const handleAddToCart = () => {
    addToCart(product.id, quantity, product.name, product.price, product.image)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-200 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-gray-200 transition-colors">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category.toLowerCase()}`} className="hover:text-gray-200 transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-white font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-night-800 mb-4 group">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <button className="absolute top-4 right-4 p-2.5 bg-night-900 rounded-full shadow-md hover:bg-night-800 transition-colors active:scale-90" aria-label="Add to wishlist">
              <Heart size={18} className="text-gray-400" />
            </button>
            <button className="absolute top-4 right-16 p-2.5 bg-night-900 rounded-full shadow-md hover:bg-night-800 transition-colors active:scale-90" aria-label="Share">
              <Share2 size={18} className="text-gray-400" />
            </button>
            {product.originalPrice && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}% Off
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === idx
                    ? 'border-primary-500 ring-1 ring-primary-500'
                    : 'border-night-700 hover:border-night-600'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-400 mb-1">
            {product.category}
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mt-3">
            <StarRating rating={product.rating} size={18} />
            <span className="text-sm text-gray-500">({product.numReviews} reviews)</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg text-gray-500 line-through">{formatCurrency(product.originalPrice)}</span>
            )}
          </div>

          <p className="mt-6 text-gray-400 leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-center gap-2 text-sm">
            {outOfStock ? (
              <span className="text-red-600 font-medium">Out of Stock</span>
            ) : (
              <>
                <Check size={16} className="text-green-600" />
                <span className="text-green-700 font-medium">In Stock</span>
                <span className="text-gray-500 ml-1">({product.stock ?? product.countInStock} available)</span>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={product.stock ?? (product.countInStock || 1)} />
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] ${
                addedToCart
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {addedToCart ? (
                <>
                  <Check size={18} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart — {formatCurrency(product.price * quantity)}
                </>
              )}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-night-900 rounded-xl">
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-gray-500" />
              <div>
                <p className="text-xs font-semibold text-white">Free Shipping</p>
                <p className="text-xs text-gray-500">On orders over Rs 50</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-gray-500" />
              <div>
                <p className="text-xs font-semibold text-white">Easy Returns</p>
                <p className="text-xs text-gray-500">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-gray-500" />
              <div>
                <p className="text-xs font-semibold text-white">Secure Checkout</p>
                <p className="text-xs text-gray-500">SSL encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecommendedProducts productId={id} />
    </div>
  )
}
