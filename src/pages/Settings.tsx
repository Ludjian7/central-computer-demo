import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Building2, MapPin, Phone, Percent, Coins, RotateCcw } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    tax_ppn: '',
    currency_symbol: '',
    monthly_target: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        store_address: settings.store_address || '',
        store_phone: settings.store_phone || '',
        tax_ppn: settings.tax_ppn || '',
        currency_symbol: settings.currency_symbol || '',
        monthly_target: settings.monthly_target || ''
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-500 mt-1">Kelola profil toko dan konfigurasi operasional.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Toko */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 text-indigo-600">
            <Building2 size={20} />
            <h2 className="font-bold text-lg">Profil Toko</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Toko</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Nama Toko Anda"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-gray-400" size={18} />
                <textarea
                  name="store_address"
                  value={formData.store_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Alamat Lengkap Toko"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="store_phone"
                  value={formData.store_phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="0812..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Konfigurasi Sistem */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 text-emerald-600">
            <Percent size={20} />
            <h2 className="font-bold text-lg">Keuangan & Pajak</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pajak PPN (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  name="tax_ppn"
                  value={formData.tax_ppn}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="11"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Akan diterapkan di setiap transaksi POS.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Simbol Mata Uang</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="currency_symbol"
                  value={formData.currency_symbol}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Rp"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Pendapatan Bulanan (Rp)</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  name="monthly_target"
                  value={formData.monthly_target}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="150000000"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Digunakan untuk menghitung progress pencapaian di Dashboard KPI.</p>
            </div>
          </div>
        </div>

        {/* Aksi */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </button>
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
