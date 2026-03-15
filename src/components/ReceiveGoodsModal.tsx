import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, PackageCheck } from 'lucide-react';
import { usePurchaseOrderDetail, useReceiveGoods } from '../hooks/usePurchaseOrders';

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: number | null;
}

export default function ReceiveGoodsModal({ isOpen, onClose, poId }: ReceiveGoodsModalProps) {
  const { data: po, isLoading } = usePurchaseOrderDetail(poId);
  const receiveGoods = useReceiveGoods();

  const [receivedItems, setReceivedItems] = useState<any[]>([]);

  useEffect(() => {
    if (po?.items) {
      setReceivedItems(
        po.items.map(item => ({
          id: item.id,
          product_name: item.product_name,
          ordered_qty: item.quantity,
          already_received_qty: item.received_qty || 0,
          received_qty: (item.quantity - (item.received_qty || 0)) // Default to remaining
        }))
      );
    }
  }, [po]);

  const updateReceivedQty = (index: number, value: string) => {
    const newItems = [...receivedItems];
    newItems[index].received_qty = parseInt(value) || 0;
    setReceivedItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId) return;

    receiveGoods.mutate({
      id: poId,
      received_items: receivedItems
        .filter(item => item.received_qty > 0)
        .map(item => ({
          id: item.id,
          received_qty: item.received_qty
        }))
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  if (!isOpen || !poId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Penerimaan Barang (Goods Receipt)</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Memuat data PO...</div>
        ) : !po ? (
          <div className="p-12 text-center text-red-500">Data PO tidak ditemukan.</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6 flex justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Nomor PO</p>
                <p className="font-mono text-lg font-bold text-indigo-700">{po.po_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Supplier</p>
                <p className="font-semibold text-gray-800">{po.supplier_name}</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Daftar Barang Diterima</h3>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Nama Produk / Item</th>
                      <th className="px-4 py-2 text-center w-20">Pesan</th>
                      <th className="px-4 py-2 text-center w-20">Diterima</th>
                      <th className="px-4 py-2 text-center w-32">Masuk Sekarang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {receivedItems.map((item, index) => {
                       const isFullyReceived = item.already_received_qty + item.received_qty >= item.ordered_qty;
                       const errorOverReceived = item.already_received_qty + item.received_qty > item.ordered_qty;

                       return (
                        <tr key={index} className={errorOverReceived ? "bg-red-50" : ""}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{item.product_name}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.ordered_qty}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                             {item.already_received_qty}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center">
                              <input
                                type="number"
                                min="0"
                                max={item.ordered_qty - item.already_received_qty}
                                value={item.received_qty}
                                onChange={(e) => updateReceivedQty(index, e.target.value)}
                                className={`w-20 rounded border border-gray-300 p-1 text-center font-bold focus:ring-2 focus:ring-green-500 ${errorOverReceived ? 'border-red-500 text-red-600' : 'text-green-700'}`}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Memasukkan jumlah barang akan langsung menambah <strong>stok inventori</strong> dan mengupdate <strong>harga beli (HPP)</strong> produk tersebut berdasarkan PO ini.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={receiveGoods.isPending || receivedItems.every(i => i.received_qty <= 0)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-2.5 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-50"
              >
                {receiveGoods.isPending ? 'Memproses...' : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Simpan Penerimaan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
