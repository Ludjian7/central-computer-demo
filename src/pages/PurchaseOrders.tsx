import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Truck, 
  PackageCheck, 
  Clock, 
  AlertCircle,
  XCircle,
  MoreVertical,
  ChevronRight,
  Printer
} from 'lucide-react';
import { usePurchaseOrders, useUpdatePOStatus } from '../hooks/usePurchaseOrders';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import ReceiveGoodsModal from '../components/ReceiveGoodsModal';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PurchaseOrders() {
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: pos, isLoading } = usePurchaseOrders(statusFilter ? { status: statusFilter } : {});
  const updateStatus = useUpdatePOStatus();

  const safeFormatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd/MM/yyyy');
  };

  const safeFormatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd MMM yyyy HH:mm', { locale: id });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Draft</span>;
      case 'sent':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Dikirim</span>;
      case 'partial':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Diterima Sebagian</span>;
      case 'received':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Selesai</span>;
      case 'cancelled':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Dibatalkan</span>;
      default:
        return null;
    }
  };

  const handleUpdateStatus = (id: number, status: string) => {
    if (window.confirm(`Yakin ingin mengubah status PO ini menjadi ${status}?`)) {
      updateStatus.mutate({ id, status });
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Purchase Orders</h1>
          <p className="text-gray-500">Manajemen pengadaan barang dari supplier</p>
        </div>
        <button 
          onClick={() => setIsPOModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Buat PO Baru
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari No PO atau Supplier..."
            className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border-0 bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Dikirim</option>
          <option value="partial">Diterima Sebagian</option>
          <option value="received">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
             <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
             <p className="text-gray-500">Memuat data Purchase Order...</p>
          </div>
        ) : pos && pos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">No PO / Tanggal</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {pos.map((po) => (
                  <tr key={po.id} className="group hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-indigo-700">{po.po_number}</p>
                      <p className="text-xs text-gray-400">{safeFormatDateTime(po.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{po.supplier_name}</p>
                      <p className="text-xs text-gray-500">Oleh: {po.created_by_name}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-gray-900">Rp {(po.total_amount || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                         <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Ekspektasi: {safeFormatDate(po.expected_date)}</span>
                         </div>
                         {po.received_date && (
                           <div className="flex items-center gap-1.5 text-green-600 font-medium">
                              <PackageCheck className="h-3 w-3" />
                              <span>Diterima: {safeFormatDate(po.received_date)}</span>
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {po.status === 'draft' && (
                          <button 
                            onClick={() => handleUpdateStatus(po.id, 'sent')}
                            title="Kirim PO"
                            className="rounded-lg border p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                        
                        {(po.status === 'sent' || po.status === 'partial') && (
                          <button 
                            onClick={() => {
                              setSelectedPOId(po.id);
                              setIsReceiveModalOpen(true);
                            }}
                            title="Terima Barang"
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                          >
                            <PackageCheck className="h-4 w-4" />
                            Terima
                          </button>
                        )}

                        {po.status !== 'received' && po.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleUpdateStatus(po.id, 'cancelled')}
                            title="Batalkan PO"
                            className="rounded-lg border p-2 text-red-500 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Detail/Print button could go here */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
            <div className="mb-4 rounded-full bg-gray-50 p-6">
              <ShoppingCart className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada Purchase Order</h3>
            <p className="max-w-xs">Data pembelian barang ke supplier akan muncul di sini.</p>
          </div>
        )}
      </div>

      <PurchaseOrderModal 
        isOpen={isPOModalOpen} 
        onClose={() => setIsPOModalOpen(false)} 
      />
      
      <ReceiveGoodsModal 
        isOpen={isReceiveModalOpen} 
        onClose={() => {
          setIsReceiveModalOpen(false);
          setSelectedPOId(null);
        }}
        poId={selectedPOId}
      />
    </div>
  );
}
