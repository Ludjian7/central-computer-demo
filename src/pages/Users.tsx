import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Shield, 
  User as UserIcon, 
  Mail, 
  Phone,
  Filter,
  KeyRound
} from 'lucide-react';
import { Role } from '../types';

// --- MOCK DATA ---
interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

const initialEmployees: Employee[] = [
  { id: 'EMP-001', name: 'Budi Santoso', email: 'budi@central.com', phone: '081234567890', role: 'owner', status: 'active', lastLogin: '2026-03-13 08:00' },
  { id: 'EMP-002', name: 'Siti Aminah', email: 'siti@central.com', phone: '085678901234', role: 'admin', status: 'active', lastLogin: '2026-03-13 08:15' },
  { id: 'EMP-003', name: 'Agus Pratama', email: 'agus@central.com', phone: '087812345678', role: 'karyawan', status: 'active', lastLogin: '2026-03-13 09:30' },
  { id: 'EMP-004', name: 'Rina Melati', email: 'rina@central.com', phone: '089912345678', role: 'karyawan', status: 'active', lastLogin: '2026-03-13 07:45' },
  { id: 'EMP-005', name: 'Dedi Kurniawan', email: 'dedi@central.com', phone: '081122334455', role: 'karyawan', status: 'inactive', lastLogin: '2026-03-01 17:00' },
];

const roleConfig: Record<Role, { label: string; color: string }> = {
  owner: { label: 'Pemilik', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  admin: { label: 'Administrator', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  karyawan: { label: 'Karyawan', color: 'bg-green-50 text-green-600 border-green-200' },
};

export default function Users() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || emp.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [employees, searchTerm, filterRole]);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentEmployee({
      name: '', email: '', phone: '', role: 'karyawan', status: 'active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setModalMode('edit');
    setCurrentEmployee({ ...employee });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      const newEmployee: Employee = {
        ...currentEmployee,
        id: newId,
      } as Employee;
      setEmployees([newEmployee, ...employees]);
    } else {
      setEmployees(employees.map(emp => emp.id === currentEmployee.id ? currentEmployee as Employee : emp));
    }
    setIsModalOpen(false);
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Karyawan</h1>
          <p className="text-gray-500 mt-1">Kelola akses pengguna dan data staf toko.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#1a2b4c] hover:bg-[#111c33] text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, email, atau ID karyawan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as Role | 'all')}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all font-medium text-gray-700"
          >
            <option value="all">Semua Role</option>
            <option value="owner">Pemilik</option>
            <option value="admin">Administrator</option>
            <option value="karyawan">Karyawan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Karyawan</th>
                <th className="px-6 py-4 font-medium">Kontak</th>
                <th className="px-6 py-4 font-medium">Role Akses</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={emp.id} 
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 font-bold shadow-sm">
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{emp.name}</div>
                        <div className="text-xs font-mono text-gray-500 mt-0.5">{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone size={14} className="text-gray-400" />
                        <span className="font-mono text-xs">{emp.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${roleConfig[emp.role].color}`}>
                      <Shield size={12} />
                      {roleConfig[emp.role].label}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {emp.status === 'active' ? (
                      <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-xs font-medium border border-green-100">Aktif</span>
                    ) : (
                      <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-xs font-medium border border-red-100">Nonaktif</span>
                    )}
                    {emp.lastLogin && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        Login: {emp.lastLogin}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Karyawan"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Karyawan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>Tidak ada karyawan yang ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-800">
                  {modalMode === 'add' ? 'Tambah Karyawan Baru' : 'Edit Data Karyawan'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={currentEmployee.name || ''}
                    onChange={(e) => setCurrentEmployee({...currentEmployee, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input 
                      type="email" 
                      required
                      value={currentEmployee.email || ''}
                      onChange={(e) => setCurrentEmployee({...currentEmployee, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all"
                      placeholder="email@domain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">No. HP / WA</label>
                    <input 
                      type="tel" 
                      required
                      value={currentEmployee.phone || ''}
                      onChange={(e) => setCurrentEmployee({...currentEmployee, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all font-mono"
                      placeholder="0812..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Akses</label>
                    <select 
                      value={currentEmployee.role || 'cashier'}
                      onChange={(e) => setCurrentEmployee({...currentEmployee, role: e.target.value as Role})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all"
                    >
                      <option value="karyawan">Karyawan</option>
                      <option value="admin">Administrator</option>
                      <option value="owner">Pemilik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Akun</label>
                    <select 
                      value={currentEmployee.status || 'active'}
                      onChange={(e) => setCurrentEmployee({...currentEmployee, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Sementara</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        required
                        defaultValue="central123"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Karyawan dapat mengubah password setelah login pertama kali.</p>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-[#1a2b4c] hover:bg-[#111c33] text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
