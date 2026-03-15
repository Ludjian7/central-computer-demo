import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';
import { useProducts } from '../hooks/useProducts';
import { useCreatePO } from '../hooks/usePurchaseOrders';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillProductId?: number | null;
}

export default function PurchaseOrderModal({ isOpen, onClose, prefillProductId }: PurchaseOrderModalProps) {
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts({ type: 'physical' });
  const createPO = useCreatePO();

  const [supplierId, setSupplierId] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && prefillProductId && products) {
      const product = products.find(p => p.id === prefillProductId);
      if (product && !items.find(i => i.product_id === product.id)) {
        setItems([{
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_cost: product.cost || 0
        }]);
      }
    }
  }, [isOpen, prefillProductId, products]);

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'product_id') {
      const product = products?.find(p => p.id === parseInt(value));
      newItems[index] = {
        ...newItems[index],
        product_id: parseInt(value),
        product_name: product?.name || '',
        unit_cost: product?.cost || 0
      };
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;

    createPO.mutate({
      supplier_id: parseInt(supplierId),
      expected_date: expectedDate || null,
      notes: notes || null,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        unit_cost: parseInt(item.unit_cost)
      }))
    }, {
      onSuccess: () => {
        onClose();
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setSupplierId('');
    setExpectedDate('');
    setNotes('');
    setItems([]);
  };

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Buat Purchase Order Baru</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Supplier</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih Supplier</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.contact_person})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ekspektasi Tanggal Terima</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Item Barang</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-4 w-4" /> Tambah Item
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-lg border">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Produk</th>
                    <th className="px-4 py-2 w-24">Qty</th>
                    <th className="px-4 py-2 w-40">Harga Beli (Satuan)</th>
                    <th className="px-4 py-2 w-40 text-right">Subtotal</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="w-full rounded border-gray-300 p-1"
                        >
                          <option value="">Pilih Produk</option>
                          {products?.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full rounded border-gray-300 p-1"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                          className="w-full rounded border-gray-300 p-1 text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        Rp {((item.quantity * item.unit_cost) || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                        Belum ada item ditambahkan. Klik "Tambah Item" di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">Catatan Khusus</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Harap kirim sebelum jam 5 sore..."
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Estimasi Total Pembelian</p>
              <p className="text-2xl font-bold text-gray-900">Rp {totalAmount.toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createPO.isPending || items.length === 0}
                className="rounded-lg bg-indigo-600 px-8 py-2.5 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                {createPO.isPending ? 'Menyimpan...' : 'Buat PO'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
