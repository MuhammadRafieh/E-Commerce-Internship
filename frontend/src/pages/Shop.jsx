import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Grid3X3, List, Search } from '../components/ui/Icons'
import ProductCard from '../components/common/ProductCard'
import ModalDrawer from '../components/ui/ModalDrawer'
import { productService } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'
import { categoryService } from '../services/categoryService'
import { useDebounce } from '../hooks/useDebounce'

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'rating', label: 'Highest Rated' },
]

const sortMap = {
  newest: '-createdAt',
  'price-asc': 'price',
  'price-desc': '-price',
  'name-asc': 'name',
  rating: '-rating',
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [allCategories, setAllCategories] = useState([])
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryService.getAll().then((res) => setAllCategories(res.data)).catch(() => {})
  }, [])

  const selectedCategory = searchParams.get('category') || ''
  const searchQuery = searchParams.get('search') || ''
  const sortBy = searchParams.get('sort') || 'newest'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const deals = searchParams.get('deals') === 'true' || selectedCategory === 'deals'

  const debouncedSearch = useDebounce(searchQuery, 400)

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const toggleCategory = (slug) => {
    if (selectedCategory === slug) {
      updateParam('category', '')
    } else {
      updateParam('category', slug)
    }
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || searchQuery || deals

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (debouncedSearch) params.search = debouncedSearch
      if (selectedCategory && selectedCategory !== 'deals') params.category = selectedCategory
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (sortBy && sortMap[sortBy]) params.sort = sortMap[sortBy]
      if (deals) params.deals = 'true'

      const res = await productService.getAll(params)
      setProducts(res.data.products)
      setTotal(res.data.total)
    } catch {
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, sortBy, deals])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const breadcrumbLabel = selectedCategory || searchQuery || minPrice || maxPrice
    ? `Search (${total})`
    : `All Products (${total})`

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Search</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 border border-night-700 bg-night-950 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          />
          {searchQuery && (
            <button onClick={() => updateParam('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Category</h3>
        <div className="space-y-2">
          {allCategories.map((cat) => {
            const isActive = selectedCategory === cat.slug
            return (
              <label
                key={cat._id || cat.slug}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive ? 'bg-primary-500/15 text-primary-300' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleCategory(cat.slug)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-night-600'
                  }`}
                >
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-3 py-2 border border-night-700 bg-night-950 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          />
          <span className="text-gray-500">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border border-night-700 bg-night-950 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-gray-200 transition-colors">Home</a>
        <span>/</span>
        <span className="text-white font-medium">Shop</span>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <h2 className="text-lg font-semibold text-white mb-6">Filters</h2>
            <FilterContent />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-night-700">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-night-800 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15"
              >
                <SlidersHorizontal size={16} />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary-600" />
                )}
              </button>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-white">{total}</span> products
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center border border-night-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-night-800 text-white' : 'text-gray-500 hover:text-gray-200'}`}
                  aria-label="Grid view"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-night-800 text-white' : 'text-gray-500 hover:text-gray-200'}`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm bg-night-800 border border-night-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-shadow"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/15 text-primary-300 text-xs font-medium rounded-full">
                  {selectedCategory}
                  <button onClick={() => updateParam('category', '')} className="hover:text-primary-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {minPrice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/15 text-primary-300 text-xs font-medium rounded-full">
                  Rs {minPrice}
                  <button onClick={() => updateParam('minPrice', '')} className="hover:text-primary-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/15 text-primary-300 text-xs font-medium rounded-full">
                  Rs {maxPrice}
                  <button onClick={() => updateParam('maxPrice', '')} className="hover:text-primary-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {deals && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                  Deals
                  <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('deals'); p.delete('category'); setSearchParams(p) }} className="hover:text-red-900">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-night-600 border-t-primary-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-4">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'
                  : 'space-y-4'
              }
            >
              {products.map((product) =>
                viewMode === 'list' ? (
                   <div key={product.id} className="flex gap-4 bg-night-900 rounded-xl border border-night-700 p-4 shadow-sm">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-lg overflow-hidden bg-night-800">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      {product.originalPrice && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</p>
                        <h3 className="font-semibold text-white mt-0.5">{product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-white">{formatCurrency(product.price)}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">{formatCurrency(product.originalPrice)}</span>
                          )}
                        </div>
                        <button className="text-sm font-medium text-primary-400 hover:text-primary-300">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ProductCard key={product.id} product={product} />
                ),
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found matching your filters.</p>
              <button onClick={clearFilters} className="mt-4 text-primary-400 font-medium hover:text-primary-300">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalDrawer open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" side="left">
        <FilterContent />
      </ModalDrawer>
    </div>
  )
}
