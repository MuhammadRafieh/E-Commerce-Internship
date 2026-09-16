import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from '../components/ui/Icons'
import ProductCard from '../components/common/ProductCard'
import ProductWheel from '../components/common/ProductWheel'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'

const perks = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: Shield, title: 'Secure Checkout', desc: '256-bit SSL encrypted' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support team' },
]

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])

  useEffect(() => {
    categoryService.getAll().then((res) => setCategories(res.data)).catch(() => {})
    productService.getAll({ limit: 8, sort: '-createdAt' }).then((res) => {
      setFeaturedProducts(res.data.products)
    }).catch(() => {})
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage: `url(/hero-bg.png)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/50 z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24 flex flex-col items-center text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-300 bg-primary-500/15 border border-primary-500/20 px-4 py-1.5 rounded-full mb-5">
            New Season Arrivals
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl tracking-tight">
            Elevate Your
            <span className="text-primary-400"> Everyday </span>
            Style
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg">
            Discover curated collections of premium products designed to inspire.
            From cutting-edge electronics to timeless fashion.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-all duration-200 active:scale-[0.97] shadow-lg shadow-primary-600/30"
            >
              Shop Now
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/shop?category=deals"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-[0.97]"
            >
              View Deals
            </Link>
          </div>
        </div>
      </section>

      {/* Product Wheel */}
      <ProductWheel products={featuredProducts} />

      {/* Perks Bar */}
      <section className="bg-night-950 border-y border-night-700">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk) => (
              <div key={perk.title} className="flex items-center gap-4">
                <div className="w-11 h-11 bg-primary-500/15 border border-primary-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <perk.icon size={20} className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{perk.title}</p>
                  <p className="text-xs text-gray-500">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-400">
              Categories
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors group"
          >
            View All
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id || cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-night-800 border border-night-700"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm sm:text-base">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-night-900 border-y border-night-700 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-400">
                Featured
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                Featured Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors group"
            >
              View All
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              View All Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-night-950 border border-primary-800/30">
          <div className="absolute inset-0 opacity-[0.07]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop)`,
              }}
            />
          </div>
          <div className="relative z-10 px-8 py-14 sm:px-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Join Our Community
            </h2>
            <p className="text-primary-300 max-w-lg mx-auto mb-8">
              Sign up today and get 10% off your first order, plus early access to
              sales and new drops.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-shadow"
              />
              <button className="px-6 py-3 bg-white text-primary-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.97]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}