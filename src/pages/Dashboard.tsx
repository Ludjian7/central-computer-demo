import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  ShoppingCart, 
  Wrench, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useExportSalesCSV } from '../hooks/useSales';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import { 
  useReportsSummary, 
  useReportsSalesTrend, 
  useTopProducts, 
  useTechnicianPerformance 
} from '../hooks/useReports';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: isLoadingSummary } = useReportsSummary();
  const { data: trendData, isLoading: isLoadingTrend } = useReportsSalesTrend({ period: 'daily' });
  const { data: topProducts, isLoading: isLoadingTop } = useTopProducts({ limit: 4 });
  const { data: techPerformance, isLoading: isLoadingTech } = useTechnicianPerformance();
  const { mutate: exportCSV, isPending: isExporting } = useExportSalesCSV();

  const isLoading = isLoadingSummary || isLoadingTrend || isLoadingTop || isLoadingTech;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="h-full">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Ringkasan aktivitas dan performa bisnis hari ini.</p>
        </div>
        <button 
          onClick={() => exportCSV({})}
          disabled={isExporting}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download size={18} />
          <span>{isExporting ? 'Mengekspor...' : 'Export Laporan (CSV)'}</span>
        </button>
      </div>
      
      {/* Metrics Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard 
          title="Total Pendapatan" 
          value={formatCurrency(summary?.total_revenue || 0)} 
          icon={<DollarSign size={24} className="text-[#52c46a]" />}
          trend="Bulan ini"
          trendUp={true}
          bgColor="bg-green-50"
        />
        <MetricCard 
          title="Total Transaksi" 
          value={String(summary?.total_transactions || 0)} 
          icon={<ShoppingCart size={24} className="text-blue-500" />}
          trend="Bulan ini"
          trendUp={true}
          bgColor="bg-blue-50"
        />
        <MetricCard 
          title="Servis Aktif" 
          value={String(summary?.active_services || 0)} 
          icon={<Wrench size={24} className="text-orange-500" />}
          trend="Sedang berjalan"
          trendUp={true}
          bgColor="bg-orange-50"
        />
        <MetricCard 
          title="Stok Menipis" 
          value={String(summary?.low_stock_items || 0)} 
          icon={<AlertTriangle size={24} className="text-red-500" />}
          trend="Perlu restock"
          trendUp={false}
          bgColor="bg-red-50"
        />
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Tren Penjualan</h2>
              <p className="text-sm text-gray-500">7 Hari Terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#52c46a] bg-green-50 px-3 py-1 rounded-full">
              <TrendingUp size={16} />
              <span>+8.3%</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c46a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#52c46a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => value >= 1000000 ? `Rp${value / 1000000}M` : `Rp${value / 1000}`}
                  dx={-10}
                />
                <Tooltip 
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#52c46a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart / Info */}
        <div className="bg-[#1a2b4c] p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-[#52c46a] opacity-20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-gray-200 mb-1">Target Bulanan</h2>
            <p className="text-sm text-gray-400 mb-6">Maret 2026</p>
            
            <div className="mb-2 flex justify-between items-end">
              <span className="text-3xl font-bold">{formatCurrency(125000000)}</span>
            </div>
            <p className="text-sm text-gray-400 mb-8">dari target {formatCurrency(150000000)}</p>
            
            <div className="w-full bg-white/10 rounded-full h-3 mb-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '83%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-[#52c46a] to-[#e88124] h-3 rounded-full"
              ></motion.div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>0%</span>
              <span>83% Tercapai</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tables Section */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Produk Terlaris</h2>
            <button className="text-sm text-[#52c46a] font-medium hover:text-[#45a659]">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Produk</th>
                  <th className="px-5 py-3 font-medium text-right">Terjual</th>
                  <th className="px-5 py-3 font-medium text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(topProducts || []).map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 uppercase">{product.type}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{product.quantity_sold}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900 font-medium">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technician Performance Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Performa Teknisi</h2>
            <button className="text-sm text-[#52c46a] font-medium hover:text-[#45a659]">Detail</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Teknisi</th>
                  <th className="px-5 py-3 font-medium text-center">Selesai</th>
                  <th className="px-5 py-3 font-medium text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(techPerformance || []).map((tech: any) => (
                  <tr key={tech.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                          {tech.username?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{tech.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-gray-700">{tech.completed_services}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-md font-mono text-xs font-medium">
                        ★ {5.0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Subcomponents ---

function MetricCard({ title, value, icon, trend, trendUp, bgColor }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
        }`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend}</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
