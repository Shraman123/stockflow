import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'staff' })
  const [loading, setLoading] = useState(false)

  const load = () => api.get('/api/users').then(r => setUsers(r.data)).catch(() => toast.error('Admin access required'))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/api/users', form)
      toast.success('User created'); setModal(false)
      setForm({ name:'', email:'', password:'', role:'staff' }); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete user?')) return
    try { await api.delete(`/api/users/${id}`); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Users</h1><p className="text-sm text-gray-500 mt-1">Admin access required</p></div>
        {me?.role === 'admin' && (
          <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"><Plus className="w-4 h-4" />Add User</button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
            <th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Email</th><th className="px-5 py-3 text-left">Role</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{u.name} {u.id===me?.id&&<span className="text-xs text-indigo-500">(you)</span>}</td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role==='admin'?'bg-indigo-100 text-indigo-700':'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.is_active?'Active':'Inactive'}</span></td>
                <td className="px-5 py-3 text-right">
                  {u.id!==me?.id && me?.role==='admin' && (
                    <button onClick={() => del(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Add User" onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            {[['name','Full Name'],['email','Email'],['password','Password']].map(([k,l]) => (
              <div key={k}><label className="block text-xs font-medium text-gray-700 mb-1">{l}</label>
                <input required type={k==='password'?'password':k==='email'?'email':'text'} value={form[k]} onChange={e => f(k,e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={e => f('role',e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="staff">Staff</option><option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">{loading?'Creating…':'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
