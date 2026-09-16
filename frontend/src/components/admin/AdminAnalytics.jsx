import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { productService } from '../../services/productService'
import { formatCurrency } from '../../utils/formatCurrency'

const weeklySales = [
  { day: 'Mon', revenue: 4200 },
  { day: 'Tue', revenue: 5800 },
  { day: 'Wed', revenue: 4900 },
  { day: 'Thu', revenue: 7200 },
  { day: 'Fri', revenue: 6100 },
  { day: 'Sat', revenue: 8900 },
  { day: 'Sun', revenue: 9500 },
]

export default function AdminAnalytics() {
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    productService.getAll({ limit: 100 }).then((res) => {
      const products = res.data.products || []
      const low = products.filter((p) => (p.stock ?? p.countInStock ?? 0) <= 10)
        .map((p) => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name, stock: p.stock ?? p.countInStock ?? 0 }))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)
      setLowStock(low)
    }).catch(() => {})
  }, [])

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
      {/* Weekly Sales */}
      <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Weekly Sales Revenue</h3>
        <p className="text-xs text-gray-500 mb-6">Current week overview</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklySales} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21301f" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #21301f', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                formatter={(v) => [formatCurrency(v), 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Low Stock Alerts</h3>
        <p className="text-xs text-gray-500 mb-4">Products with 10 or fewer units remaining</p>
        {lowStock.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-500">
            <p>No low-stock products</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lowStock} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21301f" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #21301f', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                  formatter={(v) => [v, 'In Stock']}
                />
                <Bar dataKey="stock" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
