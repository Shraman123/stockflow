import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Package, AlertTriangle, Truck, Tag, ShoppingCart, DollarSign, Users, TrendingUp } from 'lucide-react'
import api from '../lib/api'

const COLORS = ['#6366f1','#06b6d4','#f59e0b','#10b981','#ef4444']

function Card({ icon: Icon, label, value, bg }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {}) }, [])
  if (!stats) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your inventory and orders</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Package} label="Products" value={stats.total_products} bg="bg-indigo-500" />
        <Card icon={Users} label="Customers" value={stats.total_customers} bg="bg-cyan-500" />
        <Card icon={ShoppingCart} label="Pending Orders" value={stats.pending_orders} bg="bg-violet-500" />
        <Card icon={AlertTriangle} label="Low Stock" value={stats.low_stock_count} bg="bg-red-500" />
        <Card icon={Truck} label="Suppliers" value={stats.total_suppliers} bg="bg-amber-500" />
        <Card icon={Tag} label="Categories" value={stats.total_categories} bg="bg-pink-500" />
        <Card icon={DollarSign} label="Stock Value" value={`₹${stats.total_stock_value.toLocaleString()}`} bg="bg-emerald-500" />
        <Card icon={TrendingUp} label="Revenue" value={`₹${stats.total_revenue.toLocaleString()}`} bg="bg-green-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.stock_by_category?.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Stock by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.stock_by_category}>
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stock" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {stats.orders_by_status?.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.orders_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {stats.orders_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend /><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {stats.recent_movements?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b"><h2 className="font-semibold">Recent Stock Movements</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr><th className="px-5 py-3 text-left">Product ID</th><th className="px-5 py-3 text-left">Type</th><th className="px-5 py-3 text-left">Qty</th><th className="px-5 py-3 text-left">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recent_movements.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">#{m.product_id}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.movement_type === 'sale' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{m.movement_type}</span></td>
                  <td className="px-5 py-3 font-mono">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
