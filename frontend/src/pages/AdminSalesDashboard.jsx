import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts'
import {
  DollarSign, ShoppingBag, TrendingUp, Package, BarChart3,
  PieChart as PieChartIcon,
  Search, X, ChevronDown, ArrowUp, ArrowDown,
} from '../components/ui/Icons'
import { adminService } from '../services/adminService'
import { formatCurrency } from '../utils/formatCurrency'

const STATUSES = ['', 'ordered', 'confirmed', 'dispatched', 'arrived_at_city', 'assigned_to_rider', 'delivered']

const CHART_COLORS = ['#10b981', '#16a34a', '#65a30d', '#f59e0b', '#ef4444', '#14b8a6', '#22c55e', '#4d7c0f']

const statusStyles = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  unpaid: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  ordered: 'bg-lime-50 text-lime-700 ring-lime-600/20',
  confirmed: 'bg-green-50 text-green-700 ring-green-600/20',
  dispatched: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  arrived_at_city: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  assigned_to_rider: 'bg-green-100 text-green-800 ring-green-700/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-night-900 rounded-2xl border border-night-700 p-5 shadow-sm animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-night-800" />
            <div className="w-16 h-5 rounded-full bg-night-800" />
          </div>
          <div className="h-8 w-28 bg-night-800 rounded mb-2" />
          <div className="h-4 w-20 bg-night-800 rounded" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="grid lg:grid-cols-5 gap-6 mb-8">
      <div className="lg:col-span-3 bg-night-900 rounded-2xl border border-night-700 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 bg-night-800 rounded mb-6" />
        <div className="h-64 bg-night-800 rounded-xl" />
      </div>
      <div className="lg:col-span-2 bg-night-900 rounded-2xl border border-night-700 p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 bg-night-800 rounded mb-6" />
        <div className="h-64 bg-night-800 rounded-xl" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-night-700">
        <div className="h-5 w-36 bg-night-800 rounded" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-20 bg-night-800 rounded" />
            <div className="h-4 w-32 bg-night-800 rounded" />
            <div className="h-4 w-40 bg-night-800 rounded" />
            <div className="h-4 w-12 bg-night-800 rounded" />
            <div className="h-4 w-16 bg-night-800 rounded" />
            <div className="h-6 w-16 bg-night-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomAreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-night-900 border border-night-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-white ml-1">
            {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-night-900 border border-night-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-white capitalize mb-1">{d.name}</p>
      <p className="text-gray-400">{formatCurrency(d.revenue)}</p>
      <p className="text-gray-500 text-xs">{d.quantity} units sold</p>
    </div>
  )
}

export default function AdminSalesDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getSalesAnalytics()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredOrders = useMemo(() => {
    if (!data?.recentOrders) return []
    return data.recentOrders.filter((o) => {
      const email = o.user?.email || o.guestEmail || ''
      const id = (o._id || o.id || '').toString().toLowerCase()
      const term = searchTerm.toLowerCase()
      const matchesSearch = !term || id.includes(term) || email.toLowerCase().includes(term)
      const matchesStatus = !statusFilter || o.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data, searchTerm, statusFilter])

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase()
    const cls = statusStyles[s] || 'bg-night-800 text-gray-300 ring-night-600/20'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset capitalize ${cls}`}>
        {s.replace(/_/g, ' ') || 'unknown'}
      </span>
    )
  }

  const paidBadge = (isPaid) => {
    return isPaid
      ? <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20">Paid</span>
      : <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20">Pending</span>
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-56 bg-night-800 rounded animate-pulse mb-1" />
        <div className="h-4 w-40 bg-night-800 rounded animate-pulse mb-8" />
        <KpiSkeleton />
        <ChartSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X size={24} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Failed to load analytics</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={fetchData} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  const { kpi, revenueTrend, categoryPerformance, topProducts } = data || {}
  const isEmpty = !kpi || kpi.totalOrders === 0

  if (isEmpty) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Sales Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Your store performance at a glance</p>
        </div>
        <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No sales data yet</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Analytics will populate automatically once you receive your first paid order.
          </p>
        </div>
      </div>
    )
  }

  const GrowthBadge = ({ value }) => {
    if (value === 0) return null
    const isPositive = value > 0
    const Icon = isPositive ? ArrowUp : ArrowDown
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
      }`}>
        <Icon size={12} />
        {Math.abs(value)}%
      </span>
    )
  }

  const totalRevenue = kpi?.totalRevenue ?? 0
  const totalOrders = kpi?.totalOrders ?? 0
  const avgOrderValue = kpi?.avgOrderValue ?? 0
  const totalItemsSold = kpi?.totalItemsSold ?? 0

  const pieData = (categoryPerformance || []).map((c) => ({
    name: c._id,
    revenue: c.revenue,
    quantity: c.quantity,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Sales Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Your store performance at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="px-4 py-2 border border-night-700 text-gray-400 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
          >
            Products
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 border border-night-700 text-gray-400 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
          >
            Orders
          </Link>
          <Link
            to="/admin/coupons"
            className="px-4 py-2 border border-night-700 text-gray-400 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
          >
            Coupons
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="group bg-night-900 rounded-2xl border border-night-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={20} />
            </div>
            <GrowthBadge value={kpi?.revenueGrowth} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>

        <div className="group bg-night-900 rounded-2xl border border-night-700 p-5 shadow-sm hover:shadow-md hover:border-lime-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-lime-50 text-lime-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={20} />
            </div>
            <GrowthBadge value={kpi?.ordersGrowth} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{totalOrders.toLocaleString('en-PK')}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>

        <div className="group bg-night-900 rounded-2xl border border-night-700 p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <GrowthBadge value={kpi?.aovGrowth} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{formatCurrency(avgOrderValue)}</p>
          <p className="text-sm text-gray-500">Avg. Order Value</p>
        </div>

        <div className="group bg-night-900 rounded-2xl border border-night-700 p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
            <GrowthBadge value={kpi?.itemsGrowth} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{totalItemsSold.toLocaleString('en-PK')}</p>
          <p className="text-sm text-gray-500">Items Sold</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-3 bg-night-900 rounded-2xl border border-night-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Revenue Trend</h2>
            <span className="text-xs text-gray-500">Last 30 days</span>
          </div>
          {revenueTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21301f" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#21301f' }}
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#ordersGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
              No revenue data for the last 30 days
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="lg:col-span-2 bg-night-900 rounded-2xl border border-night-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Category Distribution</h2>
            <PieChartIcon size={18} className="text-gray-400" />
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="revenue"
                  nameKey="name"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs capitalize text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
              No category data yet
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Table Row */}
      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-night-900 rounded-2xl border border-night-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Top Products</h2>
            <BarChart3 size={18} className="text-gray-400" />
          </div>
          {topProducts?.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, i) => {
                const pct = topProducts[0]?.revenue > 0
                  ? ((product.revenue / topProducts[0].revenue) * 100)
                  : 0
                return (
                  <div key={product._id || i} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-night-800 text-gray-400' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-night-800 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-night-800 overflow-hidden shrink-0">
                        {product.image && (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{product.name || 'Unknown Product'}</p>
                        <p className="text-xs text-gray-500">{product.quantity} sold</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatCurrency(product.revenue)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-night-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              No product data yet
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-3 bg-night-900 rounded-2xl border border-night-700 shadow-sm">
          <div className="px-6 py-4 border-b border-night-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search ID or email..."
                    className="w-40 sm:w-48 pl-8 pr-3 py-1.5 text-xs border border-night-700 rounded-lg bg-night-950 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-night-700 rounded-lg bg-night-950 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">All Status</option>
                    {STATUSES.filter(Boolean).map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-night-800 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 sm:px-6">Order ID</th>
                    <th className="px-4 py-3 sm:px-6">Date</th>
                    <th className="px-4 py-3 sm:px-6 hidden sm:table-cell">Customer</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Items</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Total</th>
                    <th className="px-4 py-3 sm:px-6">Payment</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-700">
                  {filteredOrders.map((order) => {
                    const oid = order._id || order.id || ''
                    const customerEmail = order.user?.email || order.guestEmail || '—'
                    return (
                      <tr key={oid} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 sm:px-6 font-mono text-xs text-gray-500">
                          #{oid.toString().slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(order.createdAt || order.paidAt)}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-xs text-gray-400 truncate max-w-[140px] hidden sm:table-cell">
                          {customerEmail}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-right text-white font-medium text-xs">
                          {order.items?.reduce((s, i) => s + i.quantity, 0) || 0}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-right text-white font-semibold text-xs">
                          {formatCurrency(order.totalPrice || 0)}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          {paidBadge(order.isPaid)}
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          {statusBadge(order.status)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 text-sm">
              {searchTerm || statusFilter ? 'No orders match your filters.' : 'No recent orders.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
