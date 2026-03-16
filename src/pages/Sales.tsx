import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, CheckCircle2, AlertCircle, Clock, Download, Printer, RotateCcw } from 'lucide-react';
import { useSales, useUpdatePaymentStatus, useExportSalesCSV } from '../hooks/useSales';
import InvoicePrintModal from '../components/InvoicePrintModal';
import ReturnModal from '../components/ReturnModal';

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
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('id-ID', options);
};

const statusConfig: Record<string, any> = {
  paid: { label: 'Lunas', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2 },
  partial: { label: 'Parsial', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  unpaid: { label: 'Belum Bayar', color: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle },
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | string | null>(null);
  const [returnSaleId, setReturnSaleId] = useState<number | null>(null);
  
  // Custom Hooks
  const { data: sales = [], isLoading } = useSales();
  const updateStatus = useUpdatePaymentStatus();
  const { mutate: exportCSV, isPending: isExporting } = useExportSalesCSV();

  const filteredSales = useMemo(() => {
    return sales.filter((s: any) => {
      const q = searchTerm.toLowerCase();
      return (
        String(s.invoice_number).toLowerCase().includes(q) || 
        String(s.customer_name).toLowerCase().includes(q)
      );
    });
  }, [sales, searchTerm]);

  const handleStatusChange = (id: string, newStatus: string) => {
    if (window.confirm('Apakah Anda yakin ingin mengubah status pembayaran ini?')) {
      updateStatus.mutate({ id, status: newStatus });
    }
  };

  const handleExport = () => {
    exportCSV({ q: searchTerm });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Penjualan</h1>
          <p className="text-gray-500 mt-1">Daftar transaksi dan laporan pemesanan pelanggan.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download size={18} />
          <span>{isExporting ? 'Mengekspor...' : 'Export CSV'}</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari invoice atau nama pelanggan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="py-4 px-6 font-semibold">Invoice</th>
                <th className="py-4 px-6 font-semibold">Tanggal</th>
                <th className="py-4 px-6 font-semibold">Pelanggan</th>
                <th className="py-4 px-6 font-semibold">Metode Bayar</th>
                <th className="py-4 px-6 font-semibold">Total</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                       <div className="flex justify-center items-center">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#52c46a] mr-3"></div>
                         Memuat data penjualan...
                       </div>
                    </td>
                  </tr>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale: any) => {
                    const statusInfo = statusConfig[sale.payment_status] || statusConfig['unpaid'];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={sale.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="py-4 px-6 font-mono text-sm text-gray-600">{sale.invoice_number}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{formatDate(sale.created_at)}</td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{sale.customer_name || 'Umum'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 capitalize">{sale.payment_method}</td>
                        <td className="py-4 px-6 text-sm">
                          <div className="font-medium text-gray-900">{formatCurrency(sale.total)}</div>
                          {sale.discount_amount > 0 && (
                            <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded inline-block mt-0.5">
                              Disc: -{formatCurrency(sale.discount_amount)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                            <select
                                value={sale.payment_status}
                                onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                                className={`text-xs font-medium pl-3 pr-8 py-1.5 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-${statusInfo.color.split('-')[1]}-400 ${statusInfo.color} cursor-pointer transition-colors`}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                            >
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedInvoiceId(sale.id)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Cetak Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {(sale.payment_status === 'paid' || sale.payment_status === 'partial') && (
                              <button
                                onClick={() => setReturnSaleId(sale.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Retur Barang"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>Tidak ada riwayat penjualan.</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoiceId && (
        <InvoicePrintModal
          saleId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}

      {returnSaleId && (
        <ReturnModal
          saleId={returnSaleId}
          isOpen={!!returnSaleId}
          onClose={() => setReturnSaleId(null)}
        />
      )}
    </div>
  );
}
