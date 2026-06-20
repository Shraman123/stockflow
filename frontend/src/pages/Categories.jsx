import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'

export default function Categories() {
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => api.get('/api/categories').then(r => setItems(r.data))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ name: '', description: '' }); setEditing(null); setModal(true) }
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || '' }); setEditing(c); setModal(true) }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (editing) { await api.put(`/api/categories/${editing.id}`, form); toast.success('Updated') }
      else { await api.post('/api/categories', form); toast.success('Created') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete?')) return
    try { await api.delete(`/api/categories/${id}`); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="w-4 h-4" />Add Category</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div><h3 className="font-semibold">{c.name}</h3><p className="text-sm text-gray-500 mt-1">{c.description || 'No description'}</p></div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-gray-400 col-span-3 py-8 text-center">No categories yet.</p>}
      </div>
      {modal && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
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
