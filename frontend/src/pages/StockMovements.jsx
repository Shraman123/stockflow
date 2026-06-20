import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'

const TYPES = ['purchase','sale','adjustment','return_in','return_out']
const TC = { purchase:'bg-green-100 text-green-700', return_in:'bg-green-100 text-green-700', sale:'bg-red-100 text-red-700', return_out:'bg-red-100 text-red-700', adjustment:'bg-yellow-100 text-yellow-700' }

export default function StockMovements() {
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ product_id:'', movement_type:'purchase', quantity:1, reference:'', notes:'' })
  const [loading, setLoading] = useState(false)

  const load = () => api.get('/api/stock').then(r => setItems(r.data))
  useEffect(() => { load(); api.get('/api/products').then(r => setProducts(r.data)) }, [])

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/api/stock', { ...form, product_id:parseInt(form.product_id), quantity:parseInt(form.quantity) })
      toast.success('Movement recorded'); setModal(false)
      setForm({ product_id:'', movement_type:'purchase', quantity:1, reference:'', notes:'' }); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="w-4 h-4" />Record Movement</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
            <th className="px-5 py-3 text-left">Product</th><th className="px-5 py-3 text-left">Type</th><th className="px-5 py-3 text-left">Qty</th><th className="px-5 py-3 text-left">Before→After</th><th className="px-5 py-3 text-left">Reference</th><th className="px-5 py-3 text-left">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(m => {
              const p = products.find(p => p.id === m.product_id)
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{p?.name||`#${m.product_id}`}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TC[m.movement_type]}`}>{m.movement_type}</span></td>
                  <td className="px-5 py-3 font-mono font-medium">{m.quantity>0?`+${m.quantity}`:m.quantity}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{m.quantity_before}→{m.quantity_after}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{m.reference||'—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              )
            })}
            {!items.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No movements yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Record Stock Movement" onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
              <select required value={form.product_id} onChange={e => f('product_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity_in_stock})</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={form.movement_type} onChange={e => f('movement_type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Quantity (negative = outgoing)</label>
              <input type="number" required value={form.quantity} onChange={e => f('quantity', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
              <input value={form.reference} onChange={e => f('reference', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">{loading?'Saving…':'Record'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
