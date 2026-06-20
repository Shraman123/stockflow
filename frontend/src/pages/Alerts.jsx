import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import api from '../lib/api'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); api.get('/api/alerts/low-stock').then(r => setAlerts(r.data)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Low Stock Alerts</h1>
        <button onClick={load} className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />Refresh
        </button>
      </div>
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">{alerts.length} item{alerts.length>1?'s':''} need restocking</p>
            <p className="text-sm text-red-600">Create stock movements or purchase orders to replenish.</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
            <th className="px-5 py-3 text-left">Product</th><th className="px-5 py-3 text-left">SKU</th><th className="px-5 py-3 text-left">Current Stock</th><th className="px-5 py-3 text-left">Threshold</th><th className="px-5 py-3 text-left">Deficit</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {alerts.map(a => (
              <tr key={a.id} className="hover:bg-red-50">
                <td className="px-5 py-3 font-medium">{a.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{a.sku}</td>
                <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{a.quantity_in_stock}</span></td>
                <td className="px-5 py-3 text-gray-500">{a.low_stock_threshold}</td>
                <td className="px-5 py-3 font-bold text-red-600">−{a.deficit}</td>
              </tr>
            ))}
            {!alerts.length && !loading && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                <AlertTriangle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                All products are well-stocked.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
