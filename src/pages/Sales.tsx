import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, CheckCircle2, AlertCircle, Clock, Download, Printer, RotateCcw, Calendar, TrendingUp, HandCoins } from 'lucide-react';
import { useSales, useUpdatePaymentStatus, useExportSalesCSV } from '../hooks/useSales';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  
  // Setup default dates for today to ensure fast loading initially
  const today = new Date();
  // using localized offset to get right local day
  const offsetMs = today.getTimezoneOffset() * 60 * 1000;
  const localToday = new Date(today.getTime() - offsetMs);
  const defaultDateStr = localToday.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultDateStr);
  const [endDate, setEndDate] = useState(defaultDateStr);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | string | null>(null);
  const [returnSaleId, setReturnSaleId] = useState<number | null>(null);
  
  // Fetch sales, passing date parameters to the backend
  const { data: sales = [], isLoading } = useSales({ startDate, endDate });
  const updateStatus = useUpdatePaymentStatus();
  const { mutate: exportCSV, isPending: isExporting } = useExportSalesCSV();

  const filteredSales = useMemo(() => {
    return sales.filter((s: any) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = String(s.invoice_number).toLowerCase().includes(q) || 
                          String(s.customer_name).toLowerCase().includes(q);
      
      const matchTab = statusTab === 'all' || s.payment_status === statusTab;
      
      // Frontend Date Filter Enforcement (fallback if backend ignores params)
      const saleDateStr = new Date(s.created_at).toISOString().split('T')[0];
      const matchStartDate = !startDate || saleDateStr >= startDate;
      const matchEndDate = !endDate || saleDateStr <= endDate;

      return matchSearch && matchTab && matchStartDate && matchEndDate;
    });
  }, [sales, searchTerm, statusTab, startDate, endDate]);

  const handleStatusChange = (id: string, newStatus: string) => {
    if (window.confirm('Apakah Anda yakin ingin mengubah status pembayaran ini?')) {
      updateStatus.mutate({ id, status: newStatus });
    }
  };

  const handleExport = () => {
    exportCSV({ q: searchTerm, startDate, endDate, status: statusTab !== 'all' ? statusTab : undefined });
  };

  // Computations for Summary Cards
  const totalPendapatan = filteredSales
    .filter((s: any) => s.payment_status === 'paid' || s.payment_status === 'partial')
    .reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
    
  const totalTransaksi = filteredSales.length;
  
  const totalPiutang = filteredSales
    .filter((s: any) => s.payment_status === 'unpaid' || s.payment_status === 'partial')
    .reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Penjualan</h1>
          <p className="text-gray-500 mt-1">Daftar transaksi dan laporan pemesanan pelanggan.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting || filteredSales.length === 0}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download size={18} />
          <span>{isExporting ? 'Mengekspor...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pemasukan Kotor (Termasuk Utang)</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalPendapatan + (totalPiutang > 0 && totalPendapatan === 0 ? totalPiutang : 0))}</h3>
          </div>
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Transaksi</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{totalTransaksi} Invoice</h3>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <HandCoins size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Potensi Piutang (Status Tertunda)</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalPiutang)}</h3>
          </div>
        </motion.div>
      </div>

      {/* Filters: Dates, Tabs, Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto pb-1 custom-scrollbar w-full lg:w-auto shrink-0 gap-2">
            {[
              { id: 'all', label: 'Semua Transaksi' },
              { id: 'paid', label: 'Lunas' },
              { id: 'partial', label: 'Parsial / Cicil' },
              { id: 'unpaid', label: 'Belum Bayar' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  statusTab === tab.id 
                    ? 'bg-[#1a2b4c] text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Selectors */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-full lg:w-auto shrink-0">
            <div className="flex items-center gap-2 px-3">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-gray-700 font-medium outline-none cursor-pointer"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-gray-300 font-medium">-</span>
            <div className="flex items-center gap-2 px-3">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-gray-700 font-medium outline-none cursor-pointer"
                title="Tanggal Akhir"
              />
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nomor invoice atau nama pelanggan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#52c46a]/20 focus:border-[#52c46a] transition-all"
          />
        </div>
      </div>

      {/* Main Data Table */}
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
                    <td colSpan={7} className="py-12 text-center text-gray-400">
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
                            {isAdminOrOwner ? (
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
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon size={14} />
                                {statusInfo.label}
                              </span>
                            )}
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
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p>Tidak ada riwayat penjualan pada rentang tanggal ini.</p>
                      <button 
                         onClick={() => { setStartDate(''); setEndDate(''); setStatusTab('all'); setSearchTerm(''); }}
                         className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                      >
                        Reset Filter
                      </button>
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
