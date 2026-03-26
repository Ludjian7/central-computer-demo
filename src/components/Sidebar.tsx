import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Settings, 
  LogOut, Menu, X, Receipt, RotateCcw, ClipboardList, BarChart3, Tag, Clock, Wrench 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLowStock } from '../hooks/useProducts';
import clsx from 'clsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { data: lowStockItems } = useLowStock();
  const lowStockCount = lowStockItems?.length || 0;

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'owner'] },
    { path: '/pos', icon: ShoppingCart, label: 'Point of Sales', roles: ['admin', 'owner', 'karyawan'] },
    { path: '/services', icon: Wrench, label: 'Servis & Jasa', roles: ['admin', 'owner', 'karyawan'] },
    { path: '/products', icon: Package, label: 'Produk', roles: ['admin', 'owner'], hasBadge: true },
    { path: '/suppliers', icon: Users, label: 'Supplier', roles: ['admin', 'owner'] },
    { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders', roles: ['admin', 'owner'] },
    { path: '/sales', icon: Receipt, label: 'Transaksi', roles: ['admin', 'owner'] },
    { path: '/returns', icon: RotateCcw, label: 'Retur', roles: ['admin', 'owner'] },
    { path: '/stock-opname', icon: ClipboardList, label: 'Stock Opname', roles: ['admin', 'owner'] },
    { path: '/discounts', icon: Tag, label: 'Diskon & Promo', roles: ['admin', 'owner'] },
    { path: '/shifts', icon: Clock, label: 'Shift Kasir', roles: ['admin', 'owner'] },
    { path: '/reports', icon: BarChart3, label: 'Laporan', roles: ['admin', 'owner'] },
    { path: '/settings', icon: Settings, label: 'Pengaturan', roles: ['admin', 'owner'] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="flex flex-col w-64 bg-[#1a2b4c] text-white h-full shrink-0 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-[#52c46a] opacity-10 rounded-full blur-[100px]"></div>

      <div className="p-5 pb-2 relative z-10">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-9 h-9 bg-[#52c46a] rounded-xl flex items-center justify-center shadow-lg shadow-[#52c46a]/20">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black italic tracking-tighter leading-none">CENTRAL</h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mt-0.5 uppercase">COMPUTER</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar relative z-10">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              isActive 
                ? "bg-[#52c46a] text-white shadow-lg shadow-[#52c46a]/20 font-semibold" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18} className={clsx("transition-transform duration-200", item.hasBadge && "relative")} />
            <span className="text-sm">{item.label}</span>
            
            {item.hasBadge && lowStockCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {lowStockCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 relative z-10 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs border border-white/10 shrink-0">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-[11px] truncate text-white uppercase tracking-tight">{user?.username}</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group font-medium"
        >
          <LogOut size={16} className="transition-transform group-hover:translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
        </button>
      </div>
    </aside>
  );
}
