import React, { useState } from 'react';
import { useDiscounts, useCreateDiscount, useToggleDiscount, Discount } from '../hooks/useDiscounts';
import { Plus, Tag, Calendar, CheckCircle2, XCircle, Search, Percent, Banknote } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const safeFormatDate = (dateValue: any, fmt: string = 'd MMM yyyy'): string => {
  if (!dateValue) return '-';
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    return isValid(date) ? format(date, fmt) : '-';
  } catch {
    return '-';
  }
};

const Discounts: React.FC = () => {
  const { data: discounts, isLoading } = useDiscounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const toggleDiscount = useToggleDiscount();

  const filteredDiscounts = discounts?.filter(d => 
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Diskon & Promo</h1>
          <p className="text-slate-500">Kelola kode voucher dan promo spesial untuk pelanggan.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Buat Promo Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari kode atau nama promo..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Promo</th>
                <th className="px-6 py-4">Tipe & Nilai</th>
                <th className="px-6 py-4">Masa Berlaku</th>
                <th className="px-6 py-4">Pemakaian</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italicColors">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">Memuat data...</td>
                </tr>
              ) : filteredDiscounts?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">Belum ada promo yang dibuat.</td>
                </tr>
              ) : filteredDiscounts?.map((discount) => (
                <tr key={discount.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 tracking-tight uppercase">{discount.code}</div>
                        <div className="text-xs text-slate-500">{discount.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {discount.type === 'percent' ? (
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                           <Percent className="w-3.5 h-3.5" />
                           {discount.value}%
                         </span>
                       ) : (
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold">
                           <Banknote className="w-3.5 h-3.5" />
                           Rp {(discount.value || 0).toLocaleString('id-ID')}
                         </span>
                       )}
                    </div>
                    {discount.max_discount && (
                      <div className="text-[10px] text-slate-400 mt-1 uppercase">Maks: Rp {(discount.max_discount || 0).toLocaleString('id-ID')}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{safeFormatDate(discount.valid_from)} - {safeFormatDate(discount.valid_until)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 w-24">
                      <div className="flex justify-between text-[10px] font-medium uppercase text-slate-500">
                        <span>Terpakai</span>
                        <span>{discount.used_count}/{discount.usage_limit || '∞'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${discount.usage_limit ? (discount.used_count / discount.usage_limit) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {discount.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleDiscount.mutate(discount.id)}
                      className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                        discount.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      {discount.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddDiscountModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

const AddDiscountModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createDiscount = useCreateDiscount();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 0,
    min_purchase: 0,
    max_discount: '',
    usage_limit: '',
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDiscount.mutate({
      ...formData,
      max_discount: formData.max_discount ? Number(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null
    }, {
      onSuccess: () => onClose()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 text-slate-800">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-xl font-bold">Buat Promo Baru</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Kode Voucher</label>
              <input
                type="text"
                required
                placeholder="CONTOH: LEBARAN20"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-bold tracking-widest text-indigo-600"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Nama Promo</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Tipe Diskon</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percent' | 'fixed' })}
              >
                <option value="percent">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                Nilai {formData.type === 'percent' ? 'Persen' : 'Rupiah'}
              </label>
              <input
                type="number"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Min. Belanja</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.min_purchase || ''}
                onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Maks. Diskon (Rp)</label>
              <input
                type="number"
                placeholder="Opsional"
                disabled={formData.type === 'fixed'}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
                value={formData.max_discount}
                onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Kuota Pakai</label>
              <input
                type="number"
                placeholder="∞"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Mulai Berlaku</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Sampai Tanggal</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createDiscount.isPending}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 shadow-md"
            >
              {createDiscount.isPending ? 'Menyimpan...' : 'Simpan Promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Discounts;
