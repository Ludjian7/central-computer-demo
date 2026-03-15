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
  Download,
  AlertCircle,
  CreditCard,
  Clock
} from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useExportSalesCSV } from '../hooks/useSales';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

import { 
  useReportsSummary, 
  useReportsSalesTrend, 
  useTopProducts, 
  useTechnicianPerformance,
  useLowStockReport,
  useServiceAging
} from '../hooks/useReports';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Colors for Donut Chart
const COLORS = ['#4f46e5', '#f97316']; 

export default function Dashboard() {
  const { user } = useAuth();
  
  // Calculate 30-day range for the trend chart
  const today = new Date();
  const endDateStr = today.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Data Fetching
  const { data: summary, isLoading: isLoadingSummary } = useReportsSummary();
  const { data: trendData, isLoading: isLoadingTrend } = useReportsSalesTrend({ 
    period: 'daily',
    start_date: startDateStr,
    end_date: endDateStr
  });
  const { data: topProducts, isLoading: isLoadingTop } = useTopProducts({ limit: 4 });
  const { data: techPerformance, isLoading: isLoadingTech } = useTechnicianPerformance();
  const { data: lowStock, isLoading: isLoadingLowStock } = useLowStockReport();
  const { data: agingServices, isLoading: isLoadingAging } = useServiceAging(3); // > 3 days
  const { mutate: exportCSV, isPending: isExporting } = useExportSalesCSV();

  const isLoading = isLoadingSummary || isLoadingTrend || isLoadingTop || isLoadingTech || isLoadingLowStock || isLoadingAging;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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

  // Data preparation for charts & KPI
  const revenueSplit = [
    { name: 'Produk FIsik', value: summary?.product_revenue || 0 },
    { name: 'Jasa Servis', value: summary?.service_revenue || 0 },
  ];
  const totalRevenueSplit = (summary?.product_revenue || 0) + (summary?.service_revenue || 0);

  const targetPercentage = summary?.monthly_target ? (summary?.total_revenue / summary?.monthly_target) * 100 : 0;
  const progressWidth = Math.min(targetPercentage, 100);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Ringkasan performa bisnis dan insight operasional.</p>
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
      
      {/* ROW 1: Metrics Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Pendapatan + Growth */}
        <MetricCard 
          title="Pendapatan Bulan Ini" 
          value={formatCurrency(summary?.total_revenue)} 
          icon={<DollarSign size={24} className="text-[#52c46a]" />}
          trend={`${Math.abs(summary?.revenue_growth_pct || 0)}% dari bulan lalu`}
          trendUp={(summary?.revenue_growth_pct || 0) >= 0}
          bgColor="bg-green-50"
        />
        {/* Total Transaksi + Growth */}
        <MetricCard 
          title="Transaksi Bulan Ini" 
          value={String(summary?.total_transactions || 0)} 
          icon={<ShoppingCart size={24} className="text-blue-500" />}
          trend={`${Math.abs(summary?.transactions_growth_pct || 0)}% dari bulan lalu`}
          trendUp={(summary?.transactions_growth_pct || 0) >= 0}
          bgColor="bg-blue-50"
        />
        {/* Servis Aktif + Completion Rate */}
        <MetricCard 
          title="Servis Berjalan" 
          value={String(summary?.active_services || 0)} 
          icon={<Wrench size={24} className="text-indigo-500" />}
          trend={`${summary?.service_completion_rate || 0}% Completion Rate`}
          trendUp={true}
          bgColor="bg-indigo-50"
        />
        {/* Piutang Pending */}
        <MetricCard 
          title="Piutang Pending" 
          value={formatCurrency(summary?.pending_revenue || 0)} 
          subtitle={`${summary?.pending_transactions || 0} Invoice`}
          icon={<CreditCard size={24} className="text-red-500" />}
          trend="Belum dilunasi"
          trendUp={false}
          bgColor="bg-red-50"
        />
      </motion.div>

      {/* ROW 2: Charts Section */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Chart: Tren Penjualan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#52c46a]" />
                Tren Penjualan (Harian)
              </h2>
            </div>
            {summary?.revenue_growth_pct ? (
              <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${summary.revenue_growth_pct >= 0 ? 'text-[#52c46a] bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {summary.revenue_growth_pct >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{Math.abs(summary.revenue_growth_pct)}%</span>
              </div>
            ) : null}
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

        {/* Secondary: Split Revenue & Monthly Target */}
        <div className="flex flex-col gap-6">
          {/* Revenue Split */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Porsi Pendapatan</h2>
            <div className="h-[180px] w-full flex items-center justify-center relative">
              {totalRevenueSplit > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSplit}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {revenueSplit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400 text-sm">Belum ada data</div>
              )}
              {/* Center Text */}
              {totalRevenueSplit > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-gray-400 font-medium">Bulan Ini</span>
                  <span className="text-sm font-bold text-gray-800">
                    {summary?.product_revenue ? Math.round((summary.product_revenue / totalRevenueSplit)*100) : 0}% Produk
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 text-xs font-medium text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#4f46e5]"></div>
                Produk
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
                Servis
              </div>
            </div>
          </div>

          {/* Monthly Target */}
          <div className="bg-[#1a2b4c] p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-16 h-16 bg-indigo-500 opacity-20 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-sm font-semibold text-indigo-200 mb-1">Target Pendapatan Bulan Ini</h2>
              
              <div className="mb-2 mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{formatCurrency(summary?.total_revenue || 0)}</span>
              </div>
              <p className="text-xs text-indigo-300 mb-4 font-mono">/ {formatCurrency(summary?.monthly_target || 0)}</p>
              
              <div className="w-full bg-white/10 rounded-full h-2.5 mb-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressWidth}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-indigo-400 to-[#52c46a] h-full rounded-full"
                ></motion.div>
              </div>
              <div className="flex justify-between text-[10px] text-indigo-300 font-mono">
                <span>0%</span>
                <span className="text-white font-bold">{targetPercentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ROW 3: Operational Action Items */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Low Stock Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-600"/>
              Stok Menipis ({summary?.low_stock_items || 0} Item)
            </h2>
            <Link to="/purchase-orders" className="text-xs font-semibold bg-white text-orange-600 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-600 hover:text-white transition-colors">
              Buat PO
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-500 uppercase bg-white sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-2 font-medium">SKU / Nama Produk</th>
                  <th className="px-4 py-2 font-medium text-center">Stok</th>
                  <th className="px-4 py-2 font-medium text-right">Kurang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(lowStock || []).slice(0,5).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-mono text-gray-400">{item.sku}</div>
                      <div className="font-medium text-gray-800">{item.name}</div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                        {item.current_stock}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">/ {item.min_stock}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-orange-600 font-bold">
                      -{item.shortage}
                    </td>
                  </tr>
                ))}
                {(!lowStock || lowStock.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Semua stok produk aman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aging Services Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden flex flex-col">
          <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-red-800 flex items-center gap-2">
              <Clock size={18} className="text-red-600"/>
              Servis Overdue (&gt;3 Hari)
            </h2>
            <Link to="/services" className="text-xs font-semibold bg-white text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white transition-colors">
              Lihat Servis
            </Link>
          </div>
          <div className="p-0 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-500 uppercase bg-white sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-2 font-medium">Customer / Barang</th>
                  <th className="px-4 py-2 font-medium">Teknisi</th>
                  <th className="px-4 py-2 font-medium text-right">Tertunda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(agingServices || []).slice(0,5).map((srv: any) => (
                  <tr key={srv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-gray-800">{srv.customer_name}</div>
                      <div className="text-xs text-gray-500">{srv.product_name}</div>
                      <div className="text-[10px] font-mono text-gray-400">{srv.invoice_number}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded inline-flex items-center gap-1 border border-gray-200">
                         {srv.technician_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                        <AlertCircle size={12}/> {srv.age_days} Hari
                      </span>
                    </td>
                  </tr>
                ))}
                {(!agingServices || agingServices.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Tidak ada servis yang overdue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ROW 4: Tables Section (Original KPIs) */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-md font-bold text-gray-800">Produk & Jasa Terlaris</h2>
            <Link to="/reports" className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Laporan Laba Rugi</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium text-right">Terjual</th>
                  <th className="px-5 py-3 font-medium text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(topProducts || []).map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase flex gap-2">
                        <span>{product.type}</span>
                        {product.product_sku && <span className="text-gray-400">{product.product_sku}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">{product.quantity_sold}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-900 font-medium whitespace-nowrap">
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
            <h2 className="text-md font-bold text-gray-800">Performa Teknisi</h2>
            <Link to="/users" className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Kelola User</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Teknisi</th>
                  <th className="px-5 py-3 font-medium text-center">Total Servis</th>
                  <th className="px-5 py-3 font-medium text-right">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(techPerformance || []).map((tech: any) => (
                  <tr key={tech.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {tech.username?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{tech.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-gray-700">{tech.total_services}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono text-indigo-600 font-bold">{tech.completed_services}</span>
                        <span className="text-[10px] text-gray-400">
                          ({tech.total_services > 0 ? Math.round((tech.completed_services/tech.total_services)*100) : 0}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!techPerformance || techPerformance.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">
                      Belum ada data pengerjaan teknisi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Subcomponents ---

function MetricCard({ title, value, subtitle, icon, trend, trendUp, bgColor }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border ${
          trendUp ? 'text-green-700 bg-green-50 border-green-100' : 'text-red-700 bg-red-50 border-red-100'
        }`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend}</span>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</p>
          {subtitle && <span className="text-sm font-medium text-gray-500 mb-1">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  );
}
