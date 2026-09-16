import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tag, Plus, Percent, Trash2, Check, X, Search, Calendar, Edit, SlidersHorizontal } from '../components/ui/Icons'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../services/api'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountAmount: '',
    minOrderValue: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  const fetchCoupons = () => {
    setLoading(true)
    api.get('/coupons')
      .then((res) => setCoupons(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load coupons'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCoupons() }, [])

  const flash = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const resetForm = () => {
    setForm({ code: '', discountType: 'percentage', discountAmount: '', minOrderValue: '', maxUses: '', expiresAt: '', isActive: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: String(coupon.discountAmount),
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
      isActive: coupon.isActive,
    })
    setEditingId(coupon.id || coupon._id)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountAmount: Number(form.discountAmount),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      }
      if (editingId) {
        await api.put(`/coupons/${editingId}`, payload)
        flash('Coupon updated')
      } else {
        await api.post('/coupons', payload)
        flash('Coupon created')
      }
      resetForm()
      fetchCoupons()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      await api.patch(`/coupons/${id}/toggle`)
      fetchCoupons()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle coupon')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      flash('Coupon deleted')
      fetchCoupons()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete coupon')
    }
  }

  const now = new Date()
  const filtered = coupons.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.code.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors active:scale-[0.97] shadow-sm"
          >
            Back to Products
          </Link>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors active:scale-[0.97] shadow-sm"
          >
            <Plus size={18} /> New Coupon
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <X size={16} className="shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2">
          <Check size={16} className="shrink-0" /> {success}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code..."
          className="w-full pl-9 pr-3 py-2 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-night-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="SAVE20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {form.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (Rs)'}
                  </label>
                  <input type="number" required min="0" step="0.01" value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Min Order Value</label>
                  <input type="number" min="0" value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Uses</label>
                  <input type="number" min="0" value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Unlimited" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Expires At</label>
                <input type="datetime-local" value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-300">Active</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-night-800'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button type="button" onClick={resetForm}
                  className="px-6 py-3 text-gray-500 font-medium rounded-xl hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading coupons...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Tag size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">{search ? 'No coupons match your search' : 'No coupons yet'}</p>
          {!search && (
            <button onClick={() => { resetForm(); setShowForm(true) }}
              className="mt-4 inline-flex items-center gap-2 text-primary-400 font-medium hover:text-primary-300">
              <Plus size={18} /> Create your first coupon
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((coupon) => {
            const cid = coupon.id || coupon._id
            const expired = coupon.expiresAt && new Date(coupon.expiresAt) < now
            const maxed = coupon.maxUses != null && coupon.usedCount >= coupon.maxUses
            const isDisabled = !coupon.isActive || expired || maxed
            return (
              <div
                key={cid}
                className={`bg-night-900 rounded-xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 ${
                  isDisabled ? 'border-night-700 opacity-60' : 'border-night-700'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl ${coupon.isActive && !expired && !maxed ? 'bg-green-50 text-green-700' : 'bg-night-800 text-gray-500'}`}>
                    <Tag size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg tracking-wide">{coupon.code}</span>
                      {!coupon.isActive && <span className="text-xs px-2 py-0.5 bg-night-800 text-gray-500 rounded-full">Disabled</span>}
                      {expired && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Expired</span>}
                      {maxed && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Used Up</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountAmount}% off`
                        : `${formatCurrency(coupon.discountAmount)} off`}
                      {coupon.minOrderValue > 0 && ` · Min: ${formatCurrency(coupon.minOrderValue)}`}
                      {coupon.maxUses != null && ` · ${coupon.usedCount}/${coupon.maxUses} used`}
                      {coupon.expiresAt && ` · Exp: ${new Date(coupon.expiresAt).toLocaleDateString('en-PK')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(cid)}
                    className={`p-2 rounded-lg transition-colors ${
                      coupon.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-white/10'
                    }`}
                    title={coupon.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <SlidersHorizontal size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cid)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}