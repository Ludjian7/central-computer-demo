import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, User as UserIcon } from 'lucide-react';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { user } = useAuth();

  return (
    <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
          Welcome back, {user?.nama_lengkap || user?.username}!
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-gray-700">{user?.nama_lengkap || user?.username}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#52c46a] bg-[#52c46a]/10 px-2 py-0.5 rounded-full mt-0.5">
              {user?.role}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#52c46a] to-[#e88124] flex items-center justify-center text-white shadow-sm">
            <UserIcon size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
