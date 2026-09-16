import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '../../services/productService'
import { formatCurrency } from '../../utils/formatCurrency'
import { Star, ChevronLeft, ChevronRight } from '../ui/Icons'

export default function RecommendedProducts({ productId }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [scrollIdx, setScrollIdx] = useState(0)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    productService
      .getRecommendations(productId)
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading || products.length === 0) return null

  const visible = 4
  const maxIdx = Math.max(0, products.length - visible)

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">You Might Also Like</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setScrollIdx((i) => Math.max(0, i - 1))}
            disabled={scrollIdx === 0}
            className="p-2 rounded-xl border border-night-700 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setScrollIdx((i) => Math.min(maxIdx, i + 1))}
            disabled={scrollIdx >= maxIdx}
            className="p-2 rounded-xl border border-night-700 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${scrollIdx * (100 / visible)}%)` }}
        >
          {products.map((p) => (
            <Link
              key={p.id || p._id}
              to={`/product/${p.id || p._id}`}
              className="group min-w-[calc(25%-12px)] bg-night-900 rounded-xl border border-night-700 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="aspect-square bg-night-800 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-primary-400 font-medium uppercase tracking-wider mb-1">{p.category}</p>
                <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{p.name}</h3>
                <div className="flex items-center gap-1.5 mb-2">
                  <Star size={14} className="text-amber-400 fill-current" />
                  <span className="text-xs text-gray-500">{p.rating || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{formatCurrency(p.price)}</span>
                  {p.originalPrice && (
                    <span className="text-xs text-gray-400 line-through">{formatCurrency(p.originalPrice)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
