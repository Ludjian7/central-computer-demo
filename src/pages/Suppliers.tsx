import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit, Trash2, X, Users, Mail, Phone, MapPin } from 'lucide-react';

// --- MOCK DATA ---
const initialSuppliers = [
  { id: 'SUP-001', name: 'PT Surya Komputerindo', contact_person: 'Andi Wijaya', phone: '081234567890', email: 'sales@suryakomp.co.id', address: 'Jl. Mangga Dua Raya No. 12, Jakarta' },
  { id: 'SUP-002', name: 'CV Maju Jaya IT', contact_person: 'Budi Santoso', phone: '085678901234', email: 'info@majujayait.com', address: 'Harco Mas Lantai 3, Jakarta' },
  { id: 'SUP-003', name: 'Global Tech Distributor', contact_person: 'Cindy Lestari', phone: '087812345678', email: 'cindy@globaltech.id', address: 'Kawasan Industri Pulogadung Blok B2' },
];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);

  const filteredSuppliers = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           s.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const openAddModal = () => {
    setModalMode('add');
    setCurrentSupplier({ name: '', contact_person: '', phone: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setModalMode('edit');
    setCurrentSupplier({ ...supplier });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newId = `SUP-00${suppliers.length + 1}`;
      setSuppliers([{ ...currentSupplier, id: newId }, ...suppliers]);
    } else {
      setSuppliers(suppliers.map(s => s.id === currentSupplier.id ? currentSupplier : s));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Supplier</h1>
          <p className="text-gray-500 mt-1">Kelola daftar pemasok barang dan suku cadang.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#1a2b4c] hover:bg-[#111c33] text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Tambah Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama supplier atau kontak..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] transition-all"
          />
        </div>
      </div>

      {/* Grid Cards for Suppliers (Alternative to Table for better UX) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={supplier.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a2b4c] to-[#52c46a] opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-gray-400 mb-1 block">{supplier.id}</span>
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">{supplier.name}</h3>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(supplier)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <Users size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-gray-900">{supplier.contact_person}</span>
                  <span className="text-xs text-gray-500">Contact Person</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span className="font-mono">{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{supplier.address}</span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>Tidak ada supplier yang ditemukan.</p>
          </div>
        )}
      </div>

      {/* Modal CRUD with Floating Labels */}
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
                  {modalMode === 'add' ? 'Tambah Supplier Baru' : 'Edit Supplier'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-5">
                
                {/* Floating Label Input: Perusahaan */}
                <div className="relative">
                  <input 
                    type="text" 
                    id="name"
                    required
                    value={currentSupplier?.name || ''}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, name: e.target.value})}
                    className="block px-4 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c] peer transition-colors"
                    placeholder=" "
                  />
                  <label 
                    htmlFor="name" 
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a2b4c]"
                  >
                    Nama Perusahaan
                  </label>
                </div>

                {/* Floating Label Input: Contact Person */}
                <div className="relative">
                  <input 
                    type="text" 
                    id="cp"
                    required
                    value={currentSupplier?.contact_person || ''}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, contact_person: e.target.value})}
                    className="block px-4 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c] peer transition-colors"
                    placeholder=" "
                  />
                  <label 
                    htmlFor="cp" 
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a2b4c]"
                  >
                    Nama Kontak (PIC)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Floating Label Input: Phone */}
                  <div className="relative">
                    <input 
                      type="tel" 
                      id="phone"
                      required
                      value={currentSupplier?.phone || ''}
                      onChange={(e) => setCurrentSupplier({...currentSupplier, phone: e.target.value})}
                      className="block px-4 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c] peer transition-colors font-mono"
                      placeholder=" "
                    />
                    <label 
                      htmlFor="phone" 
                      className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a2b4c]"
                    >
                      No. Telepon
                    </label>
                  </div>

                  {/* Floating Label Input: Email */}
                  <div className="relative">
                    <input 
                      type="email" 
                      id="email"
                      required
                      value={currentSupplier?.email || ''}
                      onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                      className="block px-4 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c] peer transition-colors"
                      placeholder=" "
                    />
                    <label 
                      htmlFor="email" 
                      className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a2b4c]"
                    >
                      Email
                    </label>
                  </div>
                </div>

                {/* Floating Label Input: Address */}
                <div className="relative">
                  <textarea 
                    id="address"
                    required
                    rows={3}
                    value={currentSupplier?.address || ''}
                    onChange={(e) => setCurrentSupplier({...currentSupplier, address: e.target.value})}
                    className="block px-4 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-gray-50 rounded-xl border border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c] peer transition-colors resize-none"
                    placeholder=" "
                  ></textarea>
                  <label 
                    htmlFor="address" 
                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a2b4c]"
                  >
                    Alamat Lengkap
                  </label>
                </div>

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
