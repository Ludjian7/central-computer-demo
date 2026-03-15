import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, PieChart, Download, Calendar, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { useProfitLoss } from '../hooks/useReports';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import LoadingSkeleton from '../components/LoadingSkeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: plData, isLoading } = useProfitLoss(dateRange.start, dateRange.end);

  if (isLoading) return <LoadingSkeleton />;

  const summary = plData?.summary;
  const byCategory = plData?.by_category || [];
  const byPeriod = plData?.by_period || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h1>
          <p className="text-gray-500">Analisis performa keuangan dan profitabilitas</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg text-gray-800">
                <Calendar size={18} className="text-gray-400" />
                <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm outline-none bg-transparent"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm outline-none bg-transparent"
                />
            </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Pendapatan</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary?.total_revenue || 0)}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Total HPP (COGS)</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary?.total_cogs || 0)}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-start mb-4 text-gray-800">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${summary!.gross_margin_pct >= 20 ? 'text-green-600' : 'text-orange-600'}`}>
               Margin {summary?.gross_margin_pct}%
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Laba Kotor (Gross Profit)</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary?.gross_profit || 0)}</h3>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Tren Pendapatan vs HPP
          </h3>
          <div className="h-80 box-border">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000000}jt`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Pendapatan" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="cogs" name="HPP" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-600" />
            Breakdown Laba per Kategori
          </h3>
          <div className="overflow-x-auto text-gray-800">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Pendapatan</th>
                  <th className="pb-3">Laba</th>
                  <th className="pb-3">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-800">
                {byCategory.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-800">{cat.category}</td>
                    <td className="py-4 text-sm text-gray-600">{formatCurrency(cat.revenue)}</td>
                    <td className="py-4 text-sm font-semibold text-green-600">{formatCurrency(cat.gross_profit)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${Math.min(cat.margin_pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{cat.margin_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
