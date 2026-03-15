import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, Edit, Trash2, X, Package, ShoppingCart } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useProducts, useMutateProduct, useDeactivateProduct } from '../hooks/useProducts';
import PurchaseOrderModal from '../components/PurchaseOrderModal';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // API Hooks
  const apiType = filterType === 'all' ? undefined : (filterType === 'barang' ? 'physical' : 'service');
  const { data: products = [], isLoading } = useProducts({ type: apiType, q: searchTerm });
  const mutateProduct = useMutateProduct();
  const deactivateProduct = useDeactivateProduct();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [prefillProductId, setPrefillProductId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  const filteredProducts = products; // Already filtered by API request

  const openAddModal = () => {
    setModalMode('add');
    setCurrentProduct({ name: '', type: 'barang', price: 0, quantity: 0, category: 'Umum', sku: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setModalMode('edit');
    setCurrentProduct({ 
      ...product, 
      type: product.type === 'physical' ? 'barang' : 'jasa' 
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Yakin ingin menonaktifkan item ini?')) {
      deactivateProduct.mutate(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...currentProduct,
      type: currentProduct.type === 'barang' ? 'physical' : 'service',
      quantity: currentProduct.quantity || 0,
    };
    
    // Auto-generate SKU if empty
    if (!payload.sku) payload.sku = `SKU-${Date.now()}`;

    if (modalMode === 'edit') {
      mutateProduct.mutate({ ...payload, isUpdate: true }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      mutateProduct.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Produk & Jasa</h1>
          <p className="text-gray-500 mt-1">Kelola inventaris barang dan layanan servis.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#52c46a] hover:bg-[#45a659] text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Tambah Item</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama produk atau ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all font-medium text-gray-700"
          >
            <option value="all">Semua Tipe</option>
            <option value="barang">Barang Fisik</option>
            <option value="jasa">Jasa / Servis</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">ID Item</th>
                <th className="px-6 py-4 font-medium">Nama & Tipe</th>
                <th className="px-6 py-4 font-medium text-right">Harga</th>
                <th className="px-6 py-4 font-medium text-center">Stok</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <LoadingSkeleton />
                  </td>
                </tr>
              ) : filteredProducts.map((product: any) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={product.id} 
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-gray-500 text-xs">{product.sku}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500 capitalize mt-0.5 flex items-center gap-1">
                      {product.type === 'physical' ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-400"></span>
                      )}
                      {product.type === 'physical' ? 'Barang' : 'Jasa'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-900 font-medium">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-gray-700">
                    {product.type === 'service' ? <span className="text-gray-400">-</span> : product.quantity}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(product.type === 'service' || product.quantity > product.min_quantity) && <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-xs font-medium border border-green-100">Aktif</span>}
                    {(product.type === 'physical' && product.quantity > 0 && product.quantity <= product.min_quantity) && <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-md text-xs font-medium border border-orange-100">Menipis</span>}
                    {(product.type === 'physical' && product.quantity <= 0) && <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-xs font-medium border border-red-100">Habis</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit size={16} />
                      </button>
                      {product.type === 'physical' && (
                        <button 
                          onClick={() => {
                            setPrefillProductId(product.id);
                            setIsPOModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Buat Purchase Order"
                        >
                          <ShoppingCart size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus / Nonaktifkan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>Tidak ada produk yang ditemukan.</p>
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
                  {modalMode === 'add' ? 'Tambah Item Baru' : 'Edit Item'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Item</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        value="barang" 
                        checked={currentProduct?.type === 'barang'}
                        onChange={(e) => setCurrentProduct({...currentProduct, type: e.target.value})}
                        className="text-[#52c46a] focus:ring-[#52c46a]"
                      />
                      <span className="text-sm text-gray-700">Barang Fisik</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        value="jasa" 
                        checked={currentProduct?.type === 'jasa'}
                        onChange={(e) => setCurrentProduct({...currentProduct, type: e.target.value})}
                        className="text-[#52c46a] focus:ring-[#52c46a]"
                      />
                      <span className="text-sm text-gray-700">Jasa / Servis</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Item</label>
                  <input 
                    type="text" 
                    required
                    value={currentProduct?.name || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
                    placeholder="Contoh: SSD Samsung 1TB"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU / Kode</label>
                    <input 
                      type="text" 
                      value={currentProduct?.sku || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, sku: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all font-mono"
                      placeholder="Auto (Kosongkan jika tidak ada)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                    <input 
                      type="text" 
                      required
                      value={currentProduct?.category || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
                      placeholder="Label Kategori"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (Rp)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={currentProduct?.price || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all font-mono"
                    />
                  </div>
                  {currentProduct?.type === 'barang' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Stok Saat Ini</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={currentProduct?.quantity || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, quantity: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all font-mono"
                      />
                    </div>
                  )}
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
                    className="px-6 py-2 bg-[#52c46a] hover:bg-[#45a659] text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PurchaseOrderModal 
        isOpen={isPOModalOpen} 
        onClose={() => {
          setIsPOModalOpen(false);
          setPrefillProductId(null);
        }}
        prefillProductId={prefillProductId}
      />
    </div>
  );
}
