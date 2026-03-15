import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, RotateCcw } from 'lucide-react';
import { useReturns } from '../hooks/useReturns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

export default function Returns() {
  const { data: returns = [], isLoading } = useReturns();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Retur</h1>
          <p className="text-gray-500 mt-1">Daftar pengembalian barang dan refund pelanggan.</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="py-4 px-6 font-semibold">TGL Retur</th>
                <th className="py-4 px-6 font-semibold">No. Invoice</th>
                <th className="py-4 px-6 font-semibold">Produk</th>
                <th className="py-4 px-6 font-semibold">Qty</th>
                <th className="py-4 px-6 font-semibold">Alasan</th>
                <th className="py-4 px-6 font-semibold">Refund</th>
                <th className="py-4 px-6 font-semibold">Metode</th>
                <th className="py-4 px-6 font-semibold">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                       <div className="flex justify-center items-center">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#52c46a] mr-3"></div>
                         Memuat data retur...
                       </div>
                    </td>
                  </tr>
                ) : returns.length > 0 ? (
                  returns.map((r: any) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={r.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6 text-sm text-gray-600">{formatDate(r.created_at)}</td>
                      <td className="py-4 px-6 font-mono text-sm text-blue-600 font-medium">{r.invoice_number}</td>
                      <td className="py-4 px-6 text-sm text-gray-900">{r.product_name}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 text-center">{r.quantity}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{r.reason}</td>
                      <td className="py-4 px-6 text-sm font-medium text-red-600">{formatCurrency(r.refund_amount)}</td>
                      <td className="py-4 px-6 text-sm text-gray-600 capitalize">{r.refund_method}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{r.processed_by_name}</td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      <RotateCcw className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>Belum ada riwayat retur.</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
