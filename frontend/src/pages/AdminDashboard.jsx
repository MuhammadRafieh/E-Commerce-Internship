import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus, X, Search, Package, Upload, ChevronDown, Check, Percent } from '../components/ui/Icons'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import api from '../services/api'
import { formatCurrency } from '../utils/formatCurrency'
import AdminAnalytics from '../components/admin/AdminAnalytics'

const ITEMS_PER_PAGE = 10

const emptyProduct = {
  name: '',
  price: '',
  originalPrice: '',
  description: '',
  category: '',
  customCategory: '',
  stock: '',
  image: '',
  images: [],
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileRef = useRef(null)
  const [catName, setCatName] = useState('')
  const [catImage, setCatImage] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catUploading, setCatUploading] = useState(false)
  const catFileRef = useRef(null)
  const [editingCat, setEditingCat] = useState(null)
  const [editingStock, setEditingStock] = useState(null)
  const [editStockValue, setEditStockValue] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productService.getAll({ limit: 100 })
      setProducts(res.data.products)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll()
      setCategories(res.data)
    } catch {
      /* fallback — keep current */
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!catName.trim() || !catImage.trim()) return
    setCatSaving(true)
    setError(null)
    try {
      const res = await categoryService.create({ name: catName.trim(), image: catImage.trim() })
      setCategories((prev) => [...prev, res.data])
      setCatName('')
      setCatImage('')
      flash('Category added')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category')
    } finally {
      setCatSaving(false)
    }
  }

  const handleEditCategory = (cat) => {
    setCatName(cat.name)
    setCatImage(cat.image)
    setEditingCat(cat._id || cat.id)
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    if (!catName.trim() || !catImage.trim()) return
    setCatSaving(true)
    setError(null)
    try {
      const res = await categoryService.update(editingCat, { name: catName.trim(), image: catImage.trim() })
      setCategories((prev) => prev.map((c) => ((c._id || c.id) === editingCat ? res.data : c)))
      setCatName('')
      setCatImage('')
      setEditingCat(null)
      flash('Category updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category')
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await categoryService.delete(catId)
      setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId))
      flash('Category deleted')
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.url
      setForm((prev) => ({
        ...prev,
        image: prev.image || url,
        images: [...prev.images, url],
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const addImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (!url || !url.trim()) return
    setForm((prev) => ({
      ...prev,
      image: prev.image || url.trim(),
      images: [...prev.images, url.trim()],
    }))
  }

  const removeImage = (idx) => {
    setForm((prev) => {
      const next = prev.images.filter((_, i) => i !== idx)
      return {
        ...prev,
        images: next,
        image: next.length > 0 ? next[0] : '',
      }
    })
  }

  const handleCatFileUpload = async (file) => {
    if (!file) return
    setCatUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setCatImage(res.data.url)
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setCatUploading(false)
    }
  }

  const handleStockSave = async (productId) => {
    const val = parseInt(editStockValue, 10)
    if (isNaN(val) || val < 0) {
      toast.error('Stock must be a valid number')
      return
    }
    try {
      const res = await api.put(`/products/${productId}`, { stock: val })
      setProducts((prev) => prev.map((p) => (p.id || p._id) === productId ? { ...p, stock: val } : p))
      toast.success('Stock updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock')
    }
    setEditingStock(null)
  }

  const flash = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleEdit = (product) => {
    const cat = product.category.toLowerCase()
    const isCustom = cat.startsWith('custom_')
    setForm({
      name: product.name,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      description: product.description,
      category: isCustom ? '__other__' : cat,
      customCategory: isCustom ? cat.replace('custom_', '') : '',
      stock: String(product.stock),
      image: product.image,
      images: product.images?.length ? [...product.images] : [product.image],
    })
    setEditingId(product.id || product._id)
    setFormOpen(true)
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return
    try {
      await api.delete(`/products/${productId}`)
      setProducts((prev) => prev.filter((p) => (p.id || p._id) !== productId))
      flash('Product deleted')
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const category = form.category === '__other__' && form.customCategory
      ? `custom_${form.customCategory}`
      : form.category

    const payload = {
      name: form.name,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      description: form.description,
      category,
      stock: Number(form.stock),
      image: form.images[0] || form.image,
      images: form.images,
    }

    try {
      if (editingId) {
        const res = await api.put(`/products/${editingId}`, payload)
        setProducts((prev) =>
          prev.map((p) =>
            ((p.id || p._id) === editingId ? res.data : p),
          ),
        )
        flash('Product updated')
      } else {
        const res = await api.post('/products', payload)
        setProducts((prev) => [res.data, ...prev])
        flash('Product created')
      }
      setFormOpen(false)
      resetForm()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm(emptyProduct)
    setEditingId(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    resetForm()
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const safePage = Math.max(1, Math.min(page, totalPages || 1))
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  useEffect(() => { setPage(1) }, [search])

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-center gap-2 py-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
          className="px-3 py-1.5 text-sm font-medium text-gray-400 border border-night-700 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
              n === safePage
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
          className="px-3 py-1.5 text-sm font-medium text-gray-400 border border-night-700 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    ) : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/sales"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-night-700 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]"
          >
            <Package size={18} />
            Sales
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-night-700 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]"
          >
            <Package size={18} />
            Orders
          </Link>
          <Link
            to="/admin/coupons"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-night-700 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]"
          >
            <Percent size={18} />
            Coupons
          </Link>
          <button
            onClick={() => { resetForm(); setFormOpen(true) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] shadow-sm"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Flash messages */}
      {success && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-600 rounded-full shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or category..."
          className="w-full pl-10 pr-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
        />
      </div>

      {/* Table */}
      <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-2 bg-night-800 text-xs text-gray-500 border-b border-night-700 flex items-center justify-between">
          <span>{filtered.length} of {products.length} products</span>
          {totalPages > 1 && <span>Page {safePage} of {totalPages}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-night-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 sm:px-6">Product</th>
                <th className="px-4 py-3 sm:px-6">Category</th>
                <th className="px-4 py-3 sm:px-6 text-right">Price</th>
                <th className="px-4 py-3 sm:px-6 text-right">Stock</th>
                <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    {search ? 'No products match your search.' : 'No products yet.'}
                  </td>
                </tr>
              ) : (
                paginated.map((product) => (
                  <tr key={product.id || product._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-night-800 overflow-hidden shrink-0">
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-[200px] sm:max-w-[280px]">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className="inline-block px-2.5 py-0.5 bg-night-800 text-gray-400 text-xs font-medium rounded-full capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right font-medium text-white">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right">
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-green-700'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id || product._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={closeForm} />
          <div className="relative bg-night-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-night-700 sticky top-0 bg-night-900 z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="Wireless Headphones"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price (Rs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Original Price (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    placeholder="39.99"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                {form.category === '__other__' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.customCategory || ''}
                      onChange={(e) => setForm({ ...form, customCategory: e.target.value, category: e.target.value ? `custom_${e.target.value}` : '__other__' })}
                      className="flex-1 px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="Enter new category name"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, category: '', customCategory: '' })}
                      className="px-3 py-2.5 text-sm text-gray-500 hover:text-white"
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value, customCategory: '' })}
                    className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__other__">Other (add new)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Images</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-night-800 border border-night-700 group">
                      <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} className="text-white" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-[10px] font-semibold text-white bg-primary-600 text-center leading-4">Primary</span>
                      )}
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-night-700 flex items-center justify-center text-gray-300">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2.5 border border-night-700 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors disabled:opacity-50 shrink-0 active:scale-[0.97]"
                  >
                    {uploading ? (
                      <span className="w-4 h-4 border-2 border-night-600 border-t-gray-400 rounded-full animate-spin block" />
                    ) : (
                      <Upload size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-4 py-2.5 border border-night-700 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors active:scale-[0.97]"
                  >
                    + URL
                  </button>
                  {form.images.length === 0 && (
                    <span className="text-xs text-gray-500 self-center">Upload or add a URL</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                  placeholder="Product description..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-5 py-2.5 border border-night-600 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories */}
      <div className="mt-10 bg-night-900 rounded-2xl border border-night-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-night-700">
          <h2 className="text-lg font-semibold text-white">Manage Categories</h2>
        </div>
        <div className="p-6">
          <form onSubmit={editingCat ? handleUpdateCategory : handleAddCategory} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Category name"
              required
              className="flex-1 px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex-[2] flex gap-2">
              <input
                type="url"
                value={catImage}
                onChange={(e) => setCatImage(e.target.value)}
                placeholder="Image URL"
                required
                className="flex-1 px-3.5 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                ref={catFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCatFileUpload(e.target.files[0])}
              />
              <button
                type="button"
                onClick={() => catFileRef.current?.click()}
                disabled={catUploading}
                className="px-4 py-2.5 border border-night-700 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors disabled:opacity-50 shrink-0 active:scale-[0.97]"
              >
                {catUploading ? (
                  <span className="w-4 h-4 border-2 border-night-600 border-t-gray-400 rounded-full animate-spin block" />
                ) : (
                  <Upload size={18} />
                )}
              </button>
            </div>
            <div className="flex gap-2 shrink-0">
              {editingCat && (
                <button
                  type="button"
                  onClick={() => { setCatName(''); setCatImage(''); setEditingCat(null) }}
                  className="px-4 py-2.5 border border-night-600 text-gray-400 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={catSaving || !catImage}
                className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] disabled:opacity-50"
              >
                {catSaving ? 'Saving...' : editingCat ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
          {catImage && (
            <div className="mb-4 w-14 h-14 rounded-lg overflow-hidden bg-night-800 border border-night-700">
              <img
                src={catImage}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <div key={cat._id || cat.id} className="relative group rounded-xl overflow-hidden bg-night-800 border border-night-700">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                </div>
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-gray-300 truncate">{cat.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCategory(cat)}
                      className="p-1 text-gray-400 hover:text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                      aria-label="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat._id || cat.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
