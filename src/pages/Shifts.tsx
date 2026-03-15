import React, { useState } from 'react';
import { useShifts, useShiftReport, CashShift } from '../hooks/useShifts';
import { Clock, User, Download, FileText, ChevronRight, Wallet, Banknote, CreditCard, QrCode } from 'lucide-react';
import { format } from 'date-fns';

const Shifts: React.FC = () => {
  const { data: shifts, isLoading } = useShifts();
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Shift Kasir</h1>
          <p className="text-slate-500">Pantau pembukaan dan penutupan kas serta rekap pendapatan per shift.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shift List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700">Shift Terbaru</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Memuat riwayat...</div>
              ) : shifts?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">Belum ada riwayat shift.</div>
              ) : shifts?.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => setSelectedShiftId(shift.id)}
                  className={`w-full p-4 text-left transition-colors flex items-center justify-between group ${
                    selectedShiftId === shift.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${shift.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                       <span className="font-bold text-slate-800 uppercase text-xs">Shift #{shift.id}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{shift.cashier_name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {format(new Date(shift.opened_at), 'd MMM, HH:mm')}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Shift Detail / Report */}
        <div className="lg:col-span-2">
          {selectedShiftId ? (
            <ShiftDetailView id={selectedShiftId} />
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <p className="font-medium text-slate-600">Pilih shift untuk melihat laporan detail</p>
              <p className="text-sm border-t border-slate-200 mt-2 pt-2">Laporan mencakup breakdown metode bayar dan daftar transaksi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShiftDetailView: React.FC<{ id: number }> = ({ id }) => {
  const { data: report, isLoading } = useShiftReport(id);

  if (isLoading) return <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">Menyiapkan laporan...</div>;
  if (!report) return null;

  const { shift, summary, transactions } = report;
  const isDiff = shift.closing_cash !== null && shift.closing_cash !== shift.system_cash;
  const diffAmount = shift.closing_cash !== null ? (shift.closing_cash - (shift.system_cash || 0)) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Report Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Laporan Shift Kasir</div>
            <h2 className="text-xl font-extrabold tracking-tight">Shift #{shift.id} - {shift.cashier_name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${shift.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
             {shift.status === 'open' ? 'Masih Terbuka' : 'Selesai'}
           </span>
           <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
             <Download className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Terbuka</div>
            <div className="text-sm font-bold text-slate-700">{format(new Date(shift.opened_at), 'd MMM yyyy, HH:mm')}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tertutup</div>
            <div className="text-sm font-bold text-slate-700">
              {shift.closed_at ? format(new Date(shift.closed_at), 'd MMM yyyy, HH:mm') : '-'}
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Kasir</div>
             <div className="flex items-center gap-2">
               <User className="w-3.5 h-3.5 text-indigo-600" />
               <span className="text-sm font-bold text-slate-700">{shift.cashier_name}</span>
             </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Modal Awal</div>
             <div className="text-sm font-bold text-indigo-700">Rp {shift.opening_cash.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              REKAP PENDAPATAN
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {summary.length === 0 ? (
                <div className="col-span-full p-4 text-center text-slate-400 bg-slate-50 rounded-lg text-sm italic">Belum ada transaksi.</div>
              ) : summary.map((sum) => (
                <div key={sum.payment_method} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm group">
                  <div className="flex items-center justify-between mb-2">
                    {sum.payment_method === 'cash' && <Banknote className="w-5 h-5 text-emerald-500" />}
                    {sum.payment_method === 'transfer' && <CreditCard className="w-5 h-5 text-blue-500" />}
                    {sum.payment_method === 'qris' && <QrCode className="w-5 h-5 text-purple-500" />}
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{sum.transactions} Transaksi</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase mb-0.5">{sum.payment_method}</div>
                  <div className="text-lg font-extrabold text-slate-800 tracking-tight">Rp {sum.revenue.toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600" />
              CLOSING CHECK
            </h3>
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform" />
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Kas Sistem</span>
                  <span className="text-white">Rp {(shift.system_cash || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Kas Fisik</span>
                  <span className="text-white">Rp {(shift.closing_cash || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
                   <div className="text-[10px] font-bold text-indigo-400 uppercase leading-none">SELISIH</div>
                   <div className={`text-2xl font-black italic tracking-tighter ${diffAmount < 0 ? 'text-red-400' : diffAmount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     {diffAmount > 0 ? '+' : ''}{diffAmount.toLocaleString('id-ID')}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">DAFTAR TRANSAKSI SHIFT INI</h3>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
             <table className="w-full text-xs">
               <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                 <tr>
                   <th className="px-4 py-3 text-left">Invoice</th>
                   <th className="px-4 py-3 text-left">Metode</th>
                   <th className="px-4 py-3 text-right">Total</th>
                   <th className="px-4 py-3 text-right">Waktu</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {transactions.length === 0 ? (
                   <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada transaksi di shift ini.</td></tr>
                 ) : transactions.map((t: any) => (
                   <tr key={t.id} className="hover:bg-slate-50/50">
                     <td className="px-4 py-3 font-bold text-slate-800">{t.invoice_number}</td>
                     <td className="px-4 py-3">
                       <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{t.payment_method}</span>
                     </td>
                     <td className="px-4 py-3 text-right font-bold">Rp {t.total.toLocaleString('id-ID')}</td>
                     <td className="px-4 py-3 text-right text-slate-500">{format(new Date(t.created_at), 'HH:mm')}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shifts;
