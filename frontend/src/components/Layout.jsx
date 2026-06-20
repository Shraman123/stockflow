import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Package, Tag, Truck, UserCircle, ShoppingCart, ArrowLeftRight, Bell, Users, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/customers', label: 'Customers', icon: UserCircle },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/stock', label: 'Stock Movements', icon: ArrowLeftRight },
  { to: '/alerts', label: 'Low Stock Alerts', icon: Bell },
  { to: '/users', label: 'Users', icon: Users },
]

function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }
  return (
    <aside className="flex flex-col h-full w-64 bg-indigo-950 text-white">
      <div className="p-6 border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <Package className="w-7 h-7 text-indigo-300" />
          <span className="text-xl font-bold">StockFlow</span>
        </div>
        <p className="text-xs text-indigo-400 mt-1">Inventory Management</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}>
            <Icon className="w-4 h-4 shrink-0" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-indigo-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-indigo-300 hover:bg-red-600 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex shrink-0"><Sidebar /></div>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <Sidebar onClose={() => setOpen(false)} />
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 p-4 bg-white border-b">
          <button onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-bold text-indigo-900">StockFlow</span>
        </div>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
