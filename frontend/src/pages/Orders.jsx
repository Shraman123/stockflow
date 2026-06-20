import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'

const SC = { pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700', shipped:'bg-purple-100 text-purple-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' }
const NEXT = { pending:['confirmed','cancelled'], confirmed:['shipped','cancelled'], shipped:['delivered'] }

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ customer_id:'', notes:'', items:[{ product_id:'', quantity:1 }] })
  const [loading, setLoading] = useState(false)

  const load = () => api.get('/api/orders').then(r => setOrders(r.data))
  useEffect(() => {
    load()
    api.get('/api/customers').then(r => setCustomers(r.data))
    api.get('/api/products').then(r => setProducts(r.data))
  }, [])

  const addItem = () => setForm(f => ({ ...f, items:[...f.items,{product_id:'',quantity:1}] }))
  const removeItem = i => setForm(f => ({ ...f, items:f.items.filter((_,idx)=>idx!==i) }))
  const updateItem = (i,k,v) => setForm(f => ({ ...f, items:f.items.map((it,idx)=>idx===i?{...it,[k]:v}:it) }))

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/api/orders', {
        customer_id: parseInt(form.customer_id), notes: form.notes,
        items: form.items.map(it => ({ product_id:parseInt(it.product_id), quantity:parseInt(it.quantity) }))
      })
      toast.success('Order placed — stock updated automatically')
      setModal(false); setForm({ customer_id:'', notes:'', items:[{product_id:'',quantity:1}] }); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const updateStatus = async (id, status) => {
    try { await api.put(`/api/orders/${id}`, { status }); toast.success(`→ ${status}`); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const getProduct = id => products.find(p => p.id === id)
  const getCustomer = id => customers.find(c => c.id === id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-xs text-gray-400 mt-1">Stock is automatically reduced when an order is placed</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="w-4 h-4" />New Order</button>
      </div>

      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(expanded===o.id?null:o.id)}>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-mono text-sm font-bold text-indigo-600">{o.order_number}</span>
                <span className="text-sm text-gray-600">{getCustomer(o.customer_id)?.name || `#${o.customer_id}`}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SC[o.status]}`}>{o.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">₹{o.total_amount.toLocaleString()}</span>
                {expanded===o.id ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
              </div>
            </div>
            {expanded===o.id && (
              <div className="border-t px-5 py-4 space-y-4">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 text-xs uppercase"><tr><th className="text-left pb-2">Product</th><th className="text-left pb-2">Qty</th><th className="text-left pb-2">Price</th><th className="text-left pb-2">Total</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {o.items.map(item => (
                      <tr key={item.id}><td className="py-1.5">{getProduct(item.product_id)?.name||`#${item.product_id}`}</td><td>{item.quantity}</td><td>₹{item.unit_price}</td><td className="font-medium">₹{item.total_price}</td></tr>
                    ))}
                  </tbody>
                </table>
                {o.notes && <p className="text-sm text-gray-500">Notes: {o.notes}</p>}
                <div className="flex gap-2 flex-wrap">
                  {(NEXT[o.status]||[]).map(s => (
                    <button key={s} onClick={() => updateStatus(o.id, s)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium ${s==='cancelled'?'bg-red-100 text-red-700 hover:bg-red-200':'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {!orders.length && <div className="text-center py-12 text-gray-400">No orders yet.</div>}
      </div>

      {modal && (
        <Modal title="New Customer Order" onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
              <select required value={form.customer_id} onChange={e => setForm(f=>({...f,customer_id:e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">Items</label>
                <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:underline">+ Add item</button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => {
                  const p = products.find(p => p.id === parseInt(item.product_id))
                  return (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={item.product_id} onChange={e => updateItem(i,'product_id',e.target.value)} required
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Product…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity_in_stock})</option>)}
                      </select>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} required
                        className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      {p && <span className="text-xs text-gray-400 whitespace-nowrap">₹{(p.unit_price*item.quantity).toFixed(0)}</span>}
                      <button type="button" onClick={() => removeItem(i)} disabled={form.items.length===1} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none">×</button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">{loading?'Placing…':'Place Order'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
