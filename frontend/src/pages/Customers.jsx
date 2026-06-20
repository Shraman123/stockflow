import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'

const E = { name:'',email:'',phone:'',address:'' }

export default function Customers() {
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(E)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => api.get('/api/customers').then(r => setItems(r.data))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(E); setEditing(null); setModal(true) }
  const openEdit = (c) => { setForm({ name:c.name,email:c.email,phone:c.phone||'',address:c.address||'' }); setEditing(c); setModal(true) }

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (editing) { await api.put(`/api/customers/${editing.id}`, form); toast.success('Updated') }
      else { await api.post('/api/customers', form); toast.success('Customer created') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete customer?')) return
    try { await api.delete(`/api/customers/${id}`); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="w-4 h-4" />Add Customer</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
            <th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Email</th><th className="px-5 py-3 text-left">Phone</th><th className="px-5 py-3 text-left">Address</th><th className="px-5 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-gray-500">{c.email}</td>
                <td className="px-5 py-3 text-gray-500">{c.phone||'—'}</td>
                <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{c.address||'—'}</td>
                <td className="px-5 py-3 flex justify-end gap-2">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editing ? 'Edit Customer' : 'Add Customer'} onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            {[['name','Full Name',true],['email','Email',true],['phone','Phone',false],['address','Address',false]].map(([k,l,r]) => (
              <div key={k}><label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
                <input required={r} type={k==='email'?'email':'text'} value={form[k]} onChange={e => f(k, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
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
