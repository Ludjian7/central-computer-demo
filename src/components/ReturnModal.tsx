import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useCreateReturn } from '../hooks/useReturns';
import { useSaleDetail } from '../hooks/useSales';

interface ReturnModalProps {
  saleId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnModal({ saleId, isOpen, onClose }: ReturnModalProps) {
  const { data: saleData } = useSaleDetail(saleId);
  const createReturn = useCreateReturn();

  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'transfer' | 'store_credit'>('cash');

  if (!isOpen || !saleData) return null;

  // Hanya bisa meretur produk fisik
  const returnableItems = saleData.items?.filter((item: any) => 
    !item.type || item.product_name // Kita asumsikan ada properti fisik/jasa. Backend sudah validasi.
  ) || [];

  const selectedItem = returnableItems.find((i: any) => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Pilih item yang akan diretur');
      return;
    }
    
    if (selectedItem && returnQty > selectedItem.quantity) {
      alert('Kuantitas retur melebihi yang dibeli');
      return;
    }

    createReturn.mutate({
      sale_id: saleId,
      sale_item_id: selectedItemId,
      quantity: returnQty,
      reason,
      refund_method: refundMethod
    }, {
      onSuccess: () => {
        onClose();
        setSelectedItemId('');
        setReturnQty(1);
        setReason('');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 flex items-center justify-center rounded-xl shadow-inner">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Proses Retur</h2>
              <p className="text-sm text-gray-500 font-medium">{saleData.invoice_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="return-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Item</label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(Number(e.target.value) || '')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
              >
                <option value="">-- Pilih item --</option>
                {returnableItems.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.product_name} (Beli: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            {selectedItemId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kuantitas Retur</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem?.quantity || 1}
                    required
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maks: {selectedItem?.quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund Metode</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="store_credit">Saldo Toko</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alasan Retur</label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Barang cacat dari pabrik..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              ></textarea>
            </div>
            
            {selectedItem && (
               <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center text-sm">
                 <span className="text-orange-800 font-medium">Est. Refund:</span>
                 <span className="font-bold text-orange-700 font-mono">
                    Rp {((selectedItem.price - (selectedItem.discount || 0)) * returnQty).toLocaleString('id-ID')}
                 </span>
               </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3 flex-row-reverse">
          <button
            type="submit"
            form="return-form"
            disabled={createReturn.isPending || !selectedItemId}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          >
            {createReturn.isPending ? 'Merespons...' : 'Proses Retur'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors shadow-sm"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
