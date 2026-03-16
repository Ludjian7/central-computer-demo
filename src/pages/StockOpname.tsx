import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Plus, Search, CheckCircle2, AlertCircle, Calendar, Save, Trash2, X } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useStockOpnames, useCreateStockOpname, useStockOpnameDetail, useUpdateStockOpnameItem, useCompleteStockOpname } from '../hooks/useStockOpname';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function StockOpname() {
  const [selectedOpnameId, setSelectedOpnameId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOpnameNotes, setNewOpnameNotes] = useState('');

  const safeFormatDate = (dateString: any) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd MMMM yyyy', { locale: idLocale });
  };

  const { data: opnames, isLoading: isLoadingList } = useStockOpnames();
  const { data: detail, isLoading: isLoadingDetail } = useStockOpnameDetail(selectedOpnameId);
  
  const createOpname = useCreateStockOpname();
  const updateItem = useUpdateStockOpnameItem();
  const completeOpname = useCompleteStockOpname();

  const handleCreateDraft = () => {
    createOpname.mutate({ notes: newOpnameNotes }, {
      onSuccess: (res) => {
        setIsCreateModalOpen(false);
        setNewOpnameNotes('');
        setSelectedOpnameId(res.data.id);
      }
    });
  };

  const handleUpdateQty = (productId: number, physicalQty: number) => {
    if (selectedOpnameId) {
      updateItem.mutate({ opnameId: selectedOpnameId, productId, physicalQty });
    }
  };

  const handleComplete = () => {
    if (selectedOpnameId && confirm('Apakah Anda yakin ingin menyelesaikan opname ini? Stok sistem akan disesuaikan secara permanen.')) {
      completeOpname.mutate(selectedOpnameId, {
        onSuccess: () => setSelectedOpnameId(null)
      });
    }
  };

  if (isLoadingList) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Opname</h1>
          <p className="text-gray-500">Pencocokan stok fisik dengan sistem</p>
        </div>
        {!selectedOpnameId && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Buat Opname Baru
          </button>
        )}
      </div>

      {!selectedOpnameId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-bottom border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catatan</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibuat Oleh</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opnames?.map((op: any) => (
                <tr key={op.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedOpnameId(op.id)}>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {safeFormatDate(op.opname_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{op.notes || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{op.creator_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      op.status === 'completed' ? 'bg-green-100 text-green-700' :
                      op.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {op.status === 'completed' ? 'Selesai' : op.status === 'in_progress' ? 'Proses' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                      Buka
                    </button>
                  </td>
                </tr>
              ))}
              {(!opnames || opnames.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada riwayat stock opname
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <button 
              onClick={() => setSelectedOpnameId(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex-1">
              <h2 className="font-bold text-gray-800">
                Opname: {safeFormatDate(detail?.opname_date || new Date())}
              </h2>
              <p className="text-sm text-gray-500">{detail?.notes || 'Tidak ada catatan'}</p>
            </div>
            {detail?.status !== 'completed' && (
              <button
                onClick={handleComplete}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={18} />
                Selesaikan Opname
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {isLoadingDetail ? <LoadingSkeleton /> : (
               <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Sistem</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Fisik</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail?.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{item.product_name}</div>
                          <div className="text-xs text-gray-400">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.product_sku}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-600">{item.system_qty}</td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            defaultValue={item.physical_qty ?? ''}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== item.physical_qty) {
                                handleUpdateQty(item.product_id, val);
                              }
                            }}
                            disabled={detail.status === 'completed'}
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50"
                            placeholder="Hitung..."
                          />
                        </td>
                        <td className="px-6 py-4">
                          {item.difference !== null ? (
                            <span className={`font-bold ${item.difference === 0 ? 'text-gray-400' : item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.difference > 0 ? `+${item.difference}` : item.difference}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-gray-800">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Buat Draft Opname</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600 text-sm">
                  Sistem akan mengambil snapshot stok seluruh produk fisik saat ini sebagai referensi.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={newOpnameNotes}
                    onChange={(e) => setNewOpnameNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                    placeholder="Contoh: Opname akhir bulan Maret..."
                  />
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateDraft}
                  disabled={createOpname.isPending}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {createOpname.isPending ? 'Memproses...' : 'Mulai Opname'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
