import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShoppingBag, Heart } from '../ui/Icons'
import StarRating from '../ui/StarRating'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { formatCurrency } from '../../utils/formatCurrency'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const outOfStock = (product.stock ?? product.countInStock) === 0
  const wished = isWishlisted(product.id || product._id)

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (outOfStock) return
    addToCart(product.id, 1, product.name, product.price, product.image)
    toast.success('Added to cart')
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    if (!wished) toast.success('Added to wishlist')
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-night-900 rounded-xl border border-night-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-night-800">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.originalPrice && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-950 text-gray-200 text-sm font-semibold px-4 py-1.5 rounded-full border border-night-700">
              Out of Stock
            </span>
          </div>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white/20 transition-all active:scale-90"
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} className={wished ? 'text-red-500' : 'text-gray-300'} />
        </button>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-sm rounded-full p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary-600 hover:text-white disabled:hidden active:scale-90"
          aria-label="Add to cart"
        >
          <ShoppingBag size={18} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category}</p>
        <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>
        <StarRating rating={product.rating} size={14} />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-white">{formatCurrency(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
