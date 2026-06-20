import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'

const E = { name:'',sku:'',description:'',category_id:'',supplier_id:'',unit_price:0,cost_price:0,quantity_in_stock:0,low_stock_threshold:10,unit:'pcs' }

export default function Products() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [sups, setSups] = useState([])
  const [search, setSearch] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(E)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => { const p = {}; if (search) p.search = search; if (lowStock) p.low_stock = true; api.get('/api/products', { params: p }).then(r => setItems(r.data)) }
  useEffect(() => { api.get('/api/categories').then(r => setCats(r.data)); api.get('/api/suppliers').then(r => setSups(r.data)) }, [])
  useEffect(() => { load() }, [search, lowStock])

  const openAdd = () => { setForm(E); setEditing(null); setModal(true) }
  const openEdit = (p) => { setForm({ name:p.name,sku:p.sku,description:p.description||'',category_id:p.category_id||'',supplier_id:p.supplier_id||'',unit_price:p.unit_price,cost_price:p.cost_price,quantity_in_stock:p.quantity_in_stock,low_stock_threshold:p.low_stock_threshold,unit:p.unit }); setEditing(p); setModal(true) }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form, category_id: form.category_id || null, supplier_id: form.supplier_id || null }
      if (editing) { await api.put(`/api/products/${editing.id}`, payload); toast.success('Updated') }
      else { await api.post('/api/products', payload); toast.success('Created') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    try { await api.delete(`/api/products/${id}`); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="w-4 h-4" />Add Product</button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="accent-indigo-600" />Low stock only</label>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
            <th className="px-5 py-3 text-left">Product</th><th className="px-5 py-3 text-left">SKU</th><th className="px-5 py-3 text-left">Category</th><th className="px-5 py-3 text-left">Stock</th><th className="px-5 py-3 text-left">Price</th><th className="px-5 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3"><div className="font-medium">{p.name}</div><div className="text-xs text-gray-400">{p.supplier?.name}</div></td>
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                <td className="px-5 py-3">{p.category?.name || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.quantity_in_stock <= p.low_stock_threshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.quantity_in_stock <= p.low_stock_threshold && <AlertTriangle className="w-3 h-3" />}{p.quantity_in_stock} {p.unit}
                  </span>
                </td>
                <td className="px-5 py-3">₹{p.unit_price}</td>
                <td className="px-5 py-3 flex justify-end gap-2">
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Name</label><input required value={form.name} onChange={e => f('name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">SKU</label><input required={!editing} disabled={!!editing} value={form.sku} onChange={e => f('sku', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Unit</label><input value={form.unit} onChange={e => f('unit', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              {[['unit_price','Sell Price'],['cost_price','Cost'],['quantity_in_stock','Stock Qty'],['low_stock_threshold','Alert At']].map(([k,l]) => (
                <div key={k}><label className="block text-xs font-medium text-gray-700 mb-1">{l}</label><input type="number" min="0" value={form[k]} onChange={e => f(k, parseFloat(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              ))}
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => f('category_id', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">None</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                <select value={form.supplier_id} onChange={e => f('supplier_id', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">None</option>{sups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
